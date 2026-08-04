import {
  getCurrentStaffProfile,
  type StaffDetailsDTO,
} from "@/api/organization";
import { useAuthStore } from "@/store/auth-store";
import { useQuery } from "@tanstack/react-query";

export function useCurrentStaff() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ["currentStaff", userId],
    queryFn: () => getCurrentStaffProfile(),
    enabled: !!userId,
    staleTime: Infinity,
  });
}

export type { StaffDetailsDTO };
