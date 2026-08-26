import { API } from "./index";

// ─── Types ──────────────────────────────────────────────────────────────────────

export type CaseNoteContext = "notes_tab" | "workflow_step" | "task" | "lead_conversion" | "system";

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WorkflowStepInstance {
  stepId: string;
  title: string;
  status: "pending" | "in_progress" | "in_review" | "completed" | "skipped" | "rejected";
  assignedTo: { id: string; name: string; role: string } | null;
  dueDate: string | null;
  completedAt: string | null;
  notes: string;
}

export interface WorkflowModuleInstance {
  moduleId: string;
  name: string;
  phase: string;
  orderIndex: number;
  activationType: "auto" | "conditional" | "manual";
  activationCondition: string | null;
  status: "locked" | "active" | "completed";
  steps: WorkflowStepInstance[];
}

export interface CaseWorkflowInstance {
  caseId: string;
  modules: WorkflowModuleInstance[];
  startedAt: string | null;
}

export interface WorkflowSummary {
  templateName: string;
  totalSteps: number;
  completedSteps: number;
  percentage: number;
  currentModuleName: string | null;
  currentModuleId: string | null;
}

export interface TimelineEvent {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdBy: { id: string; name: string } | null;
  createdAt: string;
}

// ─── Case Notes ────────────────────────────────────────────────────────────────

export interface CaseNote {
  id: string;
  caseId: string;
  workflowModuleId: string | null;
  taskId: string | null;
  category: "client_communication" | "internal_strategy" | "medical_update" | "intake_screening" | "ops_review_feedback";
  visibility: "all_staff" | "attorneys_only" | "admins_only";
  isPinned: boolean;
  context: CaseNoteContext;
  content: string;
  isEdited: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  authorName: string | null;
  authorRole: string | null;
}

export interface CreateCaseNoteParams {
  workflowModuleId?: string;
  taskId?: string;
  category?: string;
  visibility?: string;
  isPinned?: boolean;
  context?: CaseNoteContext;
  content: string;
}

export interface UpdateCaseNoteParams {
  content?: string;
  category?: string;
  visibility?: string;
  isPinned?: boolean;
}

// ─── API Calls ───────────────────────────────────────────────────────────────────

export async function getCaseWorkflow(caseId: string): Promise<CaseWorkflowInstance> {
  const { data } = await API.get<{ data: CaseWorkflowInstance }>(`/cases/${caseId}/workflow`);
  return data.data;
}

export async function getWorkflowSummary(caseId: string): Promise<WorkflowSummary> {
  const { data } = await API.get<{ data: WorkflowSummary }>(`/cases/${caseId}/workflow/summary`);
  return data.data;
}

// The per-step verbs — complete, submit, approve, reject, reopen, assign — are
// `transitionTask`/`assignTask` in `@/api/tasks`. One lifecycle for case steps,
// intake steps and ad-hoc to-dos; the backend still writes the case timeline.

export async function activateModule(
  caseId: string,
  moduleId: string,
): Promise<CaseWorkflowInstance> {
  const { data } = await API.post<{ data: CaseWorkflowInstance }>(
    `/cases/${caseId}/workflow/modules/${moduleId}/activate`,
  );
  return data.data;
}

export async function getCaseTimeline(
  caseId: string,
  page?: number,
  limit?: number,
): Promise<PaginatedResponse<TimelineEvent>> {
  const params: Record<string, string> = {};
  if (page) params.page = String(page);
  if (limit) params.limit = String(limit);
  const { data } = await API.get<{ data: TimelineEvent[]; pagination: any }>(
    `/cases/${caseId}/workflow/timeline`,
    { params },
  );
  return { data: data.data, pagination: data.pagination };
}

export interface WorkflowLogEntry {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  performedBy: { id: string; name: string } | null;
  createdAt: string;
}

export async function getWorkflowLogs(
  caseId: string,
  page?: number,
  limit?: number,
): Promise<PaginatedResponse<WorkflowLogEntry>> {
  const params: Record<string, string> = {};
  if (page) params.page = String(page);
  if (limit) params.limit = String(limit);
  const { data } = await API.get<{ data: WorkflowLogEntry[]; pagination: any }>(
    `/cases/${caseId}/workflow/logs`,
    { params },
  );
  return { data: data.data, pagination: data.pagination };
}

// The cross-case task lists moved to `@/api/task-queue` — one shape for the
// review queue and My Tasks, on both the case and intake sides.

// ─── Case Documents API ──────────────────────────────────────────────────────

export interface CaseDocument {
  id: string;
  title: string;
  name: string;
  category: string | null;
  status: string;
  permission: string | null;
  createdAt: string;
  updatedAt: string;
  currentVersion: {
    id: string;
    versionNumber: number;
    fileSize: number;
    mimeType: string;
    originalFileName: string;
    /** Pre-signed and short-lived — the server mints it per request. */
    fileUrl: string | null;
    virusScanStatus: string | null;
  } | null;
  case: {
    id: string;
    caseType: string;
  } | null;
  client: {
    id: string;
    name: string;
  } | null;
}

export interface PaginatedDocumentsResponse {
  data: CaseDocument[];
  pagination: { total: number; limit: number; offset: number };
}

export async function getCaseDocuments(
  caseId: string,
  page?: number,
  limit?: number,
): Promise<PaginatedDocumentsResponse> {
  const params: Record<string, string> = {};
  if (page) params.page = String(page);
  if (limit) params.limit = String(limit);
  const { data: res } = await API.get(`/cases/${caseId}/documents`, { params });
  return { data: res.data, pagination: res.pagination };
}

// ─── Case Notes API ─────────────────────────────────────────────────────────────

export interface GetCaseNotesParams {
  page?: number;
  limit?: number;
  context?: CaseNoteContext;
  authorId?: string;
  pinnedOnly?: boolean;
}

export async function getCaseNotes(
  caseId: string,
  params?: GetCaseNotesParams,
): Promise<PaginatedResponse<CaseNote>> {
  const queryParams: Record<string, string> = {};
  if (params?.page) queryParams.page = String(params.page);
  if (params?.limit) queryParams.limit = String(params.limit);
  if (params?.context) queryParams.context = params.context;
  if (params?.authorId) queryParams.authorId = params.authorId;
  if (params?.pinnedOnly) queryParams.pinnedOnly = "true";
  const { data } = await API.get<{ data: CaseNote[]; pagination: any }>(
    `/cases/${caseId}/workflow/notes`,
    { params: queryParams },
  );
  return { data: data.data, pagination: data.pagination };
}

export async function toggleCaseNotePin(
  caseId: string,
  noteId: string,
): Promise<CaseNote> {
  const { data } = await API.post<{ data: CaseNote }>(
    `/cases/${caseId}/workflow/notes/${noteId}/toggle-pin`,
  );
  return data.data;
}

export async function bulkDeleteCaseNotes(
  caseId: string,
  noteIds: string[],
): Promise<void> {
  await API.post(`/cases/${caseId}/workflow/notes/bulk-delete`, { noteIds });
}

export async function bulkPinCaseNotes(
  caseId: string,
  noteIds: string[],
  pinned: boolean,
): Promise<void> {
  await API.post(`/cases/${caseId}/workflow/notes/bulk-pin`, { noteIds, pinned });
}

export async function createCaseNote(
  caseId: string,
  params: CreateCaseNoteParams,
): Promise<CaseNote> {
  const { data } = await API.post<{ data: CaseNote }>(`/cases/${caseId}/workflow/notes`, params);
  return data.data;
}

export async function updateCaseNote(
  caseId: string,
  noteId: string,
  params: UpdateCaseNoteParams,
): Promise<CaseNote> {
  const { data } = await API.patch<{ data: CaseNote }>(
    `/cases/${caseId}/workflow/notes/${noteId}`,
    params,
  );
  return data.data;
}

export async function deleteCaseNote(
  caseId: string,
  noteId: string,
): Promise<void> {
  await API.delete(`/cases/${caseId}/workflow/notes/${noteId}`);
}

// ─── Case Events (Unified Audit Trail) ───────────────────────────────────────

/**
 * One row of a matter's activity feed.
 *
 * `action` is a registry name (`"case.step_approved"`) — the same string the
 * backend call site used and the same string stored in the column. Render
 * `label` and `summary`; never re-derive either from `action`, and never key a
 * lookup on a re-cased variant of it. See `@/lib/audit`.
 */
export interface CaseEvent {
  id: string;
  action: string;
  /** The registry's display name for `action`, e.g. "Step approved". */
  label: string;
  /** The sentence written when the event happened, in the vocabulary of the time. */
  summary: string;
  /** `staff.id`, or null for a system event. */
  actorId: string | null;
  /** The name as it stood then — never a live lookup, so renames cannot rewrite history. */
  actorName: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export async function getCaseEvents(
  caseId: string,
  page?: number,
  limit?: number,
): Promise<PaginatedResponse<CaseEvent>> {
  const params: Record<string, string> = {};
  if (page) params.page = String(page);
  if (limit) params.limit = String(limit);
  const { data } = await API.get<{ data: CaseEvent[]; pagination: any }>(
    `/cases/${caseId}/audit-log`,
    { params },
  );
  return { data: data.data, pagination: data.pagination };
}

// ─── Workflow templates ──────────────────────────────────────────────────────

/**
 * A `Condition` as the backend stores it — a closed vocabulary, not free-form
 * JSON. Mirrors `ConditionField` in `oravanti-be/src/db/schema/workflow.ts`;
 * `describeCondition` in the workflow tab turns one into the sentence a
 * paralegal reads when a module hasn't unlocked yet.
 */
export type ConditionField =
  | "immigrationDetails.filingTrack"
  | "immigrationDetails.naturalizationTrack"
  | "immigrationDetails.isConditionalResidence"
  | "immigrationDetails.priorityDateIsCurrent"
  | "personalInjuryDetails.defendantType"
  | "personalInjuryDetails.isMinorPlaintiff"
  | "case.priority";

export type Condition =
  | { field: ConditionField; op: "eq" | "neq"; value: string | boolean }
  | { field: ConditionField; op: "in"; value: string[] }
  | { allOf: Condition[] }
  | { anyOf: Condition[] };

export interface WorkflowTemplateStep {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  isRequired: boolean;
  /** Part of the system backbone. A firm cannot weaken it without a rationale. */
  isLocked: boolean;
  dueDateAnchor: string | null;
  /** Signed: negative is *before* the anchor. */
  dueDateOffsetDays: number | null;
  requiredCertifications: string[];
  /** Dynamic RBAC role names — render with the existing role picker, don't invent a vocabulary. */
  assignableRoles: string[];
}

export interface WorkflowTemplateModule {
  id: string;
  templateId: string;
  name: string;
  description: string | null;
  phase: string;
  orderIndex: number;
  activationType: "auto" | "conditional" | "manual";
  activationCondition: Condition | null;
  assignableRoles: string[];
  steps: WorkflowTemplateStep[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  caseTypeId: string;
  /** `null` = the shared system default. Non-null = this firm's own clone. */
  organizationId: string | null;
  isActive: boolean;
  modules: WorkflowTemplateModule[];
}

export interface UpdateWorkflowModuleParams {
  name?: string;
  description?: string | null;
  phase?: string;
  activationType?: "auto" | "conditional" | "manual";
  activationCondition?: Condition | null;
  orderIndex?: number;
}

/** The template a case of this type materializes from: the firm's own if any, else the system default. */
export async function getWorkflowTemplate(caseTypeId: string): Promise<WorkflowTemplate> {
  const { data } = await API.get<{ data: WorkflowTemplate }>("/workflow-templates", {
    params: { caseTypeId },
  });
  return data.data;
}

/** A firm's first edit clones the shared default rather than mutating it. */
export async function cloneWorkflowTemplate(templateId: string): Promise<WorkflowTemplate> {
  const { data } = await API.post<{ data: WorkflowTemplate }>(
    `/workflow-templates/${templateId}/clone`,
  );
  return data.data;
}

export async function updateWorkflowModule(
  templateId: string,
  moduleId: string,
  params: UpdateWorkflowModuleParams,
): Promise<WorkflowTemplateModule> {
  const { data } = await API.patch<{ data: WorkflowTemplateModule }>(
    `/workflow-templates/${templateId}/modules/${moduleId}`,
    params,
  );
  return data.data;
}

// ─── Case linking & mandamus candidacy ───────────────────────────────────────

export type CaseRelationType = "mandamus" | "appeal" | "related_matter";

/** One outstanding form, against USCIS's published median for it and the office. */
export interface FormDelay {
  formCode: string;
  pendingSince: string;
  /**
   * False when the form's own filing date is blank and the matter's was used
   * instead, so the UI can mark the figure approximate rather than presenting
   * a fallback as fact.
   */
  pendingSinceIsFormDate: boolean;
  daysPending: number;
  medianDays: number | null;
  delayRatio: number | null;
}

/**
 * Days pending against USCIS's published median, one row per outstanding form.
 *
 * Per form because USCIS adjudicates per form: the I-765 routinely lands months
 * before the I-485 it was filed with, and a single figure for "the matter"
 * would average away the one that has actually stalled.
 *
 * Figures for an attorney to read, never a trigger. `delayRatio` is `null` when
 * no processing-time reference matches — that means *unknown*, not "not
 * delayed", and the UI must not render it as zero.
 */
export interface MandamusCandidacy {
  /** Longest-overdue first. Empty when nothing is awaiting adjudication. */
  forms: FormDelay[];
  mostDelayed: FormDelay | null;
}

export async function getMandamusCandidacy(caseId: string): Promise<MandamusCandidacy> {
  const { data } = await API.get<{ data: MandamusCandidacy }>(
    `/cases/${caseId}/mandamus-candidacy`,
  );
  return data.data;
}

export async function linkCase(
  parentCaseId: string,
  childCaseId: string,
  relationType: CaseRelationType,
): Promise<unknown> {
  const { data } = await API.post<{ data: unknown }>(`/cases/${parentCaseId}/link`, {
    childCaseId,
    relationType,
  });
  return data.data;
}

/** Removes THIS case's link to its parent — the child is the one addressed. */
export async function unlinkCase(childCaseId: string): Promise<unknown> {
  const { data } = await API.delete<{ data: unknown }>(`/cases/${childCaseId}/link`);
  return data.data;
}
