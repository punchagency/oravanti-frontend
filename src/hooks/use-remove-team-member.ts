import { removeTeamMember } from "@/api/organization";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

export function useRemoveTeamMember() {
  const { showSuccess, showError } = useFeedbackDialog();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      memberId,
    }: {
      teamId: string;
      memberId: string;
    }) => removeTeamMember(teamId, memberId),
    onSuccess: (_data, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      showSuccess({ title: "Member removed from team" });
    },
    onError: (error) => {
      showError({
        title: "Failed to remove member",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
}
