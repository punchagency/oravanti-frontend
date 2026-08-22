/* eslint-disable @typescript-eslint/no-explicit-any */
import { signOut } from "@/api/auth";
import { useAuthStore } from "@/store/auth-store";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

export const useSignOut = () => {
  const queryClient = useQueryClient();
  const { showError } = useFeedbackDialog();
  return useMutation({
    mutationFn: async () => {
      return await signOut();
    },
    onSuccess: async () => {
      useAuthStore.getState().clearAuth();
      queryClient.clear();
      window.location.replace("/login");
    },
    onError: (error: any) => {
      showError({
        title: "Sign out failed",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
};
