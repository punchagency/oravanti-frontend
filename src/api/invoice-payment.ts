import { httpClient } from "@/services/http-client";

/**
 * Public (unauthenticated) — the client opens this from the link in their
 * invoice email. The token in the path is the credential, so this uses the
 * plain `httpClient` rather than the session-bearing `API` instance.
 */

export type PayableInvoice = {
  invoiceId: string;
  organizationId: string;
  invoiceNumber: string;
  payerName: string;
  payerEmail: string | null;
  total: number;
  amountPaid: number;
  balanceDue: number;
  dueDate: string;
  status: string;
  /**
   * True once nothing is owed.
   *
   * The page polls this while a card is processing, so the backend returns it
   * rather than erroring the moment the balance clears — erroring would flip the
   * page into "link unavailable" at exactly the instant of success.
   */
  settled: boolean;
  /**
   * False while this FIRM cannot take money — either the platform has no
   * processor configured, or this firm has not finished underwriting. Per
   * organization, not per deployment.
   */
  paymentsEnabled: boolean;
};

export async function getPayableInvoice(
  token: string,
): Promise<PayableInvoice> {
  const { data } = await httpClient.get<{ data: PayableInvoice }>(
    `/invoice-payment/${token}`,
  );
  return data.data;
}

/**
 * Get the hosted payment URL for this invoice.
 *
 * Idempotent on the backend — the link is created once and found thereafter —
 * so calling it again on a re-render does not mint a second one.
 */
export async function startInvoiceCheckout(
  token: string,
): Promise<{ url: string; reference: string }> {
  const { data } = await httpClient.post<{
    data: { url: string; reference: string };
  }>(`/invoice-payment/${token}/checkout`);
  return data.data;
}
