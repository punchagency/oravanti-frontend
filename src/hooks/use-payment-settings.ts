import {
  getPaymentAccount,
  getConfidoStatements,
  getSurchargeSettings,
  setSurchargeEnabled,
  refreshPaymentAccount,
  startOnboardingSession,
} from "@/api/payment-settings";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { APIError } from "./types";

export const paymentSettingsKey = ["paymentSettings"] as const;

/**
 * The firm's payment account.
 *
 * Polls only while underwriting is in flight. Confido takes 2-3 business days
 * and the webhook is authoritative, so a background poll on a settled account
 * would be pure waste — but a firm sitting on this screen waiting for approval
 * should not have to reload to see it land.
 */
export function usePaymentAccount() {
  return useQuery({
    queryKey: paymentSettingsKey,
    queryFn: getPaymentAccount,
    refetchInterval: (query) => {
      const state = query.state.data?.state;
      return state === "under_review" || state === "provisioning"
        ? 30_000
        : false;
    },
  });
}

/**
 * Starts or resumes onboarding, and mints a fresh 24h token.
 *
 * Deliberately silent on success: it is called both when the admin clicks "set
 * up payments" and again in the background when the token is about to expire,
 * and a toast on the second would be baffling.
 */
export function useStartOnboardingSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: startOnboardingSession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentSettingsKey });
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Could not start payment setup",
      );
    },
  });
}

/** The manual path for when a webhook is missed. */
export function useRefreshPaymentAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: refreshPaymentAccount,
    onSuccess: (account) => {
      qc.setQueryData(paymentSettingsKey, account);
      toast.success("Payment account refreshed");
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Could not refresh payment account",
      );
    },
  });
}

export const surchargeKey = ["paymentSurcharge"] as const;

/**
 * Read live rather than cached, because both gates are Confido's: they approve
 * the firm, and the firm chooses. A stale copy could show a toggle to a firm
 * that is not approved, or hide one from a firm that just was.
 */
export function useSurchargeSettings(enabled: boolean) {
  return useQuery({
    queryKey: surchargeKey,
    queryFn: getSurchargeSettings,
    enabled,
  });
}

export function useSetSurcharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: setSurchargeEnabled,
    onSuccess: (settings) => {
      qc.setQueryData(surchargeKey, settings);
      toast.success(
        settings.enabled ? "Surcharging enabled" : "Surcharging disabled",
      );
    },
    onError: (err: APIError) => {
      // A 409 here means Confido has not approved the firm — worth surfacing
      // their wording, since the next step is contacting them, not us.
      toast.error(
        err.response?.data?.message ?? "Could not update surcharge settings",
      );
    },
  });
}

/** Monthly processing statements, for the Reports tab. */
export function useConfidoStatements() {
  return useQuery({
    queryKey: ["confidoStatements"],
    queryFn: getConfidoStatements,
    // A firm with no payment account has none, and that is not an error worth
    // retrying three times.
    retry: false,
  });
}
