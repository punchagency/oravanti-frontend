import type { FeeAgreement } from "@/api/leads";

/**
 * The stage tracker and status pill for a fee agreement.
 *
 * Shared because the fee-agreement card is rendered in two places — the
 * consultation stage page and the collapsible card list — which had already
 * drifted: one computed an active index of 5 against a five-element array, so
 * an opened case lit no node at all. Counter-signing adds a second signature
 * step and an order that can be either way round, and three copies of that
 * arithmetic would drift again within the week.
 */

export type FeeStageTone = "success" | "warning" | "neutral" | "gold";

export type FeeAgreementView = {
  labels: readonly string[];
  activeIndex: number;
  status: { label: string; tone: FeeStageTone };
};

const SINGLE_SIGNER_STAGES = [
  "Generate",
  "Send",
  "Awaiting signature",
  "Receive",
  "Case opened",
] as const;

export function feeAgreementView(
  agreement: FeeAgreement | null | undefined,
  caseOpened: boolean,
  /**
   * Whether the money has landed, on the hosts that track it. The stage page
   * distinguishes "signed" from "signed and paid"; the card list does not, and
   * passing nothing keeps its simpler reading.
   */
  paymentSettled?: boolean,
): FeeAgreementView {
  const settled = agreement?.status === "signed" && paymentSettled === true;
  // `firmSigner` null is the whole test for "this agreement has one signer".
  // It covers a firm that does not counter-sign and an agreement that was
  // already out for signature before counter-signing existed, and neither can
  // be told apart from the other here — nor needs to be.
  if (!agreement?.firmSigner) {
    return {
      labels: SINGLE_SIGNER_STAGES,
      activeIndex: caseOpened
        ? 4
        : agreement?.status === "signed"
          ? 3
          : agreement?.status === "pending_signature"
            ? 2
            : agreement?.status === "draft"
              ? 1
              : 0,
      status: caseOpened
        ? { label: "Signed & received", tone: "success" }
        : settled
          ? { label: "Payment received", tone: "success" }
          : agreement?.status === "signed"
            ? { label: "Signed", tone: "success" }
          : agreement?.status === "pending_signature"
            ? { label: "Sent", tone: "warning" }
            : agreement?.status === "draft"
              ? { label: "Generated", tone: "gold" }
              : { label: "Not started", tone: "neutral" },
    };
  }

  const firmFirst = agreement.signingOrder === "firm_first";
  const labels = [
    "Generate",
    "Send",
    firmFirst ? "Firm signature" : "Client signature",
    firmFirst ? "Client signature" : "Firm signature",
    "Case opened",
  ] as const;

  // Whose signature the flow is on now, derived from the two timestamps rather
  // than from status — `pending_signature` covers both halves.
  const firstSigned = firmFirst
    ? Boolean(agreement.firmSignedAt)
    : Boolean(agreement.clientSignedAt);

  if (caseOpened) {
    return {
      labels,
      activeIndex: 4,
      status: { label: "Signed & received", tone: "success" },
    };
  }
  if (agreement.status === "signed") {
    return {
      labels,
      activeIndex: 4,
      status: settled
        ? { label: "Payment received", tone: "success" }
        : { label: "Fully executed", tone: "success" },
    };
  }
  if (agreement.status === "pending_signature") {
    return {
      labels,
      activeIndex: firstSigned ? 3 : 2,
      status: firstSigned
        ? {
            label: firmFirst
              ? "Awaiting client signature"
              : "Awaiting firm signature",
            tone: "gold",
          }
        : {
            label: firmFirst ? "Awaiting firm signature" : "Sent",
            tone: "warning",
          },
    };
  }
  return {
    labels,
    activeIndex: agreement.status === "draft" ? 1 : 0,
    status:
      agreement.status === "draft"
        ? { label: "Generated", tone: "gold" }
        : { label: "Not started", tone: "neutral" },
  };
}

/** Prose for the card body while an agreement is out for signature. */
export function pendingSignatureSummary(agreement: FeeAgreement): string {
  if (!agreement.firmSigner) {
    return "Signing link sent — awaiting client signature.";
  }
  const signer = agreement.firmSigner.name;
  if (agreement.signingOrder === "firm_first") {
    return agreement.firmSignedAt
      ? `${signer} has signed — the client has been emailed a link to sign.`
      : `Awaiting ${signer}'s signature. The client is emailed once the firm has signed.`;
  }
  return agreement.clientSignedAt
    ? `The client has signed. ${signer} must counter-sign to execute the agreement${
        agreement.invoiceWaitsForFirmSignature === false
          ? "."
          : ", and the invoice goes out once they have."
      }`
    : `Signing link sent — awaiting client signature. ${signer} counter-signs afterwards.`;
}
