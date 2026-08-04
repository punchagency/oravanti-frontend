import { httpClient } from "@/services/http-client";

export type DocumentRequestMatter = {
  type: "case" | "lead";
  /** Case number; null for a request raised against a lead. */
  reference: string | null;
  caseType: string | null;
  practiceArea: string | null;
  clientName: string | null;
};

export type PublicDocumentRequest = {
  status:
    | "PENDING"
    | "SUBMITTED"
    | "PARTIALLY_SUBMITTED"
    | "EXPIRED"
    | "CANCELLED";
  expiresAt: string;
  requestedLabel: string | null;
  message: string | null;
  recipientName: string | null;
  firmName: string | null;
  matter: DocumentRequestMatter;
};

/**
 * What the request is for, read with the token alone. Lets the page name the
 * matter before the client uploads — they may have more than one open with the
 * firm — and say up front when a link is spent.
 */
export const getDocumentRequestByToken = async (
  token: string,
): Promise<PublicDocumentRequest> => {
  const res = await httpClient.get(`/documents/requests/${token}`);
  return res.data.data;
};

/**
 * Submit a document against an external request token.
 *
 * Uses the plain `httpClient`: the recipient is a client, not a signed-in user,
 * so this must not carry credentials or trip the session-refresh interceptor.
 */
export const submitDocumentByToken = async (
  token: string,
  data: {
    file: File;
    uploadedByName: string;
    uploadedByEmail: string;
    title?: string;
  },
): Promise<unknown> => {
  const form = new FormData();
  form.append("file", data.file);
  form.append("uploadedByName", data.uploadedByName);
  form.append("uploadedByEmail", data.uploadedByEmail);
  if (data.title) form.append("title", data.title);

  const res = await httpClient.post(
    `/documents/requests/${token}/submissions`,
    form,
  );
  return res.data.data;
};
