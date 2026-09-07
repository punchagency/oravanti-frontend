import { dayjs, formatTime, guessTimezone } from "@/utils/date";
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
  /**
   * SMS consent. Sendable only when smsConsent is true AND smsOptOutAt is null
   * — an opt-out is the recipient's decision and cannot be reversed by staff.
   */
  smsConsent?: boolean;
  smsConsentAt?: string | null;
  smsOptOutAt?: string | null;
  entityType: "individual" | "company";
  practiceAreaId: string | null;
  practiceAreaName: string | null;
  caseTypeId: string | null;
  caseTypeName: string | null;
  /** Joined server-side from the practice_areas table. */
  source: LeadSource;
  situationSummary: string | null;
  notes: string | null;
  intakeAdversePartyName: string | null;
  intakeAdversePartyEmail: string | null;
  status: LeadStatus;
  pipelineStage: PipelineStage;
  language?: string | null;
  timezone?: string | null;
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

export type PaymentTiming = "pay_now" | "invoice_after" | "pay_in_person";

export type Consultation = {
  id: string;
  leadId: string;
  parentConsultationId: string | null;
  scheduledAt: string | null;
  duration: number;
  mode: "video" | "in_person" | "phone_call";
  isUrgent: boolean;
  isInstant: boolean;
  paymentTiming: PaymentTiming | null;
  isEmergency: boolean;
  emergencyMultiplier: string | null;
  autoSendQuestionnaire: boolean;
  leadAttorneyId: string | null;
  videoLink: string | null;
  status: ConsultationStatus;
  feeStatus: "none" | "unpaid" | "paid" | "waived";
  /**
   * The fee as the invoice reports it, once one exists.
   *
   * `netPaid` is what the firm is currently holding, net of any refund — so it
   * answers "how much would cancelling send back" before cancellation, and "how
   * much is still owed" after. Nothing is stored either way; it is a fold over
   * the ledger, so it cannot drift.
   */
  fee?: {
    amount: number | null;
    status: "none" | "unpaid" | "paid" | "waived" | "refunded";
    invoiceId: string | null;
    invoiceNumber: string | null;
    netPaid: number;
  };
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
  // Structured form data captured at generation (defined near the fee-agreement
  // API section below). Null only on legacy rows.
  details: FeeAgreementDetails | null;
  documentUrl: string | null;
  envelopeId: string | null;
  signingLink: string | null;
  clientSignedAt: string | null;
  nudgedAt: string | null;
  createdAt: string;
  /**
   * Who counter-signs for the firm, and whether they have.
   *
   * `firmSigner` null means this agreement has one signer and always will —
   * either the firm does not counter-sign, or it was already out for signature
   * before counter-signing existed. Every counter-signature affordance in the
   * UI hangs off this being non-null, so such an agreement renders exactly as
   * it did before.
   */
  firmSigner: { staffId: string; name: string } | null;
  firmSignedAt: string | null;
  firmSignerRemindedAt: string | null;
  signingOrder: "client_first" | "firm_first" | null;
  invoiceWaitsForFirmSignature: boolean | null;
  /** Whether the signed-in user can sign this agreement right now. */
  canSign: boolean;
  /** Set once the executed PDF has been archived. */
  signedDocumentUrl: string | null;
  /**
   * The invoice raised for what this agreement charges upfront. Null until it
   * is signed, and on a pure contingency that bills nothing upfront.
   */
  invoice?: FeeAgreementInvoice | null;
};

export type FeeAgreementInvoice = {
  invoiceId: string;
  invoiceNumber: string;
  status: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
  /** What is being asked for now — the next unpaid instalment, or the balance. */
  amountDueNow: number;
  dueDate: string;
  /**
   * Whether the client has actually been sent this bill. `failed` is the one to
   * surface loudly: it is the state in which the case-opening gate blocks, and
   * resending from Finance is the fix.
   */
  delivery: "sent" | "failed" | "not_attempted";
  /** Whether this invoice currently satisfies the case-opening gate. */
  satisfiesGate: boolean;
  /**
   * The payment schedule with each row's derived state. Empty when the invoice
   * is paid in one go — per-instalment amounts are derived from
   * `invoices.amount_paid`, never stored, so this is the only honest source for
   * "what is still owed on instalment 3".
   */
  instalments: {
    sequence: number;
    dueDate: string;
    amount: number;
    outstanding: number;
    state: "paid" | "partial" | "due";
  }[];
};

export type LeadDetail = Lead & {
  conflictCheck: ConflictCheck | null;
  consultation: Consultation | null;
  // Prior consultations (follow-ups / re-schedules), newest first.
  consultationHistory?: Consultation[];
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
  /**
   * Leads that became a case. Keyed server-side on convertedCaseId, not on a
   * status value — case opening writes status "reviewed", never "converted",
   * so `status: "converted"` would always match nothing.
   */
  converted?: boolean;
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
  if (params.converted !== undefined)
    query.converted = String(params.converted);
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);
  if (params.all) query.all = "true";
  const res = await API.get("/leads", { params: query });
  return {
    leads: res.data.data,
    pagination: res.data.pagination,
  } as LeadsResponse;
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

// ─── Per-stage fetches ───────────────────────────────────────────────────────

export type LeadLayout = {
  id: string;
  name: string;
  pipelineStage: PipelineStage;
  receivedAt: string;
  situationSummary: string | null;
  intakeAdversePartyName: string | null;
  intakeAdversePartyEmail: string | null;
  convertedCaseId: string | null;
};

export type ConsultationWithParticipants = Consultation & {
  participants: {
    id: string;
    staffId: string;
    roleSnapshot: string | null;
    firstName: string;
    lastName: string;
  }[];
  consultationHistory: Consultation[];
};

export const getConflictCheck = async (
  id: string,
): Promise<ConflictCheck | null> => {
  const res = await API.get(`/leads/${id}/conflict-check`);
  return res.data.data;
};

export const getConsultation = async (
  id: string,
): Promise<ConsultationWithParticipants | null> => {
  const res = await API.get(`/leads/${id}/consultation`);
  return res.data.data;
};

export const getFeeAgreement = async (
  id: string,
): Promise<FeeAgreement | null> => {
  const res = await API.get(`/leads/${id}/agreement`);
  return res.data.data;
};

export const getLeadLayout = async (id: string): Promise<LeadLayout> => {
  const res = await API.get(`/leads/${id}/layout`);
  return res.data.data;
};

// ─── Activity trail ──────────────────────────────────────────────────────────
// Append-only on the server: there is no update or delete endpoint, and the UI
// must not offer one.

export type LeadEventType =
  | "lead_received"
  | "lead_updated"
  | "stage_changed"
  | "lead_assigned"
  | "lead_archived"
  | "lead_restored"
  | "note_added"
  | "conflict_check_run"
  | "conflict_check_approved"
  | "conflict_check_declined"
  | "conflict_overridden"
  | "questionnaire_sent"
  | "questionnaire_response_received"
  | "consultation_scheduled"
  | "consultation_rescheduled"
  | "consultation_cancelled"
  | "consultation_completed"
  | "fee_agreement_generated"
  | "fee_agreement_sent"
  | "fee_agreement_client_signed"
  | "fee_agreement_firm_signed"
  | "fee_agreement_signer_reassigned"
  | "fee_agreement_signed"
  | "payment_received"
  | "case_opened";

export type LeadEvent = {
  id: string;
  type: LeadEventType;
  actorId: string | null;
  /**
   * Null where the actor is genuinely unknown: a system/lead-driven event, or
   * an event reconstructed by the backfill for a lead that predates the trail.
   * Render the absence — never substitute a name.
   */
  actorName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export const getLeadActivity = async (id: string): Promise<LeadEvent[]> => {
  const res = await API.get(`/leads/${id}/activity`);
  return res.data.data;
};

// ─── Notes (append-only) ─────────────────────────────────────────────────────

export type LeadNoteType =
  | "general"
  | "phone_call"
  | "email"
  | "voicemail"
  | "system_log"
  | "pre_consultation"
  | "post_consultation";

export type LeadNoteContext = "manual" | "consultation" | "lead_update" | "intake" | "system";

export type LeadNoteVisibility = "all_staff" | "attorneys_only" | "admins_only";

export type LeadNote = {
  id: string;
  type: LeadNoteType;
  context: LeadNoteContext;
  visibility: LeadNoteVisibility;
  isPinned: boolean;
  content: string;
  authorId: string;
  authorName: string | null;
  createdAt: string;
};

export const getLeadNotes = async (id: string): Promise<LeadNote[]> => {
  const res = await API.get(`/leads/${id}/notes`);
  return res.data.data;
};

export const addLeadNote = async (
  id: string,
  data: { type?: LeadNoteType; context?: LeadNoteContext; content: string },
): Promise<LeadNote> => {
  const res = await API.post(`/leads/${id}/notes`, data);
  return res.data.data;
};

// ─── Archive / restore ───────────────────────────────────────────────────────

export const archiveLead = async (
  id: string,
  reason?: string,
): Promise<Lead> => {
  const res = await API.post(`/leads/${id}/archive`, reason ? { reason } : {});
  return res.data.data;
};

export const restoreLead = async (id: string): Promise<Lead> => {
  const res = await API.post(`/leads/${id}/restore`);
  return res.data.data;
};

// ─── Conversion metrics ──────────────────────────────────────────────────────

export type MetricsPeriod = "30d" | "90d" | "12mo";

/**
 * A metric the backend could not compute. It is never zero-filled: a zero would
 * read as a real measurement. Render the reason instead.
 */
export type Measurable<T> =
  | { status: "ok"; value: T }
  | { status: "insufficient_data"; reason: string };

export type LeadMetrics = {
  period: MetricsPeriod;
  since: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  avgDaysToConvert: Measurable<number>;
  /**
   * The equal-length window immediately before this one. Returned raw rather
   * than as a delta so the UI can distinguish "no change" from "there was no
   * previous period" — a firm's first month must not report a triumphant +100%.
   */
  previous: {
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    avgDaysToConvert: Measurable<number>;
  };
  funnel: { stage: PipelineStage; reached: number; droppedOff: number }[];
  avgDaysInStage: Record<PipelineStage, Measurable<number>>;
  leadsBySource: {
    source: LeadSource;
    total: number;
    converted: number;
    conversionRate: number;
  }[];
  conversionByPracticeArea: {
    practiceAreaId: string;
    practiceAreaName: string;
    total: number;
    converted: number;
    conversionRate: number;
  }[];
  /**
   * What clients have agreed to pay on signed agreements — not what the firm
   * has collected. Hourly and contingency agreements are excluded because the
   * agreement itself does not fix their value; they are counted separately so a
   * partial total reads as partial.
   */
  contractedValue: {
    total: number;
    agreementsCounted: number;
    agreementsExcluded: { hourly: number; contingency: number };
  };
};

export const getLeadMetrics = async (
  period: MetricsPeriod = "30d",
): Promise<LeadMetrics> => {
  const res = await API.get("/leads/metrics", { params: { period } });
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
  return {
    data: res.data.data,
    pagination: res.data.pagination,
  } as ConsultationsResponse;
};

export const createLead = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  entityType?: "individual" | "company";
  practiceAreaId?: string;
  caseTypeId?: string;
  source: LeadSource;
  situationSummary?: string;
  intakeAdversePartyName?: string;
  intakeAdversePartyEmail?: string;
  timezone?: string;
  language?: string;
}): Promise<Lead> => {
  const res = await API.post("/leads", data);
  return res.data.data;
};

export const updateLeadStatus = async (
  id: string,
  status: string,
  actorId?: string,
): Promise<Lead> => {
  const res = await API.patch(`/leads/${id}/status`, { status, actorId });
  return res.data.data;
};

/**
 * Mirrors the columns the server will actually persist. It previously declared
 * `name`, which is not a column (the server stores firstName/lastName), so a
 * rename silently did nothing.
 *
 * `notes` is not a column either — the server appends it to the lead's
 * append-only notes trail.
 */
export type UpdateLeadInput = Partial<{
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: LeadSource;
  situationSummary: string;
  entityType: "individual" | "company";
  practiceAreaId: string;
  caseTypeId: string;
  language: string;
  notes: string;
  noteContext: "manual" | "consultation" | "lead_update" | "intake" | "system";
}>;

export const updateLead = async (
  id: string,
  data: UpdateLeadInput,
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
    // Urgent (admin fast-track): auto-scheduled ASAP, skips the slot queue.
    urgent?: boolean;
    // Set when this consultation is a follow-up of a prior completed one.
    parentConsultationId?: string;
    // Instant consultation: begins now (or at payment time for pay_now).
    startNow?: boolean;
    /**
     * Days after the consultation that the deposit balance falls due. Only
     * honoured when the firm's balance mode is `custom`.
     */
    balanceDueDays?: number;
    paymentTiming?: PaymentTiming;
    isEmergency?: boolean;
    emergencyMultiplier?: number;
    autoSendQuestionnaire?: boolean;
  },
) => {
  const res = await API.post(`/leads/${id}/consultation`, data);
  return res.data.data as {
    consultation: Consultation;
    bookingToken: string;
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
    // Staff marks a pay-in-person fee as received.
    feeStatus?: "paid";
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

export type AttorneyFeeType = "flat" | "hourly" | "flat_hourly" | "contingency";
export type FeePaymentPlan = "pay_in_full" | "two_payments" | "installments";
/**
 * How the firm collects what the agreement charges upfront. Mirrors
 * `consultations.payment_timing` rather than inventing a second vocabulary.
 */
export type FeePaymentTiming =
  | "pay_at_signing"
  | "invoice_after"
  | "pay_in_person";
export type GovernmentFeesPaidBy = "client_upfront" | "firm_advanced";
export type ContingencyIfLost =
  | "client_owes_nothing"
  | "client_reimburses_hard_costs";
export type PaymentAllocationOrder = "fees_first" | "costs_first" | "custom";

export type TwoPaymentsSchedule = {
  // First payment is due at signing.
  firstAmount: number;
  secondAmount: number;
  secondDueDate: string; // date-only "YYYY-MM-DD"
};

export type InstallmentSchedule = {
  monthlyAmount: number;
  numberOfPayments: number; // months
  firstPaymentDate: string; // date-only "YYYY-MM-DD"
};

export type PaymentAllocation = {
  order: PaymentAllocationOrder;
  // Required when order === "custom"; the costs share is always 100 − this.
  customFeePercent?: number;
};

export type GenerateFeeAgreementInput = {
  /**
   * Who counter-signs for the firm. Omitted when the firm does not let the
   * generating attorney choose — the server resolves the default either way and
   * ignores this rather than rejecting it, so a stale tab cannot fail a draft.
   */
  firmSignerStaffId?: string;
  attorneyFee: {
    type: AttorneyFeeType;
    flatRate?: number;
    hourlyRate?: number;
    // Estimated hours for hourly agreements (summary/prose only).
    estimatedHours?: number;
    // Settlement percentage, combinable with any type; required for
    // pure-contingency agreements.
    contingencyPercent?: number;
  };
  // Required for contingency agreements. abaConfirmed asserts the attorney
  // checked all three ABA 1.5(c) boxes; the backend stamps the timestamp.
  contingencyTerms?: {
    coversCaseCosts: boolean;
    coversExpertWitnessFees: boolean;
    ifLost: ContingencyIfLost;
    abaConfirmed: true;
  };
  governmentFees: { name: string; amount: number }[];
  otherCosts?: { name: string; amount: number }[];
  governmentFeesPaidBy: GovernmentFeesPaidBy;
  // Optional: omitted when nothing is due upfront (backend defaults apply).
  paymentPlan?: FeePaymentPlan;
  twoPaymentsSchedule?: TwoPaymentsSchedule;
  installmentSchedule?: InstallmentSchedule;
  paymentAllocation?: PaymentAllocation;
  paymentTiming?: FeePaymentTiming;
  applyConsultationCredit: boolean;
  accountSplit?: { operating: number; trust: number };
};

// Mirror of the backend FeeAgreementDetails jsonb (fee-agreements.ts). Fields
// introduced by the 3-step wizard are absent on older agreements.
export type FeeAgreementDetails = {
  attorneyFee: {
    type: AttorneyFeeType;
    flatRate?: number;
    hourlyRate?: number;
    estimatedHours?: number;
    contingencyPercent?: number;
  };
  contingencyTerms?: {
    coversCaseCosts: boolean;
    coversExpertWitnessFees: boolean;
    ifLost: ContingencyIfLost;
    abaConfirmedAt: string;
  };
  governmentFees: { name: string; amount: number }[];
  otherCosts?: { name: string; amount: number }[];
  governmentFeesPaidBy?: GovernmentFeesPaidBy;
  paymentPlan: FeePaymentPlan;
  twoPaymentsSchedule?: TwoPaymentsSchedule;
  installmentSchedule?: InstallmentSchedule;
  paymentAllocation?: PaymentAllocation;
  // Absent on agreements generated before payment timing existed; the backend
  // treats that as "pay_at_signing".
  paymentTiming?: FeePaymentTiming;
  applyConsultationCredit: boolean;
  accountSplit: { operating: number; trust: number };
  consultationFeeAmount: number | null;
  docRef: string;
  /**
   * Legacy receipt flag. Still written as an audit breadcrumb, but nothing
   * gates on it once `invoice` exists — read that instead.
   */
  paymentReceivedAt?: string;
};

export type FeeAgreementDocument = {
  docRef: string;
  datePrepared: string;
  firm: {
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    phone: string | null;
    email: string | null;
  };
  attorneyName: string;
  client: { name: string; matterType: string };
  // amount null renders as "—" (contingency line); deferred lines are excluded
  // from totalDue.
  feeLines: {
    description: string;
    amount: number | null;
    deferred?: boolean;
  }[];
  totalDue: number;
  allocation: { operating: number; trust: number; total: number };
  paymentPlan: FeePaymentPlan;
  applyConsultationCredit: boolean;
  consultationFeeAmount: number | null;
  contingencyPercent: number | null;
  governmentFeesPaidBy: GovernmentFeesPaidBy;
  noUpfrontDue: boolean;
  // Wizard-era fields — all null on agreements generated before the 3-step
  // wizard, so every renderer branch keyed on them is a no-op for old rows.
  estimatedHours: number | null;
  twoPaymentsSchedule: TwoPaymentsSchedule | null;
  installmentSchedule: InstallmentSchedule | null;
  paymentAllocation: {
    order: PaymentAllocationOrder;
    customFeePercent: number | null;
  } | null;
  contingencyTerms: {
    coversCaseCosts: boolean;
    coversExpertWitnessFees: boolean;
    ifLost: ContingencyIfLost;
    abaConfirmedAt: string;
  } | null;
};

export type FeeAgreementPreview = {
  agreement: FeeAgreement;
  document: FeeAgreementDocument;
};

export const generateFeeAgreement = async (
  id: string,
  data: GenerateFeeAgreementInput,
): Promise<FeeAgreementPreview> => {
  const res = await API.post(`/leads/${id}/generate-agreement`, data);
  return res.data.data;
};

export const getFeeAgreementPreview = async (
  agreementId: string,
): Promise<FeeAgreementPreview> => {
  const res = await API.get(`/agreements/${agreementId}/preview`);
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

export const markFeeAgreementPaymentReceived = async (
  agreementId: string,
  /**
   * How many instalments arrived. Omitted means one — the next unpaid
   * instalment, not the whole plan.
   */
  instalments?: number,
): Promise<{ received: boolean; agreementId: string }> => {
  const res = await API.post(
    `/agreements/${agreementId}/mark-payment-received`,
    instalments == null ? {} : { instalments },
  );
  return res.data.data;
};

// Draft (never-dispatched) agreements only: deletes the draft and clears the
// lead's pointer so the wizard can regenerate. Returns the stored details for
// seeding the wizard with the previous configuration.
export const discardFeeAgreement = async (
  agreementId: string,
): Promise<{
  discarded: boolean;
  agreementId: string;
  leadId: string;
  details: FeeAgreementDetails | null;
}> => {
  const res = await API.post(`/agreements/${agreementId}/discard`);
  return res.data.data;
};

export const nudgeClient = async (
  agreementId: string,
): Promise<{ reminderSentAt: string }> => {
  const res = await API.post(`/agreements/${agreementId}/nudge-client`);
  return res.data.data;
};

// ── Firm counter-signature ───────────────────────────────────────────────────

export type AgreementAwaitingSignature = {
  id: string;
  leadId: string;
  leadName: string;
  matterType: string | null;
  docRef: string | null;
  signingOrder: "client_first" | "firm_first" | null;
  clientSignedAt: string | null;
  remindedAt: string | null;
  sentAt: string;
  /** False while the other party still has to sign first. */
  canSign: boolean;
};

/** Every agreement assigned to the signed-in user and still unsigned by them. */
export const getAgreementsAwaitingSignature = async (): Promise<
  AgreementAwaitingSignature[]
> => {
  const res = await API.get("/agreements/awaiting-signature");
  return res.data.data;
};

export type FirmSignSession = {
  signUrl: string;
  clientId: string | null;
  expiresAt: number;
};

/**
 * Mint an embedded signing session for the firm's own signer. Authenticated and
 * narrowed to the assigned signer server-side, unlike the client's session,
 * which is authenticated by the token in their email.
 */
export const getFirmSignSession = async (
  agreementId: string,
): Promise<FirmSignSession> => {
  const res = await API.post(`/agreements/${agreementId}/firm-sign-session`);
  return res.data.data;
};

export const remindFirmSigner = async (
  agreementId: string,
): Promise<{ reminderSentAt: string }> => {
  const res = await API.post(`/agreements/${agreementId}/remind-signer`);
  return res.data.data;
};

export const reassignFirmSigner = async (
  agreementId: string,
  firmSignerStaffId: string,
): Promise<{
  reassigned: boolean;
  agreementId: string;
  clientMustResign: boolean;
}> => {
  const res = await API.post(`/agreements/${agreementId}/reassign-signer`, {
    firmSignerStaffId,
  });
  return res.data.data;
};

/** A short-lived download URL for the archived, fully executed PDF. */
export const getSignedAgreementUrl = async (
  agreementId: string,
): Promise<{ url: string }> => {
  const res = await API.get(`/agreements/${agreementId}/document`);
  return res.data.data;
};

export const openCase = async (
  id: string,
  data: { assignedTeamId?: string; assignedStaffId?: string; notes?: string },
): Promise<{ caseId: string; status: string; workflowSteps: unknown[] }> => {
  const res = await API.post(`/leads/${id}/open-case`, data);
  return res.data.data;
};

export interface EligibleTeamDTO {
  id: string;
  name: string;
  leadName: string | null;
  memberCount: number;
}

export const getEligibleTeams = async (
  id: string,
): Promise<EligibleTeamDTO[]> => {
  const res = await API.get(`/leads/${id}/eligible-teams`);
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
  // Viewer-local date (stored value is UTC).
  return dayjs.utc(dateStr).tz(guessTimezone()).format("MMMM D, YYYY");
}

export function formatReceivedDateDetail(dateStr: string): string {
  return `${formatReceivedDate(dateStr)} - ${formatTime(dateStr)}`;
}
