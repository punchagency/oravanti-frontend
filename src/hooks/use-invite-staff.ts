import { inviteStaff, type InviteStaffPayload } from "@/api/organization";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

export function useInviteStaff() {
  const { showSuccess, showError } = useFeedbackDialog();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteStaffPayload) => inviteStaff(data),
    onSuccess: (_data, variables) => {
      showSuccess({
        title: "Invitation sent",
        description: `${variables.firstName} ${variables.lastName} has been invited to join your organization.`,
      });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (error) => {
      showError({
        title: "Failed to send invitation",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
}
