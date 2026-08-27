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

/**
 * Whether the client can pay for this agreement right now, and where.
 *
 * `pending` is a normal state, not an error: the invoice is raised by the
 * e-signature webhook, which is not synchronous with the signature, so the page
 * polls for a moment after signing.
 */
export type AgreementPaymentSession = {
  state: "ready" | "pending" | "settled" | "unavailable";
  /** Why payment is not on offer. Only set when state is "unavailable". */
  reason: string | null;
  /** Confido hosted checkout, to embed. Only set when state is "ready". */
  url: string | null;
  amountDueNow: number | null;
};

export async function getAgreementPaymentSession(token: string) {
  const res = await httpClient.post(
    `/agreement-signing/${token}/payment-session`,
  );
  return res.data.data as AgreementPaymentSession;
}
