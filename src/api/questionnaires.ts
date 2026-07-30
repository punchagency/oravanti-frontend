import { API } from ".";
import { httpClient } from "@/services/http-client";

// ─── Types ──────────────────────────────────────────────────────────────────

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
  source: "system" | "firm";
};

export type PreviewSection = {
  id: string;
  title: string;
  source: "system" | "firm";
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
  | "pending"
  | "queued"
  | "running"
  | "complete"
  | "failed"
  | "skipped";

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
  questionSource: "system" | "firm";
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
  | "sent"
  | "opened"
  | "draft_response"
  | "submitted"
  | "expired"
  | "revoked";

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
  const res = await API.get(
    `/questionnaires/responses/${responseId}/pdf`,
    { responseType: "blob" },
  );
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
  type: string;
  isRequired: boolean;
  config?: Record<string, unknown>;
};

export type PortalSection = {
  id: string;
  title: string;
  description?: string | null;
  questions: PortalQuestion[];
};

export type PortalQuestionnaire = {
  send: { id: string; language: string };
  questionnaire: { title?: string; sections?: PortalSection[] } | null;
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
    currentSectionRef?: { source: string; id: string } | null;
    answers: { questionId: string; value: unknown }[];
  },
): Promise<PortalSavedResponse> => {
  const res = await httpClient.put(`/questionnaires/client/${token}/draft`, data);
  return res.data.data;
};

export const submitByToken = async (
  token: string,
  data: {
    currentSectionRef?: { source: string; id: string } | null;
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
    questionSource?: "system" | "firm";
    file: File;
  },
): Promise<unknown> => {
  const form = new FormData();
  form.append("file", data.file);
  form.append("responseId", data.responseId);
  form.append("questionId", data.questionId);
  if (data.questionSource) form.append("questionSource", data.questionSource);
  const res = await httpClient.post(
    `/questionnaires/client/${token}/files`,
    form,
  );
  return res.data.data;
};
