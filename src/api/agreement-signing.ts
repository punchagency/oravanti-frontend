import { httpClient } from "@/services/http-client";

// Public (unauthenticated) — the client opens this from the emailed link.
export type AgreementSignSession = {
  signUrl: string;
  // Dropbox Sign API App client id; null when the stub provider is in use.
  clientId: string | null;
  // Unix seconds when the sign URL expires.
  expiresAt: number;
};

export async function getAgreementSignSession(token: string) {
  const res = await httpClient.post(`/agreement-signing/${token}/session`);
  return res.data.data as AgreementSignSession;
}
