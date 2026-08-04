import { verifyTwoFactorSetup } from "@/api/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { APIError } from "./types";

export function useVerifyQRCode() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { token: string }) => verifyTwoFactorSetup(data),
    onSuccess: () => {
      toast.success("Two-factor authentication enabled");
      qc.invalidateQueries({ queryKey: ["session"] });
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Invalid code. Please try again.",
      );
    },
  });
}
