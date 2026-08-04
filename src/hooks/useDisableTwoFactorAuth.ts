import { disableTwoFactorAuth } from "@/api/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { APIError } from "./types";

export function useDisableTwoFactorAuth() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { password: string }) => disableTwoFactorAuth(data),
    onSuccess: () => {
      toast.success("Two-factor authentication disabled");
      qc.invalidateQueries({ queryKey: ["session"] });
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Failed to disable two-factor authentication",
      );
    },
  });
}
