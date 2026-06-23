import { getTeamDetails, type TeamDTO } from "@/api/organization";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useQuery } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

export function useTeamDetails(teamId: string | null) {
  const { showError } = useFeedbackDialog();

  const query = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => getTeamDetails(teamId!),
    enabled: !!teamId,
    staleTime: Infinity,
  });

  if (query.isError) {
    showError({
      title: "Failed to load team details",
      description: getErrorMessage(query.error, "Please try again later."),
    });
  }

  return query;
}

export type { TeamDTO };
