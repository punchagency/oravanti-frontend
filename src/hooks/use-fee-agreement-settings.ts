import {
  getEligibleSigners,
  getFeeAgreementSettings,
  updateFeeAgreementSettings,
  type FeeAgreementSettings,
} from "@/api/fee-agreement-settings";
import type { APIError } from "@/hooks/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const settingsKey = ["fee-agreement-settings"] as const;
const signersKey = ["fee-agreement-settings", "eligible-signers"] as const;

export function useFeeAgreementSettings(enabled = true) {
  return useQuery({
    queryKey: settingsKey,
    queryFn: getFeeAgreementSettings,
    enabled,
    staleTime: 60_000,
  });
}

/**
 * The staff who may sign for the firm. Server-resolved from permission grants
 * rather than filtered here off `staff.role`, which is a display projection and
 * cannot see a firm's custom roles or role-group inheritance.
 */
export function useEligibleSigners(enabled = true) {
  return useQuery({
    queryKey: signersKey,
    queryFn: getEligibleSigners,
    enabled,
    staleTime: 60_000,
  });
}

export function useUpdateFeeAgreementSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateFeeAgreementSettings,
    onSuccess: (settings: FeeAgreementSettings) => {
      qc.setQueryData(settingsKey, settings);
      toast.success("Signing policy updated");
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Could not update the signing policy",
      );
    },
  });
}
