import { API } from ".";

/**
 * Firm-side document operations. The client-facing upload endpoint lives in
 * `document-requests.ts` — it is token-authenticated and must not carry the
 * admin session.
 */

export type DocumentCategory =
  | "application"
  | "supporting"
  | "identity"
  | "uscis_response";

export const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string }[] =
  [
    { value: "application", label: "Application" },
    { value: "supporting", label: "Supporting" },
    { value: "identity", label: "Identity" },
    { value: "uscis_response", label: "USCIS response" },
  ];

export type DocumentRequestStatus =
  | "PENDING"
  | "SUBMITTED"
  | "PARTIALLY_SUBMITTED"
  | "EXPIRED"
  | "CANCELLED";

export type DocumentRequest = {
  id: string;
  caseId: string | null;
  leadId: string | null;
  recipientName: string | null;
  recipientEmail: string;
  requestedLabel: string | null;
  message: string | null;
  status: DocumentRequestStatus;
  expiresAt: string;
  createdAt: string;
  submissionCount: number;
  requestedBy: { id: string; name: string | null } | null;
};

export type CreatedDocumentRequest = DocumentRequest & {
  /** Raw token link — returned once, so the firm can pass it on by hand. */
  uploadLink: string;
  /** False when the notification bounced; the request itself still stands. */
  emailSent: boolean;
};

export const uploadCaseDocument = async (data: {
  caseId: string;
  title: string;
  category?: DocumentCategory;
  file: File;
}): Promise<unknown> => {
  const form = new FormData();
  form.append("caseId", data.caseId);
  form.append("title", data.title);
  if (data.category) form.append("category", data.category);
  form.append("file", data.file);

  const res = await API.post("/documents", form);
  return res.data.data;
};

export const createDocumentRequest = async (data: {
  caseId?: string;
  leadId?: string;
  recipientEmail: string;
  recipientName?: string;
  requestedLabel: string;
  message?: string;
  expiresAt?: string;
}): Promise<CreatedDocumentRequest> => {
  const res = await API.post("/documents/requests", data);
  return res.data.data;
};

export const getDocumentRequests = async (
  filters: {
    caseId?: string;
    leadId?: string;
    status?: DocumentRequestStatus;
  } = {},
): Promise<DocumentRequest[]> => {
  const res = await API.get("/documents/requests", { params: filters });
  return res.data.data;
};

export const cancelDocumentRequest = async (
  requestId: string,
): Promise<DocumentRequest> => {
  const res = await API.patch(`/documents/requests/${requestId}/cancel`);
  return res.data.data;
};
