import type { FeeAgreement } from "@/api/leads";

/**
 * Is the case still waiting on money?
 *
 * Reads the INVOICE when there is one, and only falls back to the legacy
 * `paymentReceivedAt` flag when there is not. That ordering matters and is the
 * same one the backend's `feeAgreementPaymentSatisfied` uses: once an invoice
 * exists it is authoritative, and the flag is an audit breadcrumb that nothing
 * gates on. Reading the flag first is what let the card claim "payment
 * received" beside an invoice that had never been paid.
 *
 * In its own module so the panel beside it stays a components-only file, which
 * is what Fast Refresh needs.
 */
export function awaitingFeePayment(agreement: FeeAgreement | null): boolean {
  if (!agreement) return false;
  if (agreement.invoice) return !agreement.invoice.satisfiesGate;

  // No invoice: either a pure contingency that bills nothing upfront, or an
  // agreement predating invoicing.
  if (agreement.details == null) return false;
  if (agreement.details.attorneyFee.type === "contingency") return false;
  return !agreement.details.paymentReceivedAt;
}
