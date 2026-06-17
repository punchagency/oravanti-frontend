import { API } from ".";

export type LeadSource =
  | "education_flywheel"
  | "referral"
  | "direct"
  | "walk_in"
  | "phone_enquiry"
  | "client_portal";

export type LeadStatus = "new" | "reviewed" | "archived";

export type PipelineStage =
  | "lead_inbox"
  | "conflict_check"
  | "questionnaire"
  | "consultation"
  | "fee_agreement"
  | "case_opening";

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  entityType: "individual" | "company";
  practiceAreaId: string | null;
  caseTypeId: string | null;
  source: LeadSource;
  situationSummary: string | null;
  notes: string | null;
  status: LeadStatus;
  pipelineStage: PipelineStage;
  conflictCheckId: string | null;
  questionnaireSendId: string | null;
  consultationId: string | null;
  feeAgreementId: string | null;
  convertedClientId: string | null;
  convertedCaseId: string | null;
  convertedAt: string | null;
  assignedStaffId: string | null;
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ConflictCheckMatch = {
  type: "current_client" | "adverse_party" | "former_client";
  matchedId: string;
  matchedName: string;
  confidence: "exact_email" | "exact_name" | "fuzzy_name";
  rule: "ABA_1.7" | "ABA_1.9";
  details: string;
};

export type ConflictCheck = {
  id: string;
  leadId: string;
  status: "pending" | "pass" | "needs_review" | "conflict_found";
  matches: ConflictCheckMatch[];
  reviewNotes: string | null;
  checkedAt: string | null;
  checkedById: string | null;
  reviewedAt: string | null;
  reviewedById: string | null;
  supervisorOverrideById: string | null;
  supervisorOverrideNotes: string | null;
};

export type Consultation = {
  id: string;
  leadId: string;
  scheduledAt: string;
  duration: number;
  mode: "video" | "in_person";
  leadAttorneyId: string | null;
  videoLink: string | null;
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";
  preConsultationNotes: string | null;
  attorneyNotes: string | null;
  outcome: "proceed" | "close_no_case" | "refer_elsewhere" | "follow_up" | null;
  createdAt: string;
  updatedAt: string;
};

export type FeeAgreement = {
  id: string;
  leadId: string;
  agreementType: string;
  generatedFrom: "questionnaire_auto" | "manual";
  status: "draft" | "pending_signature" | "signed" | "voided";
  documentUrl: string | null;
  envelopeId: string | null;
  signingLink: string | null;
  clientSignedAt: string | null;
  nudgedAt: string | null;
  createdAt: string;
};

export type LeadDetail = Lead & {
  conflictCheck: ConflictCheck | null;
  consultation: Consultation | null;
  feeAgreement: FeeAgreement | null;
};

export type LeadsResponse = {
  leads: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type LeadsStageCountResponse = {
  lead_inbox: number;
  conflict_check: number;
  questionnaire: number;
  consultation: number;
  fee_agreement: number;
  case_opening: number;
};

export type GetLeadsParams = {
  stage?: PipelineStage;
  status?: LeadStatus;
  source?: LeadSource;
  practiceAreaId?: string;
  search?: string;
  page?: number;
  limit?: number;
  all?: boolean;
};

export const getLeads = async (
  params: GetLeadsParams = {},
): Promise<LeadsResponse> => {
  const query: Record<string, string> = {};
  if (params.stage) query.stage = params.stage;
  if (params.status) query.status = params.status;
  if (params.source) query.source = params.source;
  if (params.practiceAreaId) query.practiceAreaId = params.practiceAreaId;
  if (params.search) query.search = params.search;
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);
  if (params.all) query.all = "true";
  const res = await API.get("/leads", { params: query });
  return res.data.data;
};

export const getLeadsStageCount =
  async (): Promise<LeadsStageCountResponse> => {
    const res = await API.get("/leads/stage-counts");
    return res.data.data;
  };

export const getLeadById = async (id: string): Promise<LeadDetail> => {
  const res = await API.get(`/leads/${id}`);
  return res.data.data;
};

export const createLead = async (data: {
  name: string;
  email: string;
  phone?: string;
  entityType?: "individual" | "company";
  practiceAreaId?: string;
  caseTypeId?: string;
  source: LeadSource;
  situationSummary?: string;
}): Promise<Lead> => {
  const res = await API.post("/leads", data);
  return res.data.data;
};

export const archiveLead = async (id: string): Promise<Lead> => {
  const res = await API.patch(`/leads/${id}/archive`);
  return res.data.data;
};

export const advanceLeadStage = async (
  id: string,
  stage: PipelineStage,
): Promise<Lead> => {
  const res = await API.patch(`/leads/${id}/stage`, { stage });
  return res.data.data;
};

export const runConflictCheck = async (id: string): Promise<ConflictCheck> => {
  const res = await API.post(`/leads/${id}/check-conflict`);
  return res.data.data;
};

export const resolveConflictCheck = async (
  id: string,
  data:
    | { status: "pass" | "needs_review"; reviewNotes?: string }
    | { supervisorOverride: true; supervisorNotes?: string },
): Promise<ConflictCheck> => {
  const res = await API.patch(`/leads/${id}/conflict-check`, data);
  return res.data.data;
};

export const sendQuestionnaire = async (
  id: string,
): Promise<{ questionnaireId: string; clientLink: string; sentAt: string }> => {
  const res = await API.post(`/leads/${id}/send-questionnaire`);
  return res.data.data;
};

export const createConsultation = async (
  id: string,
  data: {
    scheduledAt: string;
    duration: number;
    mode: "video" | "in_person";
    leadAttorneyId?: string;
    videoLink?: string;
    preConsultationNotes?: string;
  },
): Promise<Consultation> => {
  const res = await API.post(`/leads/${id}/consultation`, data);
  return res.data.data;
};

export const updateConsultation = async (
  id: string,
  data: {
    attorneyNotes?: string;
    status?:
      | "scheduled"
      | "in_progress"
      | "completed"
      | "cancelled"
      | "no_show";
    outcome?: "proceed" | "close_no_case" | "refer_elsewhere" | "follow_up";
  },
): Promise<Consultation> => {
  const res = await API.patch(`/leads/${id}/consultation`, data);
  return res.data.data;
};

export const generateFeeAgreement = async (
  id: string,
  data: { agreementType: string },
): Promise<FeeAgreement> => {
  const res = await API.post(`/leads/${id}/generate-agreement`, data);
  return res.data.data;
};

export const nudgeClient = async (
  agreementId: string,
): Promise<{ reminderSentAt: string }> => {
  const res = await API.post(`/agreements/${agreementId}/nudge-client`);
  return res.data.data;
};

export const openCase = async (
  id: string,
  data: { assignedStaffId?: string; notes?: string },
): Promise<{ caseId: string; status: string; workflowSteps: unknown[] }> => {
  const res = await API.post(`/leads/${id}/open-case`, data);
  return res.data.data;
};

export const sourceLabels: Record<LeadSource, string> = {
  education_flywheel: "Education flywheel",
  referral: "Referral",
  direct: "Direct",
  walk_in: "Walk in",
  phone_enquiry: "Phone enquiry",
  client_portal: "Client portal",
};

export const sourceValues: Record<string, LeadSource> = {
  "Education flywheel": "education_flywheel",
  Referral: "referral",
  Direct: "direct",
  "Walk in": "walk_in",
  "Phone enquiry": "phone_enquiry",
  "Client portal": "client_portal",
};

export const statusLabels: Record<LeadStatus, string> = {
  new: "New",
  reviewed: "Reviewed",
  archived: "Archived",
};

export const conflictStatusLabels: Record<ConflictCheck["status"], string> = {
  pending: "Not run yet",
  pass: "Cleared & Approved",
  needs_review: "Needs review",
  conflict_found: "Conflict detected",
};

export function formatReceivedDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatReceivedDateDetail(dateStr: string): string {
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} - ${time}`;
}
