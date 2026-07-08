import { useQuery } from "@tanstack/react-query";
import {
  getCases,
  getCaseById,
  type GetCasesParams,
  type PaginationMeta,
} from "@/api/cases";

export function useCases(params: GetCasesParams = {}) {
  const {
    search, status, assigneeId, clientId, practiceAreaId,
    practiceAreaName, caseTypeName, subcategoryName, assigneeName,
    page, limit,
  } = params;
  return useQuery({
    queryKey: [
      "cases",
      search, status, assigneeId, clientId, practiceAreaId,
      practiceAreaName, caseTypeName, subcategoryName, assigneeName,
      page, limit,
    ],
    queryFn: () => getCases(params),
    staleTime: Infinity,
  });
}

export function useCaseById(id: string) {
  return useQuery({
    queryKey: ["case", id],
    queryFn: () => getCaseById(id),
    enabled: Boolean(id),
    staleTime: Infinity,
  });
}

export type { GetCasesParams, PaginationMeta };
