import { resendInvitation } from "@/api/organization";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

export function useResendInvitation() {
  const { showSuccess, showError } = useFeedbackDialog();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) =>
      resendInvitation(email, role),
    onSuccess: () => {
      showSuccess({
        title: "Invitation resent",
        description: "The invitation has been resent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (error: Error) => {
      showError({
        title: "Failed to resend invitation",
        description: getErrorMessage(error, "Please try again later."),
      });
    },
  });
}
