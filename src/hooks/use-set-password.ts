import { setPassword } from "@/api/organization";
import { useAuthStore } from "@/store/auth-store";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useFeedbackDialog } from "./useFeedbackDialog";

export function useSetPassword() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useFeedbackDialog();

  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      setPassword(data),
    onSuccess: () => {
      useAuthStore.getState().setNeedsPasswordChange(false);
      queryClient.invalidateQueries({ queryKey: ["session"] });
      navigate("/admin", { replace: true });
      showSuccess({
        title: "Password set successfully",
        description: "You can now use your new password to log in.",
      });
    },
    onError: (err) => {
      showError({
        title: "Failed to set password",
        description: getErrorMessage(
          err,
          "An error occurred while setting your password.",
        ),
      });
    },
  });
}
