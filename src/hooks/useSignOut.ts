/* eslint-disable @typescript-eslint/no-explicit-any */
import { signOut } from "@/api/auth";
import { useAuthStore } from "@/store/auth-store";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useFeedbackDialog } from "./useFeedbackDialog";

export const useSignOut = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useFeedbackDialog();
  return useMutation({
    mutationFn: async () => {
      return await signOut();
    },
    onSuccess: async () => {
      showSuccess({
        title: "Sign out successful",
        description: "You have been signed out successfully.",
      });
      useAuthStore.getState().clearAuth();
      queryClient.clear();
      navigate("/login", { replace: true });
    },
    onError: (error: any) => {
      showError({
        title: "Sign out failed",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
};
