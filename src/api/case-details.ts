import { API } from "./index";

/**
 * The two practice-area extension tables.
 *
 * Deliberately narrow: these hold only the fields the workflow engine branches
 * on or anchors a due date to. The full intake form lives in the questionnaire
 * and document systems — see `.claude/workflows/01-data-model.md §5`.
 *
 * Both `GET`s return `null` for a case nobody has filled the panel in for yet.
 * That is the normal starting state, not an error: the form renders empty.
 *
 * Saving is not a plain write. The backend re-runs task materialization when a
 * condition field changes, re-resolves open tasks' due dates when an anchor
 * date changes, and schedules the RFE reminders when both RFE dates are
 * present — so invalidate the case's task list after any save.
 */

export type FilingTrack = "concurrent" | "sequential";
export type NaturalizationTrack = "general" | "marriage_to_usc" | "military";

/** § 1.1 eligibility. `filingTrack` and `preferenceCategory` derive from these two. */
export type PetitionerStatus = "usc" | "lpr";
export type RelationshipCategory =
  | "spouse"
  | "parent"
  | "child_under_21"
  | "unmarried_child_over_21"
  | "married_child"
  | "sibling";
/** Immediate relative, or one of the five family preference categories. */
export type PreferenceCategory = "ir" | "f1" | "f2a" | "f2b" | "f3" | "f4";
export type DefendantType = "private" | "government_entity";

export interface ImmigrationCaseDetails {
  id: string;
  caseId: string;
  /** Condition field — with `priorityDateIsCurrent`, decides when the I-485 package opens. */
  filingTrack: FilingTrack | null;
  naturalizationTrack: NaturalizationTrack | null;

  /*
   * § 1.1 eligibility.
   *
   * `filingTrack` and `preferenceCategory` are computed from `petitionerStatus`
   * + `relationshipCategory` and rewritten whenever either changes — unless
   * `filingTrackIsManual` is set, which hands the field to a person. Clearing
   * the latch hands it back. Same shape as `priorityDateIsManual` below.
   */
  petitionerStatus: PetitionerStatus | null;
  relationshipCategory: RelationshipCategory | null;
  preferenceCategory: PreferenceCategory | null;
  filingTrackIsManual: boolean;

  /**
   * ISO-3166 alpha-2, or `"worldwide"`. China, India, Mexico and the Philippines
   * have their own Visa Bulletin columns and can run years behind worldwide.
   */
  countryOfChargeability: string | null;

  lprDate: string | null;
  eligibilityDate: string | null;
  earliestFilingDate: string | null;
  priorityDate: string | null;
  /**
   * Condition field — attorney judgement, like `mandamusEligible`.
   *
   * A visa number is available and the I-485 may be filed. On a sequential
   * (preference-category) matter this is what opens the I-485 package; a
   * concurrent filing never waits on it. Never derived from the Visa Bulletin on
   * read: whether a date is current depends on the category, the chargeability
   * country and which chart USCIS accepts that month, and retrogression can move
   * a cutoff backwards.
   */
  priorityDateIsCurrent: boolean;
  /**
   * True once a person has set `priorityDateIsCurrent` explicitly, after which
   * the monthly Visa Bulletin job leaves this matter alone.
   */
  priorityDateIsManual: boolean;

  /*
   * § 1.5 pitfall inputs. Each is read by a named rule; see the case's
   * `/pitfalls` endpoint. All nullable — a rule with missing input says nothing.
   */
  travelWhilePending: {
    departureDate: string;
    returnDate: string | null;
    hadAdvanceParole: boolean;
  }[];
  beneficiaryStatusExpirationDate: string | null;
  employmentStartDate: string | null;
  hasWorkAuthorization: boolean;
  /** Cents, not dollars — this figure is quoted to a client. */
  sponsorIncomeCents: number | null;
  sponsorHouseholdSize: number | null;
  /** Two-letter state code. Alaska and Hawaii have their own poverty tables. */
  sponsorState: string | null;
  sponsorIsActiveDutyMilitary: boolean;
  /** Civil surgeon's signature date. Not a clock — the I-693 has no fixed validity window. */
  i693SignedDate: string | null;

  gmcRiskFlag: boolean;
  /** Attorney judgement only. Never set from the computed candidacy figures. */
  mandamusEligible: boolean | null;
  /** Condition field — a 2-year card triggers the I-751 module. */
  isConditionalResidence: boolean;

  rfeIssuedDate: string | null;
  rfeDeadline: string | null;

  usAttorneyServedDate: string | null;
  agServedDate: string | null;
  agencyHeadServedDate: string | null;
  serviceCompletedDate: string | null;
  demandLetterSentDate: string | null;
  rulingDate: string | null;
  closureType: string | null;

  createdAt: string;
  updatedAt: string;
}

export type ImmigrationCaseDetailsInput = Partial<
  Omit<ImmigrationCaseDetails, "id" | "caseId" | "createdAt" | "updatedAt">
>;

export interface PersonalInjuryCaseDetails {
  id: string;
  caseId: string;
  incidentDate: string;
  /** Condition field — `government_entity` activates the pre-suit notice module. */
  defendantType: DefendantType;
  isMinorPlaintiff: boolean;

  statuteOfLimitationsDate: string | null;
  solTollingNotes: string | null;
  governmentNoticeDeadline: string | null;

  mmiDate: string | null;
  mmiConfirmedBy: string | null;
  treatmentGapFlag: boolean;
  demandSentDate: string | null;

  defendantAnswerDate: string | null;
  msjFiledDate: string | null;
  mediationScheduledDate: string | null;
  trialDate: string | null;
  verdictDate: string | null;
  fundsReceivedDate: string | null;

  createdAt: string;
  updatedAt: string;
}

/** `incidentDate` is required the first time the row is created. */
export type PersonalInjuryCaseDetailsInput = Partial<
  Omit<PersonalInjuryCaseDetails, "id" | "caseId" | "createdAt" | "updatedAt">
>;

export async function getImmigrationDetails(
  caseId: string,
): Promise<ImmigrationCaseDetails | null> {
  const { data } = await API.get<{ data: ImmigrationCaseDetails | null }>(
    `/cases/${caseId}/immigration-details`,
  );
  return data.data;
}

export async function saveImmigrationDetails(
  caseId: string,
  input: ImmigrationCaseDetailsInput,
): Promise<ImmigrationCaseDetails> {
  const { data } = await API.put<{ data: ImmigrationCaseDetails }>(
    `/cases/${caseId}/immigration-details`,
    input,
  );
  return data.data;
}

export async function getPersonalInjuryDetails(
  caseId: string,
): Promise<PersonalInjuryCaseDetails | null> {
  const { data } = await API.get<{ data: PersonalInjuryCaseDetails | null }>(
    `/cases/${caseId}/personal-injury-details`,
  );
  return data.data;
}

export async function savePersonalInjuryDetails(
  caseId: string,
  input: PersonalInjuryCaseDetailsInput,
): Promise<PersonalInjuryCaseDetails> {
  const { data } = await API.put<{ data: PersonalInjuryCaseDetails }>(
    `/cases/${caseId}/personal-injury-details`,
    input,
  );
  return data.data;
}

// ── Milestones ─────────────────────────────────────────────────────────────

/**
 * The six dates USCIS puts on a notice.
 *
 * These are the values the backend's `case_milestone` enum carries — key maps
 * on these strings, never on a re-cased variant, per the audit-registry rule in
 * CLAUDE.md.
 */
export type CaseMilestone =
  | "receipt"
  | "biometrics_appointment"
  | "interview_scheduled"
  | "decision"
  | "card_valid_to"
  | "green_card_expiration";

export interface CaseMilestoneRecord {
  id: string;
  caseId: string;
  milestone: CaseMilestone;
  /** `YYYY-MM-DD`. */
  occurredOn: string;
  noticeNumber: string | null;
  note: string | null;
  recordedByStaffId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecordMilestoneInput {
  milestone: CaseMilestone;
  occurredOn: string;
  noticeNumber?: string | null;
  note?: string | null;
}

export async function getCaseMilestones(caseId: string): Promise<CaseMilestoneRecord[]> {
  const { data } = await API.get<{ data: CaseMilestoneRecord[] }>(`/cases/${caseId}/milestones`);
  return data.data;
}

/**
 * Recording a milestone also writes the calendar event, the audit row, and
 * re-resolves every task anchored on that date — so the workflow and the case
 * both need invalidating afterwards, not just this list.
 */
export async function recordCaseMilestone(
  caseId: string,
  input: RecordMilestoneInput,
): Promise<CaseMilestoneRecord> {
  const { data } = await API.post<{ data: CaseMilestoneRecord }>(
    `/cases/${caseId}/milestones`,
    input,
  );
  return data.data;
}

// ── The filing package, one entry per form ─────────────────────────────────

/**
 * Where a form has got to.
 *
 * Deliberately not the task-status vocabulary. A form is not a unit of work —
 * it is not "in review" or "rejected by a colleague", it is drafted, filed,
 * receipted and then adjudicated.
 */
export type CaseFormStatus =
  | "not_started"
  | "in_preparation"
  | "ready_to_file"
  | "filed"
  | "receipted"
  | "rfe"
  | "approved"
  | "denied"
  | "withdrawn";

/**
 * A filing in its own right, or a document supporting one.
 *
 * A core form has its own receipt number and its own adjudication; a supporting
 * document (I-864, I-693) has neither and is adjudicated only as part of the
 * filing it accompanies. That is why the receipt column is blank on one and not
 * missing data on the other.
 */
export type CaseFormRole = "core" | "supporting";

export interface CaseForm {
  id: string;
  caseId: string;
  /** e.g. "I-485", "I-130A". Free text — a package carries forms that are not case types. */
  formCode: string;
  role: CaseFormRole;
  status: CaseFormStatus;
  editionDate: string | null;
  filedDate: string | null;
  receiptNumber: string | null;
  /** What was actually paid, in cents — not what the schedule quotes today. */
  feeCents: number | null;
  notes: string | null;
}

export interface CaseFormProgress {
  total: number;
  /** Approved, not filed. Filed is progress; approved is done. */
  approved: number;
  filed: number;
  percentage: number;
  /** Form codes still to reach USCIS, so the UI can say what is left. */
  outstanding: string[];
}

export interface CaseFormsResponse {
  forms: CaseForm[];
  progress: CaseFormProgress;
}

export type CaseFormPatch = Partial<
  Pick<CaseForm, "role" | "status" | "editionDate" | "filedDate" | "receiptNumber" | "feeCents" | "notes">
>;

export async function getCaseForms(caseId: string): Promise<CaseFormsResponse> {
  const { data } = await API.get<{ data: CaseFormsResponse }>(`/cases/${caseId}/forms`);
  return data.data;
}

/** Additive: a form already on the matter keeps whatever state it reached. */
export async function initializeCaseForms(
  caseId: string,
  forms?: { formCode: string; role: CaseFormRole }[],
): Promise<{ created: number }> {
  const { data } = await API.post<{ data: { created: number } }>(
    `/cases/${caseId}/forms`,
    forms ? { forms } : {},
  );
  return data.data;
}

export async function updateCaseForm(
  caseId: string,
  formCode: string,
  patch: CaseFormPatch,
): Promise<CaseForm> {
  const { data } = await API.patch<{ data: CaseForm }>(
    `/cases/${caseId}/forms/${formCode}`,
    patch,
  );
  return data.data;
}

/** Refused once the form has reached USCIS — withdraw it by status instead. */
export async function removeCaseForm(caseId: string, formCode: string): Promise<void> {
  await API.delete(`/cases/${caseId}/forms/${formCode}`);
}

// ── Validation and fees ────────────────────────────────────────────────────

export type PitfallCode =
  | "travel_without_advance_parole"
  | "employment_before_work_authorization"
  | "i864_income_below_threshold"
  | "i693_bound_to_closed_application"
  | "status_expired_before_filing"
  | "form_edition_superseded";

export interface CasePitfall {
  code: PitfallCode;
  /** Only `form_edition_superseded` ever blocks; everything else is judgement. */
  severity: "block" | "warning";
  /** Already written for an attorney, naming the facts. Render it as-is. */
  message: string;
}

export async function getCasePitfalls(caseId: string): Promise<CasePitfall[]> {
  const { data } = await API.get<{ data: CasePitfall[] }>(`/cases/${caseId}/pitfalls`);
  return data.data;
}

export interface FilingFeeQuote {
  formCode: string;
  filingMethod: "online" | "paper" | "any";
  context: "standalone" | "with_pending_i485";
  amountCents: number;
  notes: string | null;
}

export async function getCaseFilingFees(caseId: string): Promise<FilingFeeQuote[]> {
  const { data } = await API.get<{ data: FilingFeeQuote[] }>(`/cases/${caseId}/filing-fees`);
  return data.data;
}
