import type { AuthSession, MemberRole, SessionUser } from "@/types/auth";
import { create } from "zustand";

type AuthState = {
  user: SessionUser | null;
  session: AuthSession | null;
  memberRole: MemberRole | null;
  /** Flattened `resource:action` grants — see `PermissionGrant` in `@/types/auth`. */
  grants: string[];
  firmTimezone: string | null;
  portalStatus: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refetch: () => void;
  needsAcceptInvitation: boolean;
  needsPasswordChange: boolean;
  twoFactorPending: boolean;
};

type AuthActions = {
  setAuth: (auth: AuthState) => void;
  clearAuth: () => void;
  setNeedsAcceptInvitation: (v: boolean) => void;
  setNeedsPasswordChange: (v: boolean) => void;
  setTwoFactorPending: (v: boolean) => void;
};

export const useAuthStore = create<AuthState & AuthActions>()((set) => ({
  user: null,
  session: null,
  memberRole: null,
  grants: [],
  firmTimezone: null,
  portalStatus: null,
  isAuthenticated: false,
  isLoading: true,
  refetch: () => {},
  needsAcceptInvitation: false,
  needsPasswordChange: false,
  twoFactorPending: false,
  setAuth: (auth) =>
    set({
      user: auth.user,
      session: auth.session,
      memberRole: auth.memberRole,
      grants: auth.grants,
      firmTimezone: auth.firmTimezone,
      portalStatus: auth.portalStatus,
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading,
      refetch: auth.refetch,
      needsAcceptInvitation: auth.needsAcceptInvitation,
      needsPasswordChange: auth.needsPasswordChange,
      twoFactorPending: false,
    }),
  clearAuth: () =>
    set({
      user: null,
      session: null,
      memberRole: null,
      grants: [],
      firmTimezone: null,
      portalStatus: null,
      isAuthenticated: false,
      isLoading: false,
      refetch: () => {},
      needsAcceptInvitation: false,
      needsPasswordChange: false,
      twoFactorPending: false,
    }),
  setNeedsAcceptInvitation: (v) => set({ needsAcceptInvitation: v }),
  setNeedsPasswordChange: (v) => set({ needsPasswordChange: v }),
  setTwoFactorPending: (v) => set({ twoFactorPending: v }),
}));
