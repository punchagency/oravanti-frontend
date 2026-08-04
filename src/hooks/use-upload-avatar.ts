import { uploadAvatar } from "@/api/organization";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";
import type { APIError } from "./types";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB, matches backend multer limit

export function useUploadAvatar() {
  const { showSuccess, showError } = useFeedbackDialog();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      if (file.size > MAX_AVATAR_SIZE) {
        throw new Error(
          `Image is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum size is 5MB.`,
        );
      }
      return uploadAvatar(file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentStaff"] });
      showSuccess({ title: "Avatar uploaded successfully" });
    },
    onError: (err: APIError & Error) => {
      showError({
        title: "Failed to upload avatar",
        description:
          err.response?.data?.message || err.message || "Please try again.",
      });
    },
  });
}
