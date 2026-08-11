import { uploadClientAvatar } from "@/api/converted-clients";
import { useAuthStore } from "@/store/auth-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { APIError } from "./types";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB, matches backend multer limit

export function useUploadClientAvatar() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: (file: File) => {
      if (file.size > MAX_AVATAR_SIZE) {
        throw new Error(
          `Image is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum size is 5MB.`,
        );
      }
      return uploadClientAvatar(file);
    },
    onSuccess: () => {
      toast.success("Avatar uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["currentClient", userId] });
    },
    onError: (err: APIError & Error) => {
      toast.error(
        err.response?.data?.message || err.message || "Please try again.",
      );
    },
  });
}
