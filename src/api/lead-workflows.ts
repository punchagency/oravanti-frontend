import { API } from ".";

export type LeadTaskStatus = "pending" | "in_progress" | "completed" | "skipped";

export interface LeadTask {
  id: string;
  leadId: string;
  organizationId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  pipelineStage: string;
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
  leadId: string;
  eventType: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdById: string | null;
  createdAt: string;
  staff: { id: string; name: string } | null;
}

export interface LeadDocumentLink {
  id: string;
  documentId: string;
  leadId: string;
  linkedByUserId: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
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

export async function getLeadTimeline(leadId: string): Promise<LeadTimelineEvent[]> {
  const { data } = await API.get<{ data: LeadTimelineEvent[] }>(`/leads/${leadId}/timeline`);
  return data.data;
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
