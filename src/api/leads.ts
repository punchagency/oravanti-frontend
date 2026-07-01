import { API } from ".";

export type LeadSource =
  | "education_flywheel"
  | "referral"
  | "direct"
  | "walk_in"
  | "phone_enquiry"
  | "client_portal";

export type LeadStatus =
  | "new"
  | "reviewed"
  | "archived"
  | "declined"
  | "overridden";

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
  intakeAdversePartyName: string | null;
  intakeAdversePartyEmail: string | null;
  status: LeadStatus;
  pipelineStage: PipelineStage;
  conflictCheckId: string | null;
  conflictMatches?: ConflictCheckMatch[];
  conflictCheckStatus?: string;
  questionnaireSendId: string | null;
  consultationId: string | null;
  feeAgreementId: string | null;
  convertedClientId: string | null;
  convertedCaseId: string | null;
  convertedAt: string | null;
  assignedStaffId: string | null;
  caseTypeName: string | null;
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CaseDetail = {
  id: string;
  caseNumber: string;
  caseType: string;
  status: string;
  practiceArea: string | null;
};

export type ConflictCheckMatch = {
  type:
    | "current_client"
    | "adverse_party"
    | "former_client"
    | "related_party"
    | "client_is_opponent"
    | "former_client_is_opponent";
  matchedId: string;
  matchedName: string;
  confidence: "exact_email" | "exact_name" | "fuzzy_name" | "surname_match";
  rule: "ABA_1.7" | "ABA_1.9";
  details: string;
  caseDetails: CaseDetail[];
  adversePartyRelationship?: string;
  firmClientName?: string;
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
  scheduledAt: string | null;
  duration: number;
  mode: "video" | "in_person" | "phone_call";
  isUrgent: boolean;
  leadAttorneyId: string | null;
  videoLink: string | null;
  status: ConsultationStatus;
  feeStatus: "none" | "unpaid" | "paid" | "waived";
  preConsultationNotes: string | null;
  attorneyNotes: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
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

export type ConsultationStatus =
  | "pending_payment"
  | "awaiting_slot_selection"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type ConsultationSort =
  | "date_asc"
  | "date_desc"
  | "client_asc"
  | "client_desc";

export type ConsultationListItem = {
  id: string;
  leadId: string;
  leadName: string;
  leadEmail: string;
  mode: "video" | "in_person" | "phone_call";
  status: ConsultationStatus;
  scheduledAt: string | null;
  duration: number;
  feeStatus: string | null;
  feeAmount: string | null;
  leadAttorneyId: string | null;
  attorneyFirstName: string | null;
  attorneyLastName: string | null;
};

export type GetConsultationsParams = {
  search?: string;
  attorneyId?: string;
  sort?: ConsultationSort;
  page?: number;
  limit?: number;
};

export type ConsultationsResponse = {
  data: ConsultationListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

// Backend batch summary of consultations (across stages), used to enrich the
// consultation-stage cards with attorney / status / scheduled-time so the list
// can be searched, filtered and sorted without a detail fetch per card.
export const getConsultations = async (
  params: GetConsultationsParams = {},
): Promise<ConsultationsResponse> => {
  const query: Record<string, string> = {};
  if (params.search) query.search = params.search;
  if (params.attorneyId) query.attorneyId = params.attorneyId;
  if (params.sort) query.sort = params.sort;
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);
  const res = await API.get("/leads/consultations", { params: query });
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
  intakeAdversePartyName?: string;
  intakeAdversePartyEmail?: string;
}): Promise<Lead> => {
  const res = await API.post("/leads", data);
  return res.data.data;
};

export const updateLeadStatus = async (id: string, status: string): Promise<Lead> => {
  const res = await API.patch(`/leads/${id}/status`, { status })
  return res.data.data
}

export const updateLead = async (
  id: string,
  data: { notes?: string },
): Promise<Lead> => {
  const res = await API.patch(`/leads/${id}`, data);
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

export type ResolveConflictCheckPayload = {
  action: "approve" | "decline";
  reviewNotes: string;
};

export const resolveConflictCheck = async (
  id: string,
  data: ResolveConflictCheckPayload,
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

export const initiateConsultation = async (
  id: string,
  data: {
    leadAttorneyId: string;
    participantStaffIds?: string[];
    mode: "video" | "in_person" | "phone_call";
    duration: number;
    locationId?: string;
    feeAmount?: number;
    preConsultationNotes?: string;
    notifyChannels?: ("email" | "sms")[];
    // Urgent (admin fast-track): schedule now, lead skips the slot queue.
    urgent?: boolean;
    scheduledAt?: string;
  },
) => {
  const res = await API.post(`/leads/${id}/consultation`, data);
  return res.data.data as {
    consultation: Consultation;
    bookingToken: string;
    warnings?: string[];
  };
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

export const cancelConsultation = async (
  id: string,
  data: { reason?: string } = {},
): Promise<Consultation> => {
  const res = await API.post(`/leads/${id}/consultation/cancel`, data);
  return res.data.data;
};

export const generateFeeAgreement = async (
  id: string,
  data: { agreementType: string; generatedFrom?: "manual" | "questionnaire_auto" },
): Promise<FeeAgreement> => {
  const res = await API.post(`/leads/${id}/generate-agreement`, data);
  return res.data.data;
};

export const sendFeeAgreement = async (
  agreementId: string,
): Promise<FeeAgreement> => {
  const res = await API.post(`/agreements/${agreementId}/send`);
  return res.data.data;
};

export const markFeeAgreementReceived = async (
  agreementId: string,
): Promise<{ received: boolean; agreementId: string; leadId: string }> => {
  const res = await API.post(`/agreements/${agreementId}/mark-received`);
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
  declined: "Declined",
  overridden: "Overridden",
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
