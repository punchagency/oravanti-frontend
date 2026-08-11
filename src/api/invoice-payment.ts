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
   * False while no payment provider is configured — which is every environment
   * today. The page says so plainly rather than offering a button that cannot
   * work.
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

export async function startInvoiceCheckout(
  token: string,
): Promise<{ url: string; reference: string }> {
  const { data } = await httpClient.post<{
    data: { url: string; reference: string };
  }>(`/invoice-payment/${token}/checkout`);
  return data.data;
}
