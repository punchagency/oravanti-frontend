import { getPracticeAreaTreeData } from "@/api/auth";
import { useQuery } from "@tanstack/react-query";

export function usePracticeAreaTreeData() {
  return useQuery({
    queryKey: ["practice-area-tree-data"],
    queryFn: getPracticeAreaTreeData,
    staleTime: Infinity,
  });
}
