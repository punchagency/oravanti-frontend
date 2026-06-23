import type { AuthSession, MemberRole, SessionUser } from "@/types/auth";
import { create } from "zustand";

type AuthState = {
  user: SessionUser | null;
  session: AuthSession | null;
  memberRole: MemberRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refetch: () => void;
  needsAcceptInvitation: boolean;
  needsPasswordChange: boolean;
};

type AuthActions = {
  setAuth: (auth: AuthState) => void;
  clearAuth: () => void;
  setNeedsAcceptInvitation: (v: boolean) => void;
  setNeedsPasswordChange: (v: boolean) => void;
};

export const useAuthStore = create<AuthState & AuthActions>()((set) => ({
  user: null,
  session: null,
  memberRole: null,
  isAuthenticated: false,
  isLoading: true,
  refetch: () => {},
  needsAcceptInvitation: false,
  needsPasswordChange: false,
  setAuth: (auth) =>
    set({
      user: auth.user,
      session: auth.session,
      memberRole: auth.memberRole,
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading,
      refetch: auth.refetch,
      needsAcceptInvitation: auth.needsAcceptInvitation,
      needsPasswordChange: auth.needsPasswordChange,
    }),
  clearAuth: () =>
    set({
      user: null,
      session: null,
      memberRole: null,
      isAuthenticated: false,
      isLoading: false,
      refetch: () => {},
      needsAcceptInvitation: false,
      needsPasswordChange: false,
    }),
  setNeedsAcceptInvitation: (v) => set({ needsAcceptInvitation: v }),
  setNeedsPasswordChange: (v) => set({ needsPasswordChange: v }),
}));
