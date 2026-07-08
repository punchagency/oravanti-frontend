import { API } from "./index";

export interface CaseAssignee {
  name: string;
  role: string;
}

export interface CaseClient {
  id: string;
  name: string;
}

export interface CaseSubcategory {
  id: string;
  code: string;
  name: string;
}

export interface CaseTypeInfo {
  id: string;
  code: string;
  name: string;
  caseNumberPrefix: string;
  jurisdiction: string;
  subcategory: CaseSubcategory | null;
}

export interface PracticeAreaInfo {
  id: string;
  name: string;
}

export interface CaseRow {
  id: string;
  caseNumber: string;
  practiceArea: PracticeAreaInfo;
  caseType: CaseTypeInfo;
  status: string;
  priority: string;
  filingDate: string | null;
  caseProgress: number | null;
  client: CaseClient;
  assignee: CaseAssignee | null;
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
  const { data } = await API.get<GetCasesResponse>("/cases", { params: query });
  return data;
}

export async function getCaseById(id: string): Promise<CaseRow> {
  const { data } = await API.get<CaseRow>(`/cases/${id}`);
  return data;
}
