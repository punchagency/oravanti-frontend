/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useAuthRefresh.ts
import { getSession } from "@/api/auth";
import { getNeedsSetup, type NeedsSetupResponse } from "@/api/organization";
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
        const res = await getSession();

        const sessionData = res.data as {
          user: SessionUser;
          session: AuthSession;
          memberRole?: MemberRole | null;
          firmTimezone?: string | null;
          portalStatus?: string | null;
        };

        let needsSetup: NeedsSetupResponse | null = null;
        if (sessionData.user?.accountType === "staff") {
          needsSetup = await getNeedsSetup().catch(() => null);
        }

        const state = useAuthStore.getState();
        setAuth({
          user: sessionData.user,
          session: sessionData.session,
          memberRole: sessionData.memberRole ?? null,
          firmTimezone: sessionData.firmTimezone ?? null,
          portalStatus: sessionData.portalStatus ?? null,
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
          twoFactorPending: false,
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
