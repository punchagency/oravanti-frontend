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
