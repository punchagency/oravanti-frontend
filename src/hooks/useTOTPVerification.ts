import { verifyTOTP } from "@/api/auth";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { APIError } from "./types";

export function useTOTPVerification(
  options: { onSuccess?: () => void } = {},
) {
  return useMutation({
    mutationFn: (data: { code: string }) => verifyTOTP(data),
    onSuccess: () => {
      toast.success("Two-factor authentication verified");
      options.onSuccess?.();
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ??
          "Unable to verify two-factor authentication code",
      );
    },
  });
}
