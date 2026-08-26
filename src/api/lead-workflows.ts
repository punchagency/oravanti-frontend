import { API } from ".";
import type { DocumentAiReview } from "./questionnaires";

export type LeadTaskStatus =
  | "pending"
  | "in_progress"
  | "in_review"
  | "completed"
  | "skipped"
  // Terminal until the assignee reopens it. Rejection used to drop a task
  // straight back to `in_progress`, which told them nothing.
  | "rejected";

/**
 * A pipeline task joined to the lead it hangs off.
 *
 * Only the cross-lead projections use this — "my tasks" and the review queue,
 * which list one person's or one firm's tasks across many leads and need the
 * lead's name to be readable. A single lead's board reads plain `Task`s from
 * `@/api/tasks`; this is not a second vocabulary for the same thing.
 */
export interface LeadTask {
  id: string;
  leadId: string;
  organizationId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  pipelineStage: string;
  actionType?: string | null;
  isRequired: boolean;
  status: LeadTaskStatus;
  assignedToId: string | null;
  assignedAt: string | null;
  completedById: string | null;
  completedAt: string | null;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  staff: { id: string; name: string; role: string } | null;
  lead: { id: string; name: string; email: string; pipelineStage: string } | null;
}

/**
 * One row of a lead's timeline.
 *
 * The same rows as `LeadAuditLogEntry` in the same vocabulary — the timeline
 * groups them by day and the audit tab pages through them flat. `action` is a
 * registry name; render `label` and `summary`, never a re-cased variant.
 */
export interface LeadTimelineEvent {
  id: string;
  action: string;
  /** The registry's display name for `action`. */
  label: string;
  /** The sentence written when the event happened. */
  summary: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  /** `staff.id`, or null when the system or the lead acted. */
  actorId: string | null;
  /** The name as it stood then — never a live lookup. */
  actorName: string | null;
  createdAt: string;
}

/**
 * One row of a lead's activity feed.
 *
 * `action` is a registry name (`"lead.stage_changed"`) — the same string the
 * backend call site used and the same string stored in the column. Render
 * `label` and `summary`; never re-derive either from `action`, and never key a
 * lookup on a re-cased variant of it. See `@/lib/audit`.
 */
export interface LeadAuditLogEntry {
  id: string;
  action: string;
  /** The registry's display name for `action`, e.g. "Stage changed". */
  label: string;
  /** The sentence written when the event happened, in the vocabulary of the time. */
  summary: string;
  /** `staff.id`, or null for a system or lead-driven event. */
  actorId: string | null;
  /** The name as it stood then — never a live lookup, so renames cannot rewrite history. */
  actorName: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface LeadDocumentLink {
  id: string;
  documentId: string;
  leadId: string;
  linkedByUserId: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  title: string;
  status: string;
  category: string | null;
  originalFileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  versionNumber: number | null;
}

export async function getMyLeadTasks(): Promise<LeadTask[]> {
  const { data } = await API.get<{ data: LeadTask[] }>("/leads/my-tasks");
  return data.data;
}

export async function initializePipeline(leadId: string): Promise<LeadTask[]> {
  const { data } = await API.post<{ data: LeadTask[] }>(`/leads/${leadId}/initialize-pipeline`);
  return data.data;
}

// One lead's intake tasks are read through `getTasks({ leadId, source })` in
// `@/api/tasks` — the unified surface over the one `tasks` table. The write
// endpoints below stay lead-scoped: they also write the lead's own timeline
// under the `lead.task_*` vocabulary, which `/tasks` knows nothing about.

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getLeadTimeline(
  leadId: string,
  page = 1,
  limit = 20,
): Promise<PaginatedResponse<LeadTimelineEvent>> {
  const { data } = await API.get<{ data: LeadTimelineEvent[]; pagination: PaginatedResponse<LeadTimelineEvent>["pagination"] }>(
    `/leads/${leadId}/timeline`,
    { params: { page, limit } },
  );
  return { data: data.data, pagination: data.pagination };
}

export async function getLeadAuditLog(
  leadId: string,
  page = 1,
  limit = 20,
): Promise<PaginatedResponse<LeadAuditLogEntry>> {
  const { data } = await API.get<{ data: LeadAuditLogEntry[]; pagination: PaginatedResponse<LeadAuditLogEntry>["pagination"] }>(
    `/leads/${leadId}/audit-log`,
    { params: { page, limit } },
  );
  return { data: data.data, pagination: data.pagination };
}

// `createLeadTimelineEvent` was removed with the `POST /leads/:leadId/timeline`
// route it called. An audit table must not be user-writable: that endpoint took
// an arbitrary event type, title and metadata from the caller and appended them
// to the same trail the system writes to, which makes the trail unciteable.

export async function getLeadDocuments(leadId: string): Promise<LeadDocumentLink[]> {
  const { data } = await API.get<{ data: LeadDocumentLink[] }>(`/leads/${leadId}/documents`);
  return data.data;
}

export async function linkLeadDocument(leadId: string, documentId: string): Promise<LeadDocumentLink> {
  const { data } = await API.post<{ data: LeadDocumentLink }>(`/leads/${leadId}/documents`, { documentId });
  return data.data;
}

export async function unlinkLeadDocument(leadId: string, linkId: string): Promise<void> {
  await API.delete(`/leads/${leadId}/documents/${linkId}`);
}

// ─── Questionnaire Files for Lead ────────────────────────────────────────────

export interface QuestionnaireFile {
  id: string;
  organizationId: string;
  responseId: string;
  leadId: string | null;
  questionId: string;
  questionSource: string;
  documentId: string;
  storagePath: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  originalFilename: string;
  /** What AI review makes of this document — see DocumentAiReview. */
  aiReview: DocumentAiReview;
  createdAt: string;
}

export async function getLeadQuestionnaireFiles(leadId: string): Promise<QuestionnaireFile[]> {
  const { data } = await API.get<{ data: QuestionnaireFile[] }>(`/questionnaires/leads/${leadId}/documents`);
  return data.data;
}

// ─── Lead Notes ──────────────────────────────────────────────────────────────

export type LeadNoteType = "general" | "phone_call" | "email" | "voicemail" | "system_log" | "pre_consultation" | "post_consultation";

export type LeadNoteContext = "manual" | "consultation" | "lead_update" | "intake" | "system";

export type LeadNoteVisibility = "all_staff" | "attorneys_only" | "admins_only";

export interface LeadNote {
  id: string;
  leadId: string;
  authorId: string;
  type: LeadNoteType;
  context: LeadNoteContext;
  visibility: LeadNoteVisibility;
  isPinned: boolean;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorName: string | null;
  authorRole: string | null;
}

export interface CreateLeadNoteParams {
  content: string;
  type?: LeadNoteType;
  context?: LeadNoteContext;
  visibility?: LeadNoteVisibility;
  isPinned?: boolean;
}

export async function getLeadNotes(
  leadId: string,
  opts?: { context?: string; authorId?: string; pinnedOnly?: boolean; page?: number; limit?: number },
): Promise<PaginatedResponse<LeadNote>> {
  const params: Record<string, string> = {};
  if (opts?.context) params.context = opts.context;
  if (opts?.authorId) params.authorId = opts.authorId;
  if (opts?.pinnedOnly) params.pinned = "true";
  if (opts?.page) params.page = String(opts.page);
  if (opts?.limit) params.limit = String(opts.limit);
  const { data } = await API.get<{ data: LeadNote[]; pagination: PaginatedResponse<LeadNote>["pagination"] }>(
    `/leads/${leadId}/notes`,
    { params },
  );
  return { data: data.data, pagination: data.pagination };
}

export async function createLeadNote(leadId: string, params: CreateLeadNoteParams): Promise<LeadNote> {
  const { data } = await API.post<{ data: LeadNote }>(`/leads/${leadId}/notes`, params);
  return data.data;
}

export async function updateLeadNote(leadId: string, noteId: string, params: { content?: string; type?: LeadNoteType; visibility?: LeadNoteVisibility; isPinned?: boolean }): Promise<LeadNote> {
  const { data } = await API.patch<{ data: LeadNote }>(`/leads/${leadId}/notes/${noteId}`, params);
  return data.data;
}

export async function deleteLeadNote(leadId: string, noteId: string): Promise<void> {
  await API.delete(`/leads/${leadId}/notes/${noteId}`);
}

export async function toggleLeadNotePin(leadId: string, noteId: string): Promise<LeadNote> {
  const { data } = await API.post<{ data: LeadNote }>(`/leads/${leadId}/notes/${noteId}/toggle-pin`);
  return data.data;
}

// The cross-lead task lists moved to `@/api/task-queue` — one shape shared with
// the case side, so one card renders the review queue and My Tasks for both.
