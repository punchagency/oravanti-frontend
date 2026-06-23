import { deleteTeam } from "@/api/organization";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

export function useDeleteTeam() {
  const { showSuccess, showError } = useFeedbackDialog();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamId: string) => deleteTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      showSuccess({ title: "Team deleted" });
    },
    onError: (error) => {
      showError({
        title: "Failed to delete team",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
}
