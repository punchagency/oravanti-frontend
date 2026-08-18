import { API } from ".";

/**
 * The firm's payment-processor (Confido Legal) setup.
 *
 * Slice 1 connects a firm and tracks its underwriting. It takes no money, and
 * nothing on this screen should imply that it can.
 */

/**
 * What the tab renders from.
 *
 * `not_configured` means the deployment has no Confido credentials at all —
 * distinct from `not_started`, which means this firm has not begun. The first is
 * ours to fix, the second is theirs.
 */
export type PaymentAccountState =
  | "not_configured"
  | "not_started"
  | "provisioning"
  | "application_needed"
  | "application_in_progress"
  | "under_review"
  | "active"
  | "declined"
  | "suspended"
  | "inactive"
  | "token_unreadable"
  | "unknown";

export type PaymentAccount = {
  configured: boolean;
  state: PaymentAccountState;
  /** Confido's raw status, shown verbatim when we do not recognise it. */
  status: string | null;
  isAcceptingPayments: boolean;
  /** Last 6 characters — enough to quote to support, useless to anyone else. */
  confidoFirmIdMasked: string | null;
  onboardingMethod: string | null;
  bankAccounts: { trust: string | null; operating: string | null };
  brandingAppliedAt: string | null;
  statusCheckedAt: string | null;
};

export type OnboardingSession = {
  /** Where onboarding.js lives. Served by the backend so the frontend never
   *  has to know whether it is pointed at sandbox or production. */
  scriptUrl: string;
  token: string;
  expiresAt: string;
  /** Keeps the >25%-owner step on our domain rather than Confido's. */
  ownerInviteUrl: string;
  state: PaymentAccountState;
};

export async function getPaymentAccount(): Promise<PaymentAccount> {
  const { data } = await API.get<{ data: PaymentAccount }>("/settings/payments");
  return data.data;
}

/**
 * Starts (or resumes) onboarding.
 *
 * Also the 24-hour token refresh: onboarding.js reports its token expiring and
 * we call this again. Idempotent on the backend, so a second call resumes rather
 * than creating a second merchant account.
 */
export async function startOnboardingSession(): Promise<OnboardingSession> {
  const { data } = await API.post<{ data: OnboardingSession }>(
    "/settings/payments/onboarding-session",
  );
  return data.data;
}

export async function refreshPaymentAccount(): Promise<PaymentAccount> {
  const { data } = await API.post<{ data: PaymentAccount }>(
    "/settings/payments/refresh",
  );
  return data.data;
}

/**
 * Credit-card surcharging, mirrored from Confido rather than stored by us.
 *
 * Gated twice and both gates are theirs: Confido approves the firm (`allowed`),
 * and only then may the firm turn it on (`enabled`). Read live so the two
 * cannot drift.
 */
export type SurchargeSettings = {
  /** False means Confido has not approved this firm; the toggle is unavailable. */
  allowed: boolean;
  enabled: boolean;
  /** Fixed by Confido and not firm-editable. Displayed, never offered for edit. */
  rate: number | null;
};

export async function getSurchargeSettings(): Promise<SurchargeSettings> {
  const { data } = await API.get<{ data: SurchargeSettings }>(
    "/settings/payments/surcharge",
  );
  return data.data;
}

export async function setSurchargeEnabled(
  enabled: boolean,
): Promise<SurchargeSettings> {
  const { data } = await API.patch<{ data: SurchargeSettings }>(
    "/settings/payments/surcharge",
    { enabled },
  );
  return data.data;
}

/**
 * A month of processing, as Confido billed it.
 *
 * This is what makes the operating account reconcilable. Processing fees never
 * reach the invoice ledger — they are a firm expense, not a client payment — so
 * the debit lines here are the entry explaining why the bank balance is lower
 * than what was collected.
 */
export type ConfidoStatement = {
  id: string;
  /** `YYYY-MM`. */
  month: string;
  paymentVolume: number;
  /** Includes anything clients paid through surcharging. */
  totalFees: number;
  feesPaidByClients: number;
  /** What the firm actually bore. */
  netFees: number;
  /** Net fees over volume — the real cost of taking payments. */
  effectiveRate: number | null;
  debits: {
    amount: number;
    fromBankAccountCategory: string | null;
    fromBankAccountMask: string | null;
    statementDescriptor: string | null;
  }[];
};

export async function getConfidoStatements(): Promise<ConfidoStatement[]> {
  const { data } = await API.get<{ data: ConfidoStatement[] }>(
    "/settings/payments/statements",
  );
  return data.data;
}
