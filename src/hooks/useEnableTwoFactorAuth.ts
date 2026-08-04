import { enableTwoFactorAuth } from "@/api/auth";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { APIError } from "./types";

export function useEnableTwoFactorAuth() {
  return useMutation({
    mutationFn: (data: { password: string }) => enableTwoFactorAuth(data),
    onSuccess: () => {
      // Don't show toast here — the QR code flow handles success feedback
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Failed to enable two-factor authentication",
      );
    },
  });
}
