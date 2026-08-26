import { useQuery } from "@tanstack/react-query";
import {
  getCases,
  getCaseById,
  type GetCasesParams,
  type PaginationMeta,
} from "@/api/cases";

/**
 * The list and the detail sit under *different* roots — `["cases"]` and
 * `["case", id]` — which is easy to miss and impossible to see going wrong:
 * `invalidateQueries(["cases", id])` throws no error, matches nothing, and
 * leaves the detail stale until a hard refresh. Both writers had that bug.
 * Invalidate through these rather than by hand.
 */
export const caseKeys = {
  all: ["cases"] as const,
  detail: (id: string) => ["case", id] as const,
};

export function useCases(params: GetCasesParams = {}) {
  const {
    search, status, assigneeId, clientId, practiceAreaId,
    practiceAreaName, caseTypeName, subcategoryName, assigneeName,
    page, limit,
  } = params;
  return useQuery({
    queryKey: [
      ...caseKeys.all,
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
    queryKey: caseKeys.detail(id),
    queryFn: () => getCaseById(id),
    enabled: Boolean(id),
    staleTime: Infinity,
  });
}

export type { GetCasesParams, PaginationMeta };
