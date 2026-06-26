import {
  getTeamsList,
  type GetTeamsListParams,
  type TeamDTO,
  type TeamListDTO,
  type TeamCounts,
  type PaginationMeta,
} from "@/api/organization";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useQuery } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

export function useTeamsList(params?: GetTeamsListParams) {
  const { showError } = useFeedbackDialog();

  const query = useQuery({
    queryKey: ["teams", params],
    queryFn: () => getTeamsList(params),
    staleTime: Infinity,
  });

  if (query.isError) {
    showError({
      title: "Failed to load teams",
      description: getErrorMessage(query.error, "Please try again later."),
    });
  }

  return query;
}

export type { GetTeamsListParams, TeamListDTO, TeamDTO, TeamCounts, PaginationMeta };
