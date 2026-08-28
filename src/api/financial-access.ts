import { API } from ".";

/**
 * Who at the firm may see and touch trust (IOLTA) money.
 *
 * Trust is deny-by-default — money the firm merely holds is the money a firm
 * gets disbarred for mishandling — so this matrix is what stands between an
 * unconfigured firm and nobody being able to touch client funds at all.
 *
 * Operating access is stored alongside it but is NOT enforced anywhere in the
 * backend today, which is why the settings page does not offer it: a control
 * that silently changes nothing is worse than one that is absent.
 */

/** The coarse visibility tiers the matrix is keyed on. */
export type FinanceRole =
  | "admin"
  | "attorney"
  | "paralegal"
  | "legal_assistant"
  | "receptionist"
  | "client";

/**
 * `permission_level` is broader than this, but only three values change what a
 * caller can do — the rest collapse to `no_access` in `toAccountLevel`.
 */
export type AccessLevel = "full_access" | "view_only" | "no_access";

export type FinancialAccess = {
  /** accountType -> role -> permission. Absent keys mean the firm has no row. */
  controls: Record<string, Record<string, string>>;
  /**
   * Where the CALLER sits in the matrix.
   *
   * Resolved server-side rather than derived here: the member-role vs
   * staff-role rule behind it lives in one place on purpose, and has already
   * shipped wrong once when it was duplicated.
   */
  viewer: { financeRole: string | null; trust: AccessLevel };
};

export type FinancialAccessControlInput = {
  accountType: "operating" | "trust_iolta";
  role: FinanceRole;
  permission: AccessLevel;
};

export async function getFinancialAccess() {
  return (await API.get("/settings/financial-access")).data
    .data as FinancialAccess;
}

export async function updateFinancialAccess(
  controls: FinancialAccessControlInput[],
) {
  return (await API.patch("/settings/financial-access", { controls })).data
    .data as { message?: string };
}
