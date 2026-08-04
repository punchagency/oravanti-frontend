import { getStaffs } from "@/api/staff";
import { useQuery } from "@tanstack/react-query";

export function useStaffs() {
  return useQuery({
    queryKey: ["staffs"],
    queryFn: getStaffs,
    staleTime: Infinity,
  });
}
