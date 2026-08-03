import { updateMyProfile, type UpdateMyProfileInput } from "@/api/organization";
import { useAuthStore } from "@/store/auth-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { APIError } from "./types";

export function useUpdateMyProfile() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const refetchSession = useAuthStore((s) => s.refetch);

  return useMutation({
    mutationFn: (input: UpdateMyProfileInput) => updateMyProfile(input),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["currentStaff", userId] });
      refetchSession();
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to update profile");
    },
  });
}
