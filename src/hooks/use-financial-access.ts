import {
  getFinancialAccess,
  updateFinancialAccess,
  type FinancialAccessControlInput,
} from "@/api/financial-access";
import type { APIError } from "@/hooks/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const financialAccessKey = ["financialAccess"];

export function useFinancialAccess() {
  return useQuery({
    queryKey: financialAccessKey,
    queryFn: getFinancialAccess,
    staleTime: 60_000,
  });
}

export function useSetFinancialAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (controls: FinancialAccessControlInput[]) =>
      updateFinancialAccess(controls),
    // Refetched rather than patched into the cache: the response is a message,
    // not the new matrix, and `viewer.trust` may have just changed under the
    // person who saved it.
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: financialAccessKey });
      toast.success("Financial access updated");
    },
    onError: (err: APIError) =>
      toast.error(
        err.response?.data?.message ?? "Could not update financial access",
      ),
  });
}
