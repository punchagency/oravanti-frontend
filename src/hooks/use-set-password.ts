import { setPassword } from "@/api/organization";
import { useAuthStore } from "@/store/auth-store";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

/**
 * Hook to handle setting a new password for users who were invited
 * with a temporary password and need to set a permanent one.
 *
 * On success it hands off to the app root with `window.location.replace`,
 * the same way `useSignInWithEmail`, `useSignOut` and the two-factor page
 * do. The full reload is the point: the backend re-issues the session on
 * the new credentials, and `AppRouter` picks its router by account type at
 * mount, so a fresh boot is what guarantees the right router and a clean
 * query cache. `replace` keeps /set-password out of the back stack.
 */
export function useSetPassword() {
  const { showError } = useFeedbackDialog();

  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      setPassword(data),
    onSuccess: () => {
      useAuthStore.getState().setNeedsPasswordChange(false);
      window.location.replace("/");
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
