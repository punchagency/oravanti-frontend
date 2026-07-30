import { getStaff } from "@/api/staff";
import { useQuery } from "@tanstack/react-query";

export function useStaff() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: getStaff,
    staleTime: Infinity,
  });
}
