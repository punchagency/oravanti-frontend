import { Navigate } from "react-router";
import { isKnownProtectedPath } from "@/routers/known-paths";
import { NotFoundPage } from "@/pages/not-found";
import { useAuthStore } from "@/store/auth-store";

export function PublicCatchAll() {
  const { isAuthenticated, user } = useAuthStore();

  // Not signed in: real app routes (admin/client) need auth → login.
  if (!isAuthenticated || !user) {
    if (isKnownProtectedPath(window.location.pathname)) {
      return <Navigate to="/login" replace />;
    }
    return <NotFoundPage />;
  }

  // Signed in but still on the public router — should be unreachable
  // because AppRouter picks the router by accountType. Show a true 404.
  return <NotFoundPage />;
}
