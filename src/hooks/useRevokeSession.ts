import { revokeSession } from "@/api/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { APIError } from "./types";

export function useRevokeSession() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { token: string }) => revokeSession(data.token),
    onSuccess: () => {
      toast.success("Session revoked");
      qc.invalidateQueries({ queryKey: ["userSessions"] });
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Failed to revoke session",
      );
    },
  });
}
