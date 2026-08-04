import { verifyBackupCode } from "@/api/auth";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { APIError } from "./types";

export function useBackupCodeVerification(
  options: { onSuccess?: () => void } = {},
) {
  return useMutation({
    mutationFn: (data: { code: string }) => verifyBackupCode(data),
    onSuccess: () => {
      toast.success("Backup code verified");
      options.onSuccess?.();
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Unable to verify backup code",
      );
    },
  });
}
