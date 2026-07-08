import { API } from "./index";

// ─── Types ──────────────────────────────────────────────────────────────────────

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
  content: string;
  isEdited: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCaseNoteParams {
  workflowModuleId?: string;
  taskId?: string;
  category?: string;
  visibility?: string;
  content: string;
}

export interface UpdateCaseNoteParams {
  content?: string;
  category?: string;
  visibility?: string;
}

// ─── API Calls ───────────────────────────────────────────────────────────────────

export async function getCaseWorkflow(caseId: string): Promise<CaseWorkflowInstance> {
  const { data } = await API.get<CaseWorkflowInstance>(`/cases/${caseId}/workflow`);
  return data;
}

export async function getWorkflowSummary(caseId: string): Promise<WorkflowSummary> {
  const { data } = await API.get<WorkflowSummary>(`/cases/${caseId}/workflow/summary`);
  return data;
}

export async function completeStep(
  caseId: string,
  stepId: string,
  notes?: string,
): Promise<CaseWorkflowInstance> {
  const { data } = await API.post<CaseWorkflowInstance>(
    `/cases/${caseId}/workflow/steps/${stepId}/complete`,
    { notes },
  );
  return data;
}

export async function submitForReview(
  caseId: string,
  stepId: string,
  notes?: string,
): Promise<CaseWorkflowInstance> {
  const { data } = await API.post<CaseWorkflowInstance>(
    `/cases/${caseId}/workflow/steps/${stepId}/submit-review`,
    { notes },
  );
  return data;
}

export async function approveStep(
  caseId: string,
  stepId: string,
  notes?: string,
): Promise<CaseWorkflowInstance> {
  const { data } = await API.post<CaseWorkflowInstance>(
    `/cases/${caseId}/workflow/steps/${stepId}/approve`,
    { notes },
  );
  return data;
}

export async function rejectStep(
  caseId: string,
  stepId: string,
  feedback?: string,
): Promise<CaseWorkflowInstance> {
  const { data } = await API.post<CaseWorkflowInstance>(
    `/cases/${caseId}/workflow/steps/${stepId}/reject`,
    { feedback },
  );
  return data;
}

export async function assignStep(
  caseId: string,
  stepId: string,
  staffId: string,
  overrideRationale?: string,
): Promise<CaseWorkflowInstance> {
  const { data } = await API.post<CaseWorkflowInstance>(
    `/cases/${caseId}/workflow/steps/${stepId}/assign`,
    { staffId, overrideRationale },
  );
  return data;
}

export async function activateModule(
  caseId: string,
  moduleId: string,
): Promise<CaseWorkflowInstance> {
  const { data } = await API.post<CaseWorkflowInstance>(
    `/cases/${caseId}/workflow/modules/${moduleId}/activate`,
  );
  return data;
}

export async function getCaseTimeline(caseId: string): Promise<TimelineEvent[]> {
  const { data } = await API.get<TimelineEvent[]>(`/cases/${caseId}/workflow/timeline`);
  return data;
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

export async function getWorkflowLogs(caseId: string): Promise<WorkflowLogEntry[]> {
  const { data } = await API.get<WorkflowLogEntry[]>(`/cases/${caseId}/workflow/logs`);
  return data;
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
  const { data } = await API.get<PaginatedTasksResponse>(`/cases/workflow/my-tasks`, { params });
  return data;
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
  const { data } = await API.get<PaginatedReviewResponse>(`/cases/workflow/review-queue`, { params });
  return data;
}

// ─── Case Notes API ─────────────────────────────────────────────────────────────

export async function getCaseNotes(caseId: string): Promise<CaseNote[]> {
  const { data } = await API.get<CaseNote[]>(`/cases/${caseId}/workflow/notes`);
  return data;
}

export async function createCaseNote(
  caseId: string,
  params: CreateCaseNoteParams,
): Promise<CaseNote> {
  const { data } = await API.post<CaseNote>(`/cases/${caseId}/workflow/notes`, params);
  return data;
}

export async function updateCaseNote(
  caseId: string,
  noteId: string,
  params: UpdateCaseNoteParams,
): Promise<CaseNote> {
  const { data } = await API.patch<CaseNote>(
    `/cases/${caseId}/workflow/notes/${noteId}`,
    params,
  );
  return data;
}

export async function deleteCaseNote(
  caseId: string,
  noteId: string,
): Promise<void> {
  await API.delete(`/cases/${caseId}/workflow/notes/${noteId}`);
}
