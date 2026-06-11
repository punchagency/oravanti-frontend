/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useAuthRefresh.ts
import { getSession } from "@/api/auth";
import { useAuthStore } from "@/store/auth-store";
import type { AuthSession, SessionUser } from "@/types/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useAuthRefresh() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        const res = await getSession();

        const sessionData = res.data as {
          user: SessionUser;
          session: AuthSession;
        };

        setAuth({
          user: sessionData.user,
          session: sessionData.session,
          isAuthenticated: !!sessionData.user,
          isLoading: false,
          refetch: () => queryClient.refetchQueries({ queryKey: ["session"] }),
        });

        return sessionData;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error: any) {
        clearAuth();
        return null;
      }
    },
    staleTime: 30_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
