import { setPassword } from "@/api/organization";
import { useAuthStore } from "@/store/auth-store";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

/**
 * Hook to handle setting a new password for users who were invited
 * with a temporary password and need to set a permanent one.
 *
 * After a successful password change:
 * 1. Clears the `needsPasswordChange` flag in the auth store so the
 *    auth guard no longer forces the user to the /set-password page.
 * 2. Invalidates the session query so the backend can re-issue a
 *    session token tied to the new credentials.
 * 3. Redirects to the login page on the main domain (e.g. /login) using
 *    AppRouter's redirectPath so the router is re-selected by account type
 *    on the next render without a full page reload.
 */
export function useSetPassword() {
  const queryClient = useQueryClient();
  const { showError } = useFeedbackDialog();

  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      setPassword(data),
    onSuccess: () => {
      useAuthStore.getState().setNeedsPasswordChange(false);
      queryClient.invalidateQueries({ queryKey: ["session"] });
      useAuthStore.getState().setRedirectPath("/login");
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
