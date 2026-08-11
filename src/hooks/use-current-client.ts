import {
  getClientProfile,
  type ClientProfile,
} from "@/api/converted-clients";
import { useAuthStore } from "@/store/auth-store";
import { useQuery } from "@tanstack/react-query";

export function useCurrentClient() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ["currentClient", userId],
    queryFn: () => getClientProfile(),
    enabled: !!userId,
    staleTime: Infinity,
  });
}

export type { ClientProfile };
