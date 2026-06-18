import { useQuery } from "@tanstack/react-query";
import { getCases, type GetCasesParams } from "@/api/cases";

export function useCases(params?: GetCasesParams) {
  return useQuery({
    queryKey: ["cases", params ?? {}],
    queryFn: () => getCases(params),
  });
}
