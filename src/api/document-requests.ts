import { httpClient } from "@/services/http-client";

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
