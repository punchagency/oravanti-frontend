import { API } from ".";
import { httpClient } from "@/services/http-client";
import type { LogicRule } from "@/lib/questionnaire/logic";

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * Who authored a section or question, and therefore how far it reaches:
 * `system` is the platform's locked backbone, `firm` is this firm's addition to
 * every matter of a case type, `case` is one written for a single matter.
 */
export type QuestionnaireScope = "system" | "firm" | "case";

/**
 * When a questionnaire is asked. `intake` goes to a prospect before any case
 * exists; `case` is the substantive one a signed client answers, and is what
 * populates the matter's forms.
 */
export type QuestionnaireStage = "intake" | "case";

export type EligibleLead = {
  id: string;
  name: string;
  email: string;
  caseTypeId: string | null;
  caseTypeName: string | null;
};

export type QuestionBankEntry = {
  caseTypeId: string;
  caseTypeName: string | null;
  questions: { label: string; type: string; description: string | null }[];
};

export type PreviewQuestion = {
  id: string;
  label: string;
  type: string;
  isRequired: boolean;
  isLocked: boolean;
  scope: QuestionnaireScope;
};

export type PreviewSection = {
  id: string;
  title: string;
  scope: QuestionnaireScope;
  questions: PreviewQuestion[];
};

export type CaseTypeQuestionnairePreview = {
  systemQuestionnaire: { id: string; title: string } | null;
  sections: PreviewSection[];
};

export type CustomQuestionInput = {
  label: string;
  type?: string;
  isRequired?: boolean;
  saveToFirm?: boolean;
};

export type CustomDocumentInput = {
  label: string;
  isRequired?: boolean;
  saveToFirm?: boolean;
};

export type SendQuestionnaireConfig = {
  deliveryChannels?: ("email" | "sms")[];
  language?: string;
  autoReminderDays?: 2 | 3 | 5 | 7 | null;
  customQuestions?: CustomQuestionInput[];
  customDocumentRequests?: CustomDocumentInput[];
};

/** Where a document's AI analysis got to. Mirrors the ai_scan_status enum. */
export type AiScanStatus =
  "pending" | "queued" | "running" | "complete" | "failed" | "skipped";

/**
 * What AI review found against one document.
 *
 * `status` and `flags` are both needed: no flags on a `complete` scan means the
 * document is clean, while no flags on a `failed` one means nobody looked.
 */
export type DocumentAiReview = {
  status: AiScanStatus;
  flags: { issueId: string; flag: string; badge: "critical" | "warning" }[];
};

export type ResponseFile = {
  id: string;
  questionId: string;
  documentId: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  aiReview: DocumentAiReview;
};

export type ResponseAnswer = {
  questionId: string;
  value: unknown;
};

export type QuestionnaireResponseDetail = {
  response: {
    id: string;
    status: "draft" | "submitted";
    leadId: string | null;
    submittedAt: string | null;
  };
  send: {
    id: string;
    language: string;
    schemaSnapshot: {
      title?: string;
      sections?: {
        id: string;
        title: string;
        questions: { id: string; label: string; type: string }[];
      }[];
    } | null;
  } | null;
  answers: ResponseAnswer[];
  files: ResponseFile[];
  completion: { answered: number; total: number };
};

// ─── Admin / staff (authenticated) ────────────────────────────────────────────
// NOTE: questionnaire endpoints return raw JSON (not {success,data} wrapped),
// except sendQuestionnaire which lives on the leads resource and IS wrapped.

export type LeadQuestionnaireSendStatus =
  "sent" | "opened" | "draft_response" | "submitted" | "expired" | "revoked";

export type LeadQuestionnaireState = {
  send: {
    id: string;
    status: LeadQuestionnaireSendStatus;
    language: string;
    submittedAt: string | null;
  } | null;
  response: {
    id: string;
    status: "draft" | "submitted";
    submittedAt: string | null;
  } | null;
} | null;

export const getLeadQuestionnaire = async (
  leadId: string,
): Promise<LeadQuestionnaireState> => {
  const res = await API.get(`/leads/${leadId}/questionnaire`);
  return res.data.data;
};

export const getEligibleLeads = async (): Promise<EligibleLead[]> => {
  const res = await API.get("/questionnaires/eligible-leads");
  return res.data.data;
};

export const getFirmName = async (): Promise<string | null> => {
  const res = await API.get("/settings/firm-info");
  return res.data.data?.firmName ?? null;
};

export const getQuestionBank = async (): Promise<QuestionBankEntry[]> => {
  const res = await API.get("/questionnaires/question-bank");
  return res.data.data;
};

export const getCaseTypeQuestionnairePreview = async (
  caseTypeId: string,
): Promise<CaseTypeQuestionnairePreview> => {
  const res = await API.get(`/questionnaires/intake/case-type/${caseTypeId}`);
  return res.data.data;
};

export const sendQuestionnaire = async (
  leadId: string,
  config: SendQuestionnaireConfig,
): Promise<{ clientLink: string; sentAt: string }> => {
  const res = await API.post(`/leads/${leadId}/send-questionnaire`, config);
  return res.data.data;
};

export const getResponseDetail = async (
  responseId: string,
): Promise<QuestionnaireResponseDetail> => {
  const res = await API.get(`/questionnaires/responses/${responseId}/detail`);
  return res.data.data;
};

export const acceptResponse = async (
  responseId: string,
): Promise<{ advanced: boolean; leadId: string | null }> => {
  const res = await API.post(`/questionnaires/responses/${responseId}/accept`);
  return res.data.data;
};

export const sendReminder = async (
  sendId: string,
): Promise<{ reminderSentAt: string }> => {
  const res = await API.post(`/questionnaires/sends/${sendId}/remind`);
  return res.data.data;
};

export const requestMissingDocuments = async (
  sendId: string,
): Promise<{ missing: string[] }> => {
  const res = await API.post(
    `/questionnaires/sends/${sendId}/request-documents`,
  );
  return res.data.data;
};

export const uploadResponseFileByStaff = async (
  responseId: string,
  questionId: string,
  file: File,
): Promise<ResponseFile> => {
  const form = new FormData();
  form.append("file", file);
  form.append("questionId", questionId);
  const res = await API.post(
    `/questionnaires/responses/${responseId}/files`,
    form,
  );
  return res.data.data;
};

const triggerBlobDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadResponsePdf = async (
  responseId: string,
): Promise<void> => {
  const res = await API.get(`/questionnaires/responses/${responseId}/pdf`, {
    responseType: "blob",
  });
  triggerBlobDownload(res.data, `questionnaire-response-${responseId}.pdf`);
};

export const downloadResponseFile = async (
  fileId: string,
  filename: string,
): Promise<void> => {
  const res = await API.get(`/questionnaires/files/${fileId}/download`, {
    responseType: "blob",
  });
  triggerBlobDownload(res.data, filename);
};

// ─── Public client portal (unauthenticated, token-based) ───────────────────────

export type PortalQuestion = {
  id: string;
  label: string;
  /** Present on a case questionnaire, which is served live rather than frozen. */
  description?: string | null;
  type: string;
  isRequired: boolean;
  config?: QuestionConfig;
};

export type PortalSection = {
  id: string;
  title: string;
  description?: string | null;
  questions: PortalQuestion[];
};

export type PortalQuestionnaire = {
  send: {
    id: string;
    language: string;
    /** Why this link was sent. Drives the banner the client opens on. */
    reason: QuestionnaireSendReason;
    reasonNote: string | null;
  };
  questionnaire: {
    title?: string;
    sections?: PortalSection[];
    /**
     * The branches, evaluated in the browser as the client types.
     *
     * They travel with the questions rather than being applied server-side,
     * because a branch that only opens after a round trip is one the client
     * never sees open. The server evaluates the same rules from the same
     * mirrored file when it validates a submission and when it fills a form.
     */
    logicRules?: LogicRule[];
  } | null;
  response: {
    id: string;
    status: string;
    answers?: { questionId: string; value: unknown }[];
    files?: { questionId: string; originalFilename: string }[];
  } | null;
};

// Saving is what creates the response row, so the saved response — and its id,
// which file uploads must be attached to — comes back on every draft/submit.
export type PortalSavedResponse = {
  id: string;
  status: "draft" | "submitted";
};

export const getQuestionnaireByToken = async (
  token: string,
): Promise<PortalQuestionnaire> => {
  const res = await httpClient.get(`/questionnaires/client/${token}`);
  return res.data.data;
};

export const saveDraftByToken = async (
  token: string,
  data: {
    currentSectionId?: string | null;
    answers: { questionId: string; value: unknown }[];
  },
): Promise<PortalSavedResponse> => {
  const res = await httpClient.put(
    `/questionnaires/client/${token}/draft`,
    data,
  );
  return res.data.data;
};

export const submitByToken = async (
  token: string,
  data: {
    currentSectionId?: string | null;
    answers: { questionId: string; value: unknown }[];
  },
): Promise<PortalSavedResponse> => {
  const res = await httpClient.post(
    `/questionnaires/client/${token}/submit`,
    data,
  );
  return res.data.data;
};

export const uploadFileByToken = async (
  token: string,
  data: {
    responseId: string;
    questionId: string;
    file: File;
  },
): Promise<unknown> => {
  const form = new FormData();
  form.append("file", data.file);
  form.append("responseId", data.responseId);
  form.append("questionId", data.questionId);
  const res = await httpClient.post(
    `/questionnaires/client/${token}/files`,
    form,
  );
  return res.data.data;
};

// ─── The case questionnaire ─────────────────────────────────────────────────
//
// A matter's own questionnaire, distinct from the intake one a prospect
// answered. It is the substantive one — its answers are what fill the forms —
// and it is answered two ways, often both in turn: staff type what the file
// already tells them, and the rest goes to the client as a link.

/** The question type vocabulary, shared with form fields. */
export type QuestionType =
  | "short_text"
  | "long_text"
  | "number"
  | "email"
  | "phone"
  | "date"
  | "time"
  | "single_choice"
  | "multiple_choice"
  | "dropdown"
  | "rating_scale"
  | "file_upload"
  | "yes_no"
  | "matrix_grid"
  | "signature"
  | "repeat_group";

/**
 * One sub-field of a repeating question, as the question's `config` declares it.
 *
 * Mirrors `RepeatGroupItemField` on the backend. An entry is a row on a form and
 * has no rows inside it, so a sub-field is a plain scalar — there is no nesting
 * here and there is deliberately no place to add one.
 */
export type RepeatGroupItemField = {
  key: string;
  label: string;
  type: QuestionType;
  required?: boolean;
  config?: { options?: string[] };
};

/**
 * A question's `config` — one `jsonb` column carrying two unrelated things.
 *
 * A choice question puts its `options` here; a `repeat_group` puts the
 * declaration of what one entry holds. Both keys are optional rather than a
 * discriminated union, because the discriminator is `type` on the question
 * *beside* this and TypeScript cannot narrow one field by another. Read it
 * defensively — the server does no schema validation on the column, so a row
 * written by a newer deployment can carry keys this build has never seen.
 */
export type QuestionConfig = {
  options?: string[];
  /** Singular, for the Add button and each entry's heading: "Address". */
  itemLabel?: string;
  /** How many entries the form has room for. */
  maxItems?: number;
  fields?: RepeatGroupItemField[];
};

export type CaseQuestion = {
  id: string;
  label: string;
  description: string | null;
  /** The shared vocabulary name, when this question has one. */
  fieldKey: string | null;
  type: QuestionType;
  isRequired: boolean;
  isLocked: boolean;
  scope: QuestionnaireScope;
  orderIndex: number;
  config: QuestionConfig | null;
};

export type CaseSection = {
  id: string;
  title: string;
  description: string | null;
  isLocked: boolean;
  scope: QuestionnaireScope;
  orderIndex: number;
  questions: CaseQuestion[];
};

export type CaseQuestionnaire = {
  systemQuestionnaire: {
    id: string;
    title: string;
    description: string | null;
  } | null;
  sections: CaseSection[];
  /** The same branches the client's copy carries. See PortalQuestionnaire. */
  logicRules: LogicRule[];
};

export type CaseAnswer = {
  questionId: string;
  value: unknown;
  updatedAt: string;
};

export type CaseResponse = {
  id: string;
  status: "draft" | "submitted" | "reviewed" | "accepted";
  submittedAt: string | null;
  lastSavedAt: string;
  questionnaireSendId: string | null;
  filledById: string | null;
  answers: CaseAnswer[];
};

export type IntakeAnswer = {
  questionId: string;
  value: unknown;
  label: string;
  type: QuestionType;
  sectionTitle: string;
};

export type IntakeResponseForCase = {
  id: string;
  status: string;
  submittedAt: string | null;
  leadId: string | null;
  answers: IntakeAnswer[];
};

export const getCaseQuestionnaire = async (
  caseId: string,
): Promise<CaseQuestionnaire> => {
  const res = await API.get(`/questionnaires/case/${caseId}`);
  return res.data.data;
};

export const getCaseResponse = async (
  caseId: string,
): Promise<CaseResponse | null> => {
  const res = await API.get(`/questionnaires/case/${caseId}/response`);
  return res.data.data;
};

export const getIntakeResponseForCase = async (
  caseId: string,
): Promise<IntakeResponseForCase | null> => {
  const res = await API.get(`/questionnaires/case/${caseId}/intake`);
  return res.data.data;
};

export const saveCaseAnswers = async (
  caseId: string,
  data: {
    status?: "draft" | "submitted";
    /** The section Save was pressed on, so its version is named in history. */
    sectionId?: string | null;
    answers: { questionId: string; value: unknown }[];
  },
): Promise<{
  response: CaseResponse;
  /** How many answers actually differed — zero means nothing was recorded. */
  changed: number;
  version: { id: string; versionNumber: number } | null;
  fieldsPopulated: number;
}> => {
  const res = await API.put(`/questionnaires/case/${caseId}/answers`, data);
  return res.data.data;
};

/**
 * Why a questionnaire link was sent. Mirrors `questionnaire_send_reason` in
 * the backend schema; the client is shown the reason and the note with it.
 */
export type QuestionnaireSendReason = "new" | "correction" | "attention";

export const sendCaseQuestionnaire = async (
  caseId: string,
  data: {
    sectionIds?: string[];
    autoReminderDays?: number | null;
    dueInDays?: number | null;
    /** Why the client is being asked. Required — the client is shown it. */
    reason: QuestionnaireSendReason;
    reasonNote?: string | null;
  },
): Promise<{ clientLink: string; sectionsSent: number }> => {
  const res = await API.post(`/questionnaires/case/${caseId}/send`, data);
  return res.data.data;
};

// ─── Answer history ─────────────────────────────────────────────────────────
//
// Every save is a version, and every answer that changed within it is a
// revision. The two are the same record read at different grains: the version
// answers "what happened to this questionnaire", the revision "what happened to
// this answer" — and both are addressed through the matter, never by bare id.

export type AnswerActor = "staff" | "client";

/** One save. The snapshot it holds is fetched separately, by id. */
export type AnswerVersion = {
  id: string;
  versionNumber: number;
  actor: AnswerActor;
  changedCount: number;
  createdAt: string;
  /** Set when this save was itself a restore, naming what it restored. */
  restoredFromVersionId: string | null;
  /** Null for a save spanning sections, such as a restore. */
  sectionTitle: string | null;
  /** Null for a client save — the client is credited by `actor`. */
  savedBy: string | null;
};

export type VersionChange = {
  questionId: string;
  previousValue: unknown;
  value: unknown;
  label: string | null;
};

export type AnswerVersionDetail = AnswerVersion & {
  answers: Record<string, unknown>;
  changes: VersionChange[];
};

/** One answer's before-and-after, at one moment. */
export type AnswerRevision = {
  id: string;
  previousValue: unknown;
  value: unknown;
  actor: AnswerActor;
  createdAt: string;
  versionNumber: number;
  changedBy: string | null;
};

export const getCaseVersions = async (
  caseId: string,
): Promise<AnswerVersion[]> => {
  const res = await API.get(`/questionnaires/case/${caseId}/versions`);
  return res.data.data;
};

export const getCaseVersion = async (
  caseId: string,
  versionId: string,
): Promise<AnswerVersionDetail> => {
  const res = await API.get(
    `/questionnaires/case/${caseId}/versions/${versionId}`,
  );
  return res.data.data;
};

export const getAnswerHistory = async (
  caseId: string,
  questionId: string,
): Promise<AnswerRevision[]> => {
  const res = await API.get(
    `/questionnaires/case/${caseId}/questions/${questionId}/history`,
  );
  return res.data.data;
};

/** Both restores write forward, as a new save, and report what they changed. */
type RestoreResult = { changed: number; fieldsPopulated: number };

export const restoreVersion = async (
  caseId: string,
  versionId: string,
): Promise<RestoreResult> => {
  const res = await API.post(
    `/questionnaires/case/${caseId}/versions/${versionId}/restore`,
  );
  return res.data.data;
};

export const restoreAnswer = async (
  caseId: string,
  revisionId: string,
): Promise<RestoreResult> => {
  const res = await API.post(
    `/questionnaires/case/${caseId}/revisions/${revisionId}/restore`,
  );
  return res.data.data;
};

// ─── Authoring ──────────────────────────────────────────────────────────────
//
// Two tiers, one pair of shapes. The route decides reach: a write addressed to
// a case type applies to every matter of that type, one addressed to a case
// applies to that matter alone. Editing and deletion address the row by id, so
// they are the same call for both tiers — and neither can touch a platform row.

export type SectionInput = {
  title: string;
  description?: string | null;
  stage?: QuestionnaireStage;
};

export type QuestionInput = {
  sectionId: string;
  label: string;
  description?: string | null;
  fieldKey?: string | null;
  type: QuestionType;
  isRequired?: boolean;
  config?: QuestionConfig;
  stage?: QuestionnaireStage;
};

export const addCaseSection = async (caseId: string, data: SectionInput) => {
  const res = await API.post(`/questionnaires/case/${caseId}/sections`, data);
  return res.data.data as CaseSection;
};

export const addCaseQuestion = async (caseId: string, data: QuestionInput) => {
  const res = await API.post(`/questionnaires/case/${caseId}/questions`, data);
  return res.data.data as CaseQuestion;
};

export const addFirmSection = async (
  caseTypeId: string,
  data: SectionInput,
) => {
  const res = await API.post(
    `/questionnaires/case-type/${caseTypeId}/sections`,
    data,
  );
  return res.data.data as CaseSection;
};

export const addFirmQuestion = async (
  caseTypeId: string,
  data: QuestionInput,
) => {
  const res = await API.post(
    `/questionnaires/case-type/${caseTypeId}/questions`,
    data,
  );
  return res.data.data as CaseQuestion;
};

export const getFirmQuestionnaire = async (
  caseTypeId: string,
  stage: QuestionnaireStage,
): Promise<CaseQuestionnaire> => {
  const res = await API.get(`/questionnaires/case-type/${caseTypeId}`, {
    params: { stage },
  });
  return res.data.data;
};

export const updateSection = async (
  sectionId: string,
  data: Partial<SectionInput>,
) => {
  const res = await API.patch(`/questionnaires/sections/${sectionId}`, data);
  return res.data.data as CaseSection;
};

export const deleteSection = async (sectionId: string): Promise<void> => {
  await API.delete(`/questionnaires/sections/${sectionId}`);
};

export const updateQuestion = async (
  questionId: string,
  data: Partial<Omit<QuestionInput, "sectionId">>,
) => {
  const res = await API.patch(`/questionnaires/questions/${questionId}`, data);
  return res.data.data as CaseQuestion;
};

export const deleteQuestion = async (questionId: string): Promise<void> => {
  await API.delete(`/questionnaires/questions/${questionId}`);
};

/** One name a question can be wired to, and where it prints. */
export interface FieldVocabularyEntry {
  fieldKey: string;
  label: string;
  /**
   * Every form that prints it. More than one is the point of a shared name.
   *
   * Empty is a real state and not an error: a declared datum the questionnaire
   * asks for that no catalogued box prints yet — `travel.purpose`,
   * `medical.exam_date`. Wiring a question to one is right; it simply feeds no
   * form until a box is pointed at it.
   */
  formCodes: string[];
  /**
   * The datum's domain — beneficiary, petitioner, marriage — or null where the
   * key is one form's own name for one box. What the picker groups by.
   */
  category: string | null;
  /**
   * Whether an answer to this is per entry — a list, or something inside one.
   *
   * A question may be wired to a list (`beneficiary.address_history` is one
   * question answering many times); a *box* may not, because a box holds one
   * value. The question dialog and the field dialog split this list on it.
   */
  isRepeating: boolean;
}

/**
 * Every name the catalogued forms can be filled from.
 *
 * The same list for both tiers, behind two routes because the guards differ —
 * a firm admin holds `workflow:read`, an operator is a platform admin, and
 * neither can use the other's path. `tier` picks the one the caller can reach.
 *
 * A matter's own question has no business here: naming a form field is a claim
 * about every firm's forms, not about one file. See `QuestionDialog`.
 */
export const getFieldVocabulary = async (
  tier: "firm" | "platform",
): Promise<FieldVocabularyEntry[]> => {
  const res = await API.get(
    tier === "platform"
      ? "/questionnaires/system/field-vocabulary"
      : "/questionnaires/field-vocabulary",
  );
  return res.data.data;
};
