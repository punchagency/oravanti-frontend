import { useQuery } from "@tanstack/react-query";
import { getStaff } from "@/api/staff";

export function useStaff() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: getStaff,
  });
}
