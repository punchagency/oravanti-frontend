import { updateTeam, type UpdateTeamPayload } from "@/api/organization";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

export function useUpdateTeam() {
  const { showSuccess, showError } = useFeedbackDialog();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      data,
    }: {
      teamId: string;
      data: UpdateTeamPayload;
    }) => updateTeam(teamId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team", variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      showSuccess({ title: "Team updated" });
    },
    onError: (error) => {
      showError({
        title: "Failed to update team",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
}
