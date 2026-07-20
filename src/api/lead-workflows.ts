import { API } from ".";

export type LeadTaskStatus = "pending" | "in_progress" | "in_review" | "completed" | "skipped";

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

export interface LeadTaskInput {
  title: string;
  description?: string;
  orderIndex: number;
  pipelineStage: string;
  isRequired?: boolean;
  assignedToId?: string;
  dueDate?: string;
}

export interface LeadTimelineEvent {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdBy: { id: string; name: string } | null;
  createdAt: string;
}

export interface LeadAuditLogEntry {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  performedBy: { id: string; name: string } | null;
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

export async function getLeadTasks(leadId: string): Promise<LeadTask[]> {
  const { data } = await API.get<{ data: LeadTask[] }>(`/leads/${leadId}/tasks`);
  return data.data;
}

export async function createLeadTask(leadId: string, input: LeadTaskInput): Promise<LeadTask> {
  const { data } = await API.post<{ data: LeadTask }>(`/leads/${leadId}/tasks`, input);
  return data.data;
}

export async function updateLeadTask(leadId: string, taskId: string, input: Partial<LeadTaskInput & { notes: string }>): Promise<LeadTask> {
  const { data } = await API.patch<{ data: LeadTask }>(`/leads/${leadId}/tasks/${taskId}`, input);
  return data.data;
}

export async function updateLeadTaskStatus(leadId: string, taskId: string, status: LeadTaskStatus): Promise<LeadTask> {
  const { data } = await API.patch<{ data: LeadTask }>(`/leads/${leadId}/tasks/${taskId}/status`, { status });
  return data.data;
}

export async function assignLeadTask(leadId: string, taskId: string, assignedToId: string): Promise<LeadTask> {
  const { data } = await API.patch<{ data: LeadTask }>(`/leads/${leadId}/tasks/${taskId}/assign`, { assignedToId });
  return data.data;
}

export async function completeLeadTask(leadId: string, taskId: string): Promise<LeadTask> {
  const { data } = await API.post<{ data: LeadTask }>(`/leads/${leadId}/tasks/${taskId}/complete`);
  return data.data;
}

export async function deleteLeadTask(leadId: string, taskId: string): Promise<void> {
  await API.delete(`/leads/${leadId}/tasks/${taskId}`);
}

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

export async function createLeadTimelineEvent(leadId: string, input: { eventType: string; title: string; description?: string; metadata?: Record<string, unknown> }): Promise<LeadTimelineEvent> {
  const { data } = await API.post<{ data: LeadTimelineEvent }>(`/leads/${leadId}/timeline`, input);
  return data.data;
}

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
  storagePath: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  originalFilename: string;
  scanStatus: string;
  scanResult: unknown;
  scannedAt: string | null;
  createdAt: string;
}

export async function getLeadQuestionnaireFiles(leadId: string): Promise<QuestionnaireFile[]> {
  const { data } = await API.get<{ data: QuestionnaireFile[] }>(`/questionnaires/leads/${leadId}/documents`);
  return data.data;
}

// ─── Lead Notes ──────────────────────────────────────────────────────────────

export type LeadNoteType = "general" | "phone_call" | "email" | "voicemail" | "system_log" | "pre_consultation" | "post_consultation";

export interface LeadNote {
  id: string;
  leadId: string;
  authorId: string;
  type: LeadNoteType;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorName: string | null;
  authorRole: string | null;
}

export interface CreateLeadNoteParams {
  content: string;
  type?: LeadNoteType;
}

export async function getLeadNotes(leadId: string): Promise<LeadNote[]> {
  const { data } = await API.get<{ data: LeadNote[] }>(`/leads/${leadId}/notes`);
  return data.data;
}

export async function createLeadNote(leadId: string, params: CreateLeadNoteParams): Promise<LeadNote> {
  const { data } = await API.post<{ data: LeadNote }>(`/leads/${leadId}/notes`, params);
  return data.data;
}

export async function updateLeadNote(leadId: string, noteId: string, params: { content?: string; type?: LeadNoteType }): Promise<LeadNote> {
  const { data } = await API.patch<{ data: LeadNote }>(`/leads/${leadId}/notes/${noteId}`, params);
  return data.data;
}

export async function deleteLeadNote(leadId: string, noteId: string): Promise<void> {
  await API.delete(`/leads/${leadId}/notes/${noteId}`);
}

// ─── Lead Task Review ─────────────────────────────────────────────────────────

export async function submitLeadTaskForReview(leadId: string, taskId: string, notes?: string): Promise<LeadTask> {
  const { data } = await API.post<{ data: LeadTask }>(`/leads/${leadId}/tasks/${taskId}/submit-review`, { notes });
  return data.data;
}

export async function approveLeadTask(leadId: string, taskId: string, notes?: string): Promise<LeadTask> {
  const { data } = await API.post<{ data: LeadTask }>(`/leads/${leadId}/tasks/${taskId}/approve`, { notes });
  return data.data;
}

export async function rejectLeadTask(leadId: string, taskId: string, feedback: string): Promise<LeadTask> {
  const { data } = await API.post<{ data: LeadTask }>(`/leads/${leadId}/tasks/${taskId}/reject`, { feedback });
  return data.data;
}

export interface LeadReviewQueueItem {
  id: string;
  title: string;
  description: string | null;
  status: LeadTaskStatus;
  pipelineStage: string;
  orderIndex: number;
  leadId: string;
  assignedToId: string | null;
  assignedToName: string | null;
  completedAt: string | null;
  completedById: string | null;
  notes: string | null;
  dueDate: string | null;
  leadName: string;
  leadEmail: string;
  createdAt: string;
  updatedAt: string;
}

export async function getLeadReviewQueue(status?: string, page?: number, limit?: number): Promise<{ data: LeadReviewQueueItem[]; pagination: { total: number; limit: number; offset: number } }> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  const { data } = await API.get(`/leads/review-queue?${params.toString()}`);
  return { data: data.data, pagination: data.pagination };
}
