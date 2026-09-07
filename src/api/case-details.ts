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

export async function getCaseMilestones(
  caseId: string,
): Promise<CaseMilestoneRecord[]> {
  const { data } = await API.get<{ data: CaseMilestoneRecord[] }>(
    `/cases/${caseId}/milestones`,
  );
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
  /** How full this form is, so the rail can say what still needs work. */
  /**
   * Progress, and separately whether it can be filed.
   *
   * `populated`/`total` is the count the rail shows. The required pair is
   * what marks a form done — a form with every required field in is finished
   * work even when optional boxes are still blank.
   */
  completion: {
    populated: number;
    total: number;
    requiredPopulated: number;
    requiredTotal: number;
  };
  /**
   * What this form *is*, from the catalogue.
   *
   * Null when nothing has named the code — a firm may put a form on a matter
   * before anybody catalogues it, and the rail shows the bare code until
   * somebody does.
   */
  definition: FormDefinitionSummary | null;
}

/** The catalogue entry behind a form code, as the rail and the header show it. */
export interface FormDefinitionSummary {
  id: string;
  title: string;
  description: string | null;
  /**
   * Who completes the form, when it is not the firm — written as the
   * instruction to follow.
   *
   * Set on the I-693 and nothing else today: a USCIS-designated civil surgeon
   * fills it, signs it and seals it in an envelope nobody may open. A form with
   * this is not edited here and is not in the merged package; the tab says what
   * to do instead of offering an editor for paper the firm will never print.
   */
  providedBy: string | null;
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
  Pick<
    CaseForm,
    | "role"
    | "status"
    | "editionDate"
    | "filedDate"
    | "receiptNumber"
    | "feeCents"
    | "notes"
  >
>;

export async function getCaseForms(caseId: string): Promise<CaseFormsResponse> {
  const { data } = await API.get<{ data: CaseFormsResponse }>(
    `/cases/${caseId}/forms`,
  );
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
export async function removeCaseForm(
  caseId: string,
  formCode: string,
): Promise<void> {
  await API.delete(`/cases/${caseId}/forms/${formCode}`);
}

// ── Form contents ──────────────────────────────────────────────────────────
//
// `CaseForm` above is the form's standing — filed, receipted, approved. What is
// actually *on* the form is here.

/** Where a value came from. Shown on every field, because provenance is the first thing asked of a form that turns out wrong. */
export type FormFieldValueSource = "questionnaire" | "case_record" | "manual";

export interface CaseFormField {
  /** The catalogue row, so the tab can offer Edit on a field the firm owns. */
  id: string;
  /** The datum, e.g. `beneficiary.date_of_birth`. Shared with the questionnaire question that asks it. */
  fieldKey: string;
  /** What the form calls it, which is rarely how the questionnaire asked. */
  label: string;
  /** The form's own division, e.g. "Part 1. Information About You". */
  partLabel: string | null;
  type: string;
  helpText: string | null;
  /**
   * Choices for a `single_choice` or `dropdown` field, in the same shape a
   * questionnaire question's config uses — both are written from one
   * declaration in the seed, so a field offers the same list wherever it is
   * rendered.
   */
  config: { options?: string[] } | null;
  /** Whether USCIS requires it — not whether the firm has it yet. */
  isRequired: boolean;
  value: unknown;
  valueSource: FormFieldValueSource | null;
  isManualOverride: boolean;
  /**
   * What the questionnaire now says, when that differs from a hand-edited
   * value. Null unless there is a genuine disagreement — the manual edit is
   * kept either way, and this is how the UI surfaces the drift rather than
   * silently resolving it.
   */
  conflictsWith: unknown;
}

export interface CaseFormContents {
  form: CaseForm;
  fields: CaseFormField[];
  completion: {
    populated: number;
    total: number;
    percentage: number;
    /** Required fields still empty — what stops the form being filed. */
    missingRequired: string[];
  };
}

export async function getCaseFormFields(
  caseId: string,
  formCode: string,
): Promise<CaseFormContents> {
  const { data } = await API.get<{ data: CaseFormContents }>(
    `/cases/${caseId}/forms/${formCode}/fields`,
  );
  return data.data;
}

/** A rectangle on a numbered page, in percentages of that page. */
export interface FormBoxPlacement {
  /** Zero-based, as the PDF orders its pages. */
  page: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Where one datum prints, which may be in more than one place.
 *
 * The I-130 asks the date of marriage in Part 2 and again in Part 4, and a
 * choice occupies one box per option, so this is a list rather than a
 * rectangle. Everything in it is the same field: a mark on it belongs on all of
 * them, and the reader may be looking at either.
 */
export interface FormFieldPlacement {
  fieldKey: string;
  placements: FormBoxPlacement[];
}

/**
 * Where each of a form's data prints on the blank.
 *
 * Reference data about the catalogue rather than about the matter — the blank
 * is the same government document for every firm — so the matter in the path is
 * only there to authorise the read. What it buys the Forms tab is the ability
 * to put a correction on a field by pointing at the box, instead of finding its
 * name in a list of 512.
 */
export async function getCaseFormBoxes(
  caseId: string,
  formCode: string,
): Promise<FormFieldPlacement[]> {
  const { data } = await API.get<{ data: { fields: FormFieldPlacement[] } }>(
    `/cases/${caseId}/forms/${formCode}/boxes`,
  );
  return data.data.fields;
}

/** Marks the field as hand-edited, which protects it from the next population run. */
export async function setCaseFormField(
  caseId: string,
  formCode: string,
  fieldKey: string,
  value: unknown,
): Promise<void> {
  // Encoded, because a key may name one entry of a repeating answer —
  // `beneficiary.address_history[2].city` — and square brackets are not
  // something a URL path is allowed to carry raw.
  await API.put(
    `/cases/${caseId}/forms/${formCode}/fields/${encodeURIComponent(fieldKey)}`,
    { value },
  );
}

/**
 * A whole form's corrections, saved together.
 *
 * What the Forms tab actually calls: staff edit a form and press Save, so one
 * request carries everything that changed. Each value is marked as hand-edited
 * exactly as a single-field save would.
 */
export async function setCaseFormFields(
  caseId: string,
  formCode: string,
  fields: { fieldKey: string; value: unknown }[],
): Promise<{ changed: number; version: FormVersion | null }> {
  const { data } = await API.put<{
    data: { changed: number; version: FormVersion | null };
  }>(`/cases/${caseId}/forms/${formCode}/fields`, { fields });
  return data.data;
}

export interface PopulateResult {
  filled: number;
  updated: number;
  /** Hand-edited fields replaced, which only ever happens on request. */
  overridden: number;
  /** Hand-edited fields the questionnaire now disagrees with. */
  conflicts: { formCode: string; fieldKey: string }[];
  /** Why nothing happened, when nothing did. */
  skipped: "no forms" | "no answers" | null;
}

export interface PopulateOptions {
  /** Replace hand-edited values the questionnaire now disagrees with. */
  overrideManual?: boolean;
  /** Report what the pass would do, and write none of it. */
  dryRun?: boolean;
}

/**
 * Re-fill the matter's forms from its case questionnaire.
 *
 * Runs automatically on submission; this is the same pass on demand, for
 * answers corrected afterwards. Safe to repeat — hand-edited fields are never
 * overwritten.
 */
export async function populateCaseForms(
  caseId: string,
  options: PopulateOptions = {},
): Promise<PopulateResult> {
  const { data } = await API.post<{ data: PopulateResult }>(
    `/cases/${caseId}/forms/populate`,
    options,
  );
  return data.data;
}

// ── The form catalogue, as a firm sees it ──────────────────────────────────
//
// Read-only. What a form is and what fields it has is Oravanti's, maintained in
// its CRM and identical for every firm — a form is a government blank, and
// nobody but the government changes what is on it. The three functions that
// used to write it (`updateFormDefinition`, `addFieldDefinition` and their
// siblings) are gone, along with the copy-on-write tier they served.
//
// What a firm still decides is which forms this matter files, which is a
// decision about the matter rather than about the form.

/** A form Oravanti publishes, as the "add a form" picker lists them. */
export interface PublishedForm {
  id: string;
  formCode: string;
  title: string;
  description: string | null;
}

export async function getPublishedForms(): Promise<PublishedForm[]> {
  const { data } = await API.get<{ data: PublishedForm[] }>(
    "/cases/published-forms",
  );
  return data.data;
}

/**
 * Put a published form on this matter.
 *
 * For the form the workflow template did not anticipate — an I-765 on a matter
 * that was not going to file one. The code must be one Oravanti publishes; an
 * unknown one is a 404 rather than an invitation to name it.
 */
export async function addCaseForm(
  caseId: string,
  formCode: string,
  role?: CaseFormRole,
): Promise<CaseForm> {
  const { data } = await API.post<{ data: CaseForm }>(
    `/cases/${caseId}/forms/${formCode}`,
    { role },
  );
  return data.data;
}

// ── Form history ───────────────────────────────────────────────────────────
//
// A version per save, per form. `actor` separates a person typing on the form
// from a population run carrying answers across — the first question anyone
// asks of a form that turns out to be wrong.

export type FormActor = "staff" | "questionnaire";

export interface FormVersion {
  id: string;
  versionNumber: number;
  actor: FormActor;
  changedCount: number;
  /** Set when the save was a restore, naming the version it put back. */
  restoredFromVersionId: string | null;
  createdAt: string;
  /** Null for a population run, which no one person performed. */
  savedBy: string | null;
}

export interface FormVersionChange {
  fieldKey: string;
  label: string;
  previousValue: unknown;
  value: unknown;
  previousSource: FormFieldValueSource | null;
  source: FormFieldValueSource | null;
}

export interface FormVersionDetail extends FormVersion {
  formCode: string | null;
  /** `{ fieldKey: value }` for the whole form at that moment. */
  values: Record<string, unknown>;
  changes: FormVersionChange[];
}

export interface FormFieldRevision {
  id: string;
  previousValue: unknown;
  value: unknown;
  previousSource: FormFieldValueSource | null;
  source: FormFieldValueSource | null;
  actor: FormActor;
  createdAt: string;
  versionNumber: number;
  changedBy: string | null;
}

export async function getFormVersions(
  caseId: string,
  formCode: string,
): Promise<FormVersion[]> {
  const { data } = await API.get<{ data: FormVersion[] }>(
    `/cases/${caseId}/forms/${formCode}/versions`,
  );
  return data.data;
}

export async function getFormVersion(
  caseId: string,
  formCode: string,
  versionId: string,
): Promise<FormVersionDetail> {
  const { data } = await API.get<{ data: FormVersionDetail }>(
    `/cases/${caseId}/forms/${formCode}/versions/${versionId}`,
  );
  return data.data;
}

export async function getFieldHistory(
  caseId: string,
  formCode: string,
  fieldKey: string,
): Promise<FormFieldRevision[]> {
  const { data } = await API.get<{ data: FormFieldRevision[] }>(
    `/cases/${caseId}/forms/${formCode}/fields/${encodeURIComponent(fieldKey)}/history`,
  );
  return data.data;
}

/**
 * Both restores are POSTs because each writes a *new* version rather than
 * rewinding to an old one — nothing after the restored version is erased.
 */
export async function restoreFormVersion(
  caseId: string,
  formCode: string,
  versionId: string,
): Promise<{ changed: number; restoredFrom: number }> {
  const { data } = await API.post<{
    data: { changed: number; restoredFrom: number };
  }>(`/cases/${caseId}/forms/${formCode}/versions/${versionId}/restore`);
  return data.data;
}

export async function restoreFieldRevision(
  caseId: string,
  revisionId: string,
): Promise<{ changed: number; fieldKey: string }> {
  const { data } = await API.post<{
    data: { changed: number; fieldKey: string };
  }>(`/cases/${caseId}/form-revisions/${revisionId}/restore`);
  return data.data;
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
  const { data } = await API.get<{ data: CasePitfall[] }>(
    `/cases/${caseId}/pitfalls`,
  );
  return data.data;
}

export interface FilingFeeQuote {
  formCode: string;
  filingMethod: "online" | "paper" | "any";
  context: "standalone" | "with_pending_i485";
  amountCents: number;
  notes: string | null;
}

export async function getCaseFilingFees(
  caseId: string,
): Promise<FilingFeeQuote[]> {
  const { data } = await API.get<{ data: FilingFeeQuote[] }>(
    `/cases/${caseId}/filing-fees`,
  );
  return data.data;
}

// ─── Field sources, read-only ───────────────────────────────────────────────
//
// Which question fills which box, so the Questionnaire tab can label a question
// with the boxes it feeds. A firm cannot change these: one row decides the
// answer for every firm in the deployment, so the wiring lives in Oravanti's
// CRM. The box mappings themselves are not read here at all — a firm has no
// screen that shows them.

/** What one form's fields are fed by, for the whole package read below. */
export interface FormFieldFeed {
  fieldKey: string;
  label: string;
  question: { id: string; label: string } | null;
}

export interface CaseFieldFeeds {
  forms: { formCode: string; fields: FormFieldFeed[] }[];
}

/**
 * Every field on every form in the package, and the question behind each.
 *
 * The Questionnaire tab's read: it labels each question with what it fills,
 * which is a question about the package rather than about one form.
 */
export const getCaseFieldFeeds = async (
  caseId: string,
): Promise<CaseFieldFeeds> => {
  const { data } = await API.get<{ data: CaseFieldFeeds }>(
    `/cases/${caseId}/field-map`,
  );
  return data.data;
};

/**
 * The matter's copy of a form, filled, as bytes for an inline viewer.
 *
 * Fetched as a blob rather than pointed at directly because the endpoint needs
 * the app's auth cookies and headers — a bare `src` on the URL would be an
 * unauthenticated request.
 *
 * The **blob** is returned rather than an object URL, and that distinction is
 * load-bearing: an object URL is a live handle that has to be revoked when its
 * viewer goes away, so caching one hands the next reader a revoked URL and a
 * blank frame. Bytes cache safely. The viewer makes its own URL and revokes
 * that — see `FormPdfView`.
 */
export const getCaseFormPdf = async (
  caseId: string,
  formCode: string,
): Promise<{ blob: Blob; written: number; mapped: number }> => {
  try {
    const res = await API.get(`/cases/${caseId}/forms/${formCode}/pdf`, {
      responseType: "blob",
    });

    return {
      blob: res.data as Blob,
      written: Number(res.headers["x-fields-written"] ?? 0),
      mapped: Number(res.headers["x-fields-mapped"] ?? 0),
    };
  } catch (error) {
    // Asking for a blob means the *error* body arrives as one too, so the
    // server's explanation is bytes rather than JSON. It is unpacked here, at
    // the one place that knows the request was made this way — a caller reading
    // `error.message` should not have to know that.
    throw new Error(await readErrorMessage(error), { cause: error });
  }
};

/** What came back from a package render, beyond the paper itself. */
export type FilingPackagePdf = {
  blob: Blob;
  /** The forms in the merged document, in the order they appear. */
  included: string[];
  /** Forms that could not be rendered, each with the reason. */
  failed: string[];
  /**
   * Forms the package deliberately leaves out because somebody outside the firm
   * completes them — the I-693 sealed envelope. Not a failure: paper that goes
   * in the envelope by hand.
   */
  provided: string[];
  /** Repeating answers that overflowed even the continuation sheets. */
  unplaced: string[];
};

/**
 * Every form on the matter, merged into one PDF in package order.
 *
 * Downloaded rather than viewed inline: this is the assembled filing, and what
 * a person does with it is print it. The two header lists are the point of the
 * call — a package short of its I-864 looks exactly like a complete one on
 * screen, so `failed` has to reach the toast.
 */
export const getCaseFilingPackagePdf = async (
  caseId: string,
): Promise<FilingPackagePdf> => {
  try {
    const res = await API.get(`/cases/${caseId}/forms/package/pdf`, {
      responseType: "blob",
    });

    const list = (header: string) =>
      String(res.headers[header] ?? "")
        .split(header === "x-forms-failed" ? ";" : ",")
        .map((entry) => entry.trim())
        .filter(Boolean);

    return {
      blob: res.data as Blob,
      included: list("x-forms-included"),
      failed: list("x-forms-failed"),
      provided: list("x-forms-provided"),
      unplaced: list("x-fields-unplaced"),
    };
  } catch (error) {
    throw new Error(await readErrorMessage(error), { cause: error });
  }
};

/** "No blank PDF for the 2024-06-17 edition of I-131…" rather than "Request failed". */
const readErrorMessage = async (error: unknown): Promise<string> => {
  const body = (error as { response?: { data?: unknown } })?.response?.data;

  try {
    const parsed = body instanceof Blob ? JSON.parse(await body.text()) : body;
    const message = (parsed as { message?: string } | undefined)?.message;
    if (typeof message === "string" && message) return message;
  } catch {
    // Not JSON, or an unreadable body. Fall through to the generic line.
  }

  return "This form has no filled PDF yet.";
};

// ─── The attorney's review of the filing package ────────────────────────────

/** The colours a reviewing attorney can mark in. See the backend's enum for why it is a closed set. */
export const CORRECTION_COLORS = ["red", "amber", "blue", "violet"] as const;

export type CorrectionColor = (typeof CORRECTION_COLORS)[number];

export type FilingReviewStatus =
  "in_preparation" | "in_review" | "changes_requested" | "approved";

export type CorrectionComment = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string | null;
};

/**
 * One mark on the package.
 *
 * Anchored by `partLabel` *or* `fieldKey`, never both — the two render in
 * different places, so the tab branches on which one is set rather than on a
 * type field that would have to be kept in step with them.
 */
export type FormCorrection = {
  id: string;
  caseFormId: string;
  formCode: string;
  partLabel: string | null;
  fieldKey: string | null;
  color: CorrectionColor;
  note: string;
  status: "open" | "resolved";
  raisedById: string;
  raisedByName: string | null;
  raisedAt: string;
  resolvedById: string | null;
  resolvedByName: string | null;
  resolvedAt: string | null;
  comments: CorrectionComment[];
};

export type FilingReview = {
  status: FilingReviewStatus;
  approvedAt: string | null;
  approvedByName: string | null;
  openCount: number;
  corrections: FormCorrection[];
  /**
   * Whether the person asking may mark, approve and reopen.
   *
   * From the server rather than from the user's role in the auth store: "who is
   * an attorney" is answered from three columns that disagree in real data, and
   * the app must not offer a control that would 403.
   */
  canReview: boolean;
};

export const getFilingReview = async (
  caseId: string,
): Promise<FilingReview> => {
  const { data } = await API.get<{ data: FilingReview }>(
    `/cases/${caseId}/filing-review`,
  );
  return data.data;
};

export const requestFilingReview = async (caseId: string) => {
  const { data } = await API.post<{ data: { status: FilingReviewStatus } }>(
    `/cases/${caseId}/filing-review/request`,
  );
  return data.data;
};

export const approveFilingReview = async (caseId: string) => {
  const { data } = await API.post<{ data: { status: FilingReviewStatus } }>(
    `/cases/${caseId}/filing-review/approve`,
  );
  return data.data;
};

export type RaiseCorrectionInput = {
  caseFormId: string;
  partLabel?: string | null;
  fieldKey?: string | null;
  color?: CorrectionColor;
  note: string;
};

export const raiseCorrection = async (
  caseId: string,
  input: RaiseCorrectionInput,
) => {
  const { data } = await API.post<{ data: FormCorrection }>(
    `/cases/${caseId}/corrections`,
    input,
  );
  return data.data;
};

export const resolveCorrection = async (
  caseId: string,
  correctionId: string,
  note: string,
) => {
  const { data } = await API.post<{ data: { status: "resolved" } }>(
    `/cases/${caseId}/corrections/${correctionId}/resolve`,
    { note },
  );
  return data.data;
};

export const reopenCorrection = async (
  caseId: string,
  correctionId: string,
  note: string,
) => {
  const { data } = await API.post<{ data: { status: "open" } }>(
    `/cases/${caseId}/corrections/${correctionId}/reopen`,
    { note },
  );
  return data.data;
};

export const commentOnCorrection = async (
  caseId: string,
  correctionId: string,
  body: string,
) => {
  const { data } = await API.post<{ data: CorrectionComment }>(
    `/cases/${caseId}/corrections/${correctionId}/comments`,
    { body },
  );
  return data.data;
};
