import { API } from ".";

// ─── Types (mirror the backend's presented shapes) ──────────────────────────

export type IssueSeverity = "critical" | "high" | "medium" | "low";
export type IssueBadge = "critical" | "warning";
export type IssueStatus =
  | "open"
  | "under_review"
  | "resolved"
  | "dismissed"
  | "superseded";
export type ScenarioType = "lead" | "case";

export type IssueScenario = {
  type: ScenarioType;
  id: string;
  /** Case number for cases; the lead's own name for leads. */
  reference: string | null;
};

export type IssueActionKind = "mutation" | "navigate";

export type IssueAction = {
  key: string;
  label: string;
  variant: "primary" | "secondary";
  kind: IssueActionKind;
  target?: "case" | "document";
  /** Offered but not yet implemented — render disabled with a "coming soon" hint. */
  stub: boolean;
};

export type CaseReviewIssue = {
  id: string;
  issueType: string;
  category: string;
  source: "rule" | "ai";
  severity: IssueSeverity;
  badge: IssueBadge;
  status: IssueStatus;
  title: string;
  description: string;
  howToResolve: string | null;
  affectedField: string | null;
  actions: IssueAction[];
  scenario: IssueScenario;
  client: { id: string; name: string } | null;
  caseTypeId: string | null;
  caseTypeName: string | null;
  detectedAt: string;
  resolvedAt: string | null;
  dismissedAt: string | null;
  createdAt: string;
};

export type IssueDocument = {
  documentId: string;
  role: string;
  title: string | null;
};

export type IssueEvent = {
  id: string;
  issueId: string;
  fromStatus: IssueStatus | null;
  toStatus: IssueStatus;
  actorStaffId: string | null;
  actionKey: string | null;
  note: string | null;
  createdAt: string;
};

export type CaseReviewIssueDetail = CaseReviewIssue & {
  documents: IssueDocument[];
  events: IssueEvent[];
};

export type CaseReviewStats = {
  criticalIssues: number;
  warnings: number;
  mattersAffected: number;
  resolvedLast30Days: number;
  totalActiveMatters: number;
  lastScan: {
    at: string | null;
    mattersReviewed: number;
    issuesFound: number;
    resolvedSince: number;
  };
};

export type MatterRow = {
  id: string;
  type: ScenarioType;
  name: string;
  reference: string | null;
  initials: string;
  critical: number;
  warnings: number;
  status: "critical" | "warning" | "clear";
};

export type DocumentFlag = {
  documentId: string | null;
  issueId: string | null;
  title: string;
  type: string | null;
  issueType: string;
  matter: {
    id: string;
    type: ScenarioType;
    name: string;
    reference: string | null;
  };
  source: "client_upload" | "pending_client" | "firm";
  date: string | null;
  flag: string;
  badge: IssueBadge;
};

export type ResolutionLogRow = {
  id: string;
  title: string;
  category: string;
  scenario: IssueScenario;
  client: { id: string; name: string } | null;
  resolvedAt: string | null;
  resolvedBy: { name: string; role: string | null } | null;
  actionKey: string | null;
  actionTaken: string | null;
};

export type ResolutionLogSummary = {
  resolved: number;
  averageResolutionDays: number | null;
  windowDays: number;
};

export type CaseReviewConfig = {
  isActive: boolean;
  crossCheckingEnabled: boolean;
  photoComparisonEnabled: boolean;
  realtimeAnalysis: boolean;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Paginated<T> = { data: T[]; pagination: Pagination };

export type IssueFilters = {
  severity?: IssueSeverity;
  status?: IssueStatus;
  page?: number;
  limit?: number;
};

export type ExportFormat = "csv" | "pdf";

// ─── Queries ────────────────────────────────────────────────────────────────

export const getCaseReviewStats = async (): Promise<CaseReviewStats> => {
  const res = await API.get("/case-review/stats");
  return res.data.data;
};

export const getCaseReviewIssues = async (
  filters: IssueFilters = {},
): Promise<Paginated<CaseReviewIssue>> => {
  const res = await API.get("/case-review/issues", { params: filters });
  return { data: res.data.data, pagination: res.data.pagination };
};

export const getCaseReviewIssue = async (
  id: string,
): Promise<CaseReviewIssueDetail> => {
  const res = await API.get(`/case-review/issues/${id}`);
  return res.data.data;
};

export const getIssuesByCase = async (
  params: { page?: number; limit?: number } = {},
): Promise<Paginated<MatterRow>> => {
  const res = await API.get("/case-review/by-case", { params });
  return { data: res.data.data, pagination: res.data.pagination };
};

export const getIssuesByDocument = async (
  params: { page?: number; limit?: number } = {},
): Promise<Paginated<DocumentFlag>> => {
  const res = await API.get("/case-review/by-document", { params });
  return { data: res.data.data, pagination: res.data.pagination };
};

export const getResolutionLog = async (
  params: { page?: number; limit?: number; days?: number } = {},
): Promise<Paginated<ResolutionLogRow> & { summary: ResolutionLogSummary }> => {
  const res = await API.get("/case-review/resolution-log", { params });
  return {
    data: res.data.data,
    pagination: res.data.pagination,
    summary: res.data.summary,
  };
};

export const getCaseReviewConfig = async (): Promise<CaseReviewConfig> => {
  const res = await API.get("/case-review/config");
  return res.data.data;
};

// ─── Mutations ──────────────────────────────────────────────────────────────

export type IssueStatusAction = "resolve" | "dismiss" | "reopen" | "review";

export const updateIssueStatus = async (
  id: string,
  action: IssueStatusAction,
  note?: string,
): Promise<CaseReviewIssue> => {
  const res = await API.patch(`/case-review/issues/${id}/status`, {
    action,
    note,
  });
  return res.data.data;
};

export type RunActionResult =
  | { kind: "navigate"; target: "case" | "document"; scenario: IssueScenario }
  | { kind: "mutation"; issue: CaseReviewIssue };

export const runIssueAction = async (
  id: string,
  actionKey: string,
): Promise<RunActionResult> => {
  const res = await API.post(
    `/case-review/issues/${id}/actions/${actionKey}`,
  );
  return res.data.data;
};

export const updateCaseReviewConfig = async (
  patch: Partial<CaseReviewConfig>,
): Promise<CaseReviewConfig> => {
  const res = await API.patch("/case-review/config", patch);
  return res.data.data;
};

export const runFullScan = async (): Promise<void> => {
  await API.post("/ai-scan/full-scan");
};

// ─── Exports (file download) ─────────────────────────────────────────────────

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const exportIssues = async (
  format: ExportFormat,
  filters: Pick<IssueFilters, "severity" | "status"> = {},
): Promise<void> => {
  const res = await API.get("/case-review/issues/export", {
    params: { ...filters, format },
    responseType: "blob",
  });
  downloadBlob(res.data, `ai-review-issues.${format}`);
};

export const exportResolutionLog = async (
  format: ExportFormat,
  params: { days?: number } = {},
): Promise<void> => {
  const res = await API.get("/case-review/resolution-log/export", {
    params: { ...params, format },
    responseType: "blob",
  });
  downloadBlob(res.data, `ai-review-resolution-log.${format}`);
};
