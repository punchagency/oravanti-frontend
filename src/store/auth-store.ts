import type { AuthSession, SessionUser } from "@/types/auth";
import { create } from "zustand";

type AuthState = {
  user: SessionUser | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  organizationId: string | null;
  refetch: () => void;
};

type AuthActions = {
  setAuth: (auth: AuthState) => void;
  clearAuth: () => void;
  setOrganizationId: (id: string) => void;
};

export const useAuthStore = create<AuthState & AuthActions>()((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  organizationId: null,
  refetch: () => {},
  setAuth: (auth) =>
    set({
      user: auth.user,
      session: auth.session,
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading,
      organizationId: auth.organizationId ?? auth.session?.activeOrganizationId ?? null,
      refetch: auth.refetch,
    }),
  clearAuth: () =>
    set({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      organizationId: null,
      refetch: () => {},
    }),
  setOrganizationId: (id: string) => set({ organizationId: id }),
}));
