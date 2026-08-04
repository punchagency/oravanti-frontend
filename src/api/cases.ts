import { API } from "./index";

export interface CaseClient {
  id: string;
  name: string;
  /** Only returned by the case-detail endpoint, not by the list. */
  email?: string | null;
}

export interface PracticeAreaInfo {
  id: string;
  name: string;
}

export interface CaseTypeInfo {
  id: string;
  code: string;
  name: string;
}

export interface AssignedTeam {
  id: string;
  name: string;
}

export interface CaseRow {
  id: string;
  caseNumber: string;
  practiceArea: PracticeAreaInfo;
  caseType: CaseTypeInfo;
  status: string;
  createdAt: string;
  estimatedCompletionDate: string | null;
  client: CaseClient;
  assignedTeam: AssignedTeam | null;
  currentStep: string | null;
}

export interface CaseDetail {
  id: string;
  caseNumber: string;
  status: string;
  createdAt: string;
  estimatedCompletionDate: string | null;
  client: CaseClient | null;
  practiceArea: PracticeAreaInfo | null;
  caseType: { id: string; name: string } | null;
  assignedTeam: AssignedTeam | null;
  currentStep: string | null;
}

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
}

export interface GetCasesResponse {
  data: CaseRow[];
  pagination: PaginationMeta;
}

export interface GetCasesParams {
  search?: string;
  status?: string;
  assigneeId?: string;
  clientId?: string;
  practiceAreaId?: string;
  practiceAreaName?: string;
  caseTypeName?: string;
  subcategoryName?: string;
  assigneeName?: string;
  page?: number;
  limit?: number;
}

export async function getCases(params: GetCasesParams = {}): Promise<GetCasesResponse> {
  const query: Record<string, string> = {};
  if (params.search) query.search = params.search;
  if (params.status) query.status = params.status;
  if (params.assigneeId) query.assigneeId = params.assigneeId;
  if (params.clientId) query.clientId = params.clientId;
  if (params.practiceAreaId) query.practiceAreaId = params.practiceAreaId;
  if (params.practiceAreaName) query.practiceAreaName = params.practiceAreaName;
  if (params.caseTypeName) query.caseTypeName = params.caseTypeName;
  if (params.subcategoryName) query.subcategoryName = params.subcategoryName;
  if (params.assigneeName) query.assigneeName = params.assigneeName;
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);
  const { data: res } = await API.get("/cases", { params: query });
  return { data: res.data, pagination: res.pagination } as GetCasesResponse;
}

export async function getCaseById(id: string): Promise<CaseDetail> {
  const { data } = await API.get<{ data: CaseDetail }>(`/cases/${id}`);
  return data.data;
}

export async function reassignCaseTeam(
  caseId: string,
  teamId: string,
): Promise<CaseDetail> {
  const { data } = await API.post<{ data: CaseDetail }>(
    `/cases/${caseId}/reassign-team`,
    { teamId },
  );
  return data.data;
}
