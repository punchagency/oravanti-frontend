import { changePassword } from "@/api/auth";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { APIError } from "./types";

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      changePassword(input),
    onSuccess: () => {
      toast.success("Password updated");
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Failed to update password",
      );
    },
  });
}
