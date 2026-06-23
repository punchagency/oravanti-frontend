/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useAuthRefresh.ts
import { getSession } from "@/api/auth";
import { getNeedsSetup } from "@/api/organization";
import { useAuthStore } from "@/store/auth-store";
import type { AuthSession, MemberRole, SessionUser } from "@/types/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useAuthRefresh() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        const [res, needsSetup] = await Promise.all([
          getSession(),
          getNeedsSetup().catch(() => null),
        ]);

        const sessionData = res.data as {
          user: SessionUser;
          session: AuthSession;
          memberRole?: MemberRole | null;
        };

        const state = useAuthStore.getState();
        setAuth({
          user: sessionData.user,
          session: sessionData.session,
          memberRole: sessionData.memberRole ?? null,
          isAuthenticated: !!sessionData.user,
          isLoading: false,
          refetch: () => queryClient.refetchQueries({ queryKey: ["session"] }),
          needsAcceptInvitation:
            needsSetup !== null
              ? needsSetup.needsAcceptInvitation
              : state.needsAcceptInvitation,
          needsPasswordChange:
            needsSetup !== null
              ? needsSetup.needsPasswordChange
              : state.needsPasswordChange,
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
