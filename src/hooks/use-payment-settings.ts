import {
  getPaymentAccount,
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
    staleTime: 30_000,
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
