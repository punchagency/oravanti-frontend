import { updateProfile } from "@/api/profile";
import { useAuthStore } from "@/store/auth-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { APIError } from "./types";

export function useUpdatePersonalDetails() {
  const qc = useQueryClient();
  const refetchSession = useAuthStore((s) => s.refetch);

  return useMutation({
    mutationFn: (input: Parameters<typeof updateProfile>[0]) =>
      updateProfile(input),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["profile"] });
      refetchSession();
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Failed to update profile",
      );
    },
  });
}
