import type { AuthSession, SessionUser } from "@/types/auth";
import { create } from "zustand";

type AuthState = {
  user: SessionUser | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refetch: () => void;
};

type AuthActions = {
  setAuth: (auth: AuthState) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState & AuthActions>()((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  refetch: () => {},
  setAuth: (auth) =>
    set({
      user: auth.user,
      session: auth.session,
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading,
      refetch: auth.refetch,
    }),
  clearAuth: () =>
    set({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      refetch: () => {},
    }),
}));
