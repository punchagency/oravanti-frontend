import { API } from "./index";

export type CaseStatus = "active" | "pending_review" | "on_hold" | "completed" | "cancelled";
export type CasePriority = "low" | "medium" | "high" | "critical";

export type Case = {
  id: string;
  caseNumber: string;
  practiceArea: { id: string | null; name: string | null } | null;
  caseType: { id: string | null; code: string; name: string | null } | null;
  status: CaseStatus;
  priority: CasePriority;
  filingDate: string | null;
  caseProgress: number | null;
  client: { id: string | null; name: string } | null;
  assignee: { name: string; role: string } | null;
};

export type GetCasesParams = {
  search?: string;
  status?: CaseStatus;
  assigneeId?: string;
  clientId?: string;
  practiceAreaId?: string;
};

export async function getCases(params?: GetCasesParams): Promise<Case[]> {
  const query: Record<string, string> = {};
  if (params?.search) query.search = params.search;
  if (params?.status) query.status = params.status;
  if (params?.assigneeId) query.assigneeId = params.assigneeId;
  if (params?.clientId) query.clientId = params.clientId;
  if (params?.practiceAreaId) query.practiceAreaId = params.practiceAreaId;
  const { data } = await API.get<Case[]>("/cases", { params: query });
  return data;
}
