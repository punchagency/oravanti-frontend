import {
  updateClientProfile,
  type UpdateClientProfileInput,
} from "@/api/converted-clients";
import { useAuthStore } from "@/store/auth-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { APIError } from "./types";

export function useUpdateClientProfile() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: (input: UpdateClientProfileInput) =>
      updateClientProfile(input),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["currentClient", userId] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to update profile");
    },
  });
}
