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
  status: "pending" | "in_progress" | "in_review" | "completed" | "skipped";
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

export async function completeStep(
  caseId: string,
  stepId: string,
  notes?: string,
): Promise<CaseWorkflowInstance> {
  const { data } = await API.post<{ data: CaseWorkflowInstance }>(
    `/cases/${caseId}/workflow/steps/${stepId}/complete`,
    { notes },
  );
  return data.data;
}

export async function submitForReview(
  caseId: string,
  stepId: string,
  notes?: string,
): Promise<CaseWorkflowInstance> {
  const { data } = await API.post<{ data: CaseWorkflowInstance }>(
    `/cases/${caseId}/workflow/steps/${stepId}/submit-review`,
    { notes },
  );
  return data.data;
}

export async function approveStep(
  caseId: string,
  stepId: string,
  notes?: string,
): Promise<CaseWorkflowInstance> {
  const { data } = await API.post<{ data: CaseWorkflowInstance }>(
    `/cases/${caseId}/workflow/steps/${stepId}/approve`,
    { notes },
  );
  return data.data;
}

export async function rejectStep(
  caseId: string,
  stepId: string,
  feedback?: string,
): Promise<CaseWorkflowInstance> {
  const { data } = await API.post<{ data: CaseWorkflowInstance }>(
    `/cases/${caseId}/workflow/steps/${stepId}/reject`,
    { feedback },
  );
  return data.data;
}

export async function assignStep(
  caseId: string,
  stepId: string,
  staffId: string,
  overrideRationale?: string,
): Promise<CaseWorkflowInstance> {
  const { data } = await API.post<{ data: CaseWorkflowInstance }>(
    `/cases/${caseId}/workflow/steps/${stepId}/assign`,
    { staffId, overrideRationale },
  );
  return data.data;
}

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

// ─── My Tasks & Review Queue ────────────────────────────────────────────────────

export interface StepActionLogEntry {
  id: string;
  organizationId: string;
  caseId: string;
  stepId: string;
  moduleId: string | null;
  action: string;
  title: string;
  actorId: string | null;
  actorName: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  note: string | null;
  timeTakenMs: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface MyTaskItem {
  stepId: string;
  caseId: string;
  caseTitle: string;
  title: string;
  status: "pending" | "in_progress" | "in_review" | "completed" | "skipped";
  moduleId: string;
  moduleName: string;
  phaseName: string;
  assignedAt: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  auditLog: StepActionLogEntry[];
}

export interface ReviewQueueItem {
  stepId: string;
  caseId: string;
  caseTitle: string;
  title: string;
  status: "pending" | "in_progress" | "in_review" | "completed" | "skipped";
  moduleId: string;
  moduleName: string;
  phaseName: string;
  assignedToName: string | null;
  submittedAt: string | null;
  dueDate: string | null;
  auditLog: StepActionLogEntry[];
}

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
}

export interface TasksCounts {
  in_progress: number;
  in_review: number;
  completed: number;
  pending: number;
  skipped: number;
}

export interface PaginatedTasksResponse {
  data: MyTaskItem[];
  counts: TasksCounts;
  pagination: PaginationMeta;
}

export interface ReviewCounts {
  in_progress: number;
  in_review: number;
  completed: number;
  pending: number;
  skipped: number;
}

export interface PaginatedReviewResponse {
  data: ReviewQueueItem[];
  counts: ReviewCounts;
  pagination: PaginationMeta;
}

export async function getMyTasks(
  status?: string,
  page?: number,
  limit?: number,
): Promise<PaginatedTasksResponse> {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (page) params.page = String(page);
  if (limit) params.limit = String(limit);
  const { data: res } = await API.get(`/cases/workflow/my-tasks`, { params });
  return { data: res.data, counts: res.counts, pagination: res.pagination } as PaginatedTasksResponse;
}

export async function getReviewQueue(
  status?: string,
  page?: number,
  limit?: number,
): Promise<PaginatedReviewResponse> {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (page) params.page = String(page);
  if (limit) params.limit = String(limit);
  const { data: res } = await API.get(`/cases/workflow/review-queue`, { params });
  return { data: res.data, counts: res.counts, pagination: res.pagination } as PaginatedReviewResponse;
}

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
    scanStatus: string | null;
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

export interface CaseEvent {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  actorId: string | null;
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
