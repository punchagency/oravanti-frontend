import { addTeamMembers } from "@/api/organization";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

export function useAddTeamMembers() {
  const { showSuccess, showError } = useFeedbackDialog();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      staffIds,
    }: {
      teamId: string;
      staffIds: string[];
    }) => addTeamMembers(teamId, staffIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team", variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      showSuccess({ title: "Members added" });
    },
    onError: (error) => {
      showError({
        title: "Failed to add members",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
}
