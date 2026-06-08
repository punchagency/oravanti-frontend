import { authClient } from "@/authClient";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

export function useCancelInvitation() {
  const { showSuccess, showError } = useFeedbackDialog();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await authClient.organization.cancelInvitation({
        invitationId,
      });

      if (error) {
        throw new Error(error.message || "Failed to cancel invitation");
      }
    },
    onSuccess: () => {
      showSuccess({
        title: "Invitation cancelled",
        description: "The invitation has been cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (error: Error) => {
      showError({
        title: "Failed to cancel invitation",
        description: getErrorMessage(error, "Please try again later."),
      });
    },
  });
}
