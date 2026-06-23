import {
  createTeam,
  type CreateTeamPayload,
} from "@/api/organization";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

export function useCreateTeam() {
  const { showError } = useFeedbackDialog();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTeamPayload) => createTeam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (error) => {
      showError({
        title: "Failed to create team",
        description: getErrorMessage(error, "Please try again later."),
      });
    },
  });
}
