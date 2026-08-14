import { useAuthRefresh } from "@/hooks/useAuthRefresh";
import { useAuthStore } from "@/store/auth-store";
import { Center, Spinner, Text, VStack } from "@chakra-ui/react";
import { Navigate, Outlet, useLocation } from "react-router";

export function AdminGuard() {
  const location = useLocation();
  const { isLoading: queryLoading } = useAuthRefresh();
  const {
    user,
    isAuthenticated,
    isLoading: storeLoading,
    needsAcceptInvitation,
    needsPasswordChange,
    portalStatus,
  } = useAuthStore();

  const isLoading = queryLoading || storeLoading;

  if (isLoading) {
    return (
      <Center h="100vh" bg="bg">
        <VStack gap="4">
          <Spinner size="xl" color="brand.solid" />
          <Text textStyle="sm" color="fg.muted">
            Verifying credentials...
          </Text>
        </VStack>
      </Center>
    );
  }

  // Not authenticated -> kick to central root login (firm.com/login)
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Client user should be on the client portal router; router selection by
  // accountType in AppRouter makes this unreachable, but guard defensively.
  if (user.accountType === "client") {
    return <Navigate to="/" replace />;
  }

  if (!user.emailVerified) {
    if (location.pathname !== "/verify-email") {
      return <Navigate to="/verify-email" replace />;
    }
    return <Outlet />;
  }

  if (needsAcceptInvitation && location.pathname !== "/accept-invitation") {
    return <Navigate to="/accept-invitation" replace />;
  }

  if (needsPasswordChange && location.pathname !== "/set-password") {
    if (location.pathname === "/accept-invitation") return <Outlet />;
    return <Navigate to="/set-password" replace />;
  }

  // ...and the inverse: nobody who already has a permanent password should be
  // able to deep-link to the temp-password form. The page used to enforce this
  // itself with a useEffect + navigate; it belongs here with the other path
  // rules, alongside the portal-access-disabled pair below.
  if (!needsPasswordChange && location.pathname === "/set-password") {
    return <Navigate to="/" replace />;
  }

  const isOnboarding = location.pathname.startsWith("/onboarding");
  const authPaths = ["/email-verified", "/verify-email", "/accept-invitation", "/set-password"];
  const isAdmin = !isOnboarding && !authPaths.includes(location.pathname);

  if (user.onboardingState === "completed" && isOnboarding) {
    return <Navigate to="/" replace />;
  }

  if (user.onboardingState !== "completed" && isAdmin) {
    return <Navigate to="/onboarding/step-0-source" replace />;
  }

  // Staff with disabled portal access can only see the portal-access-disabled
  // page (rendered inside the admin layout so the dashboard chrome stays).
  if (
    portalStatus === "disabled" &&
    location.pathname !== "/portal-access-disabled"
  ) {
    return <Navigate to="/portal-access-disabled" replace />;
  }

  if (
    portalStatus === "active" &&
    location.pathname === "/portal-access-disabled"
  ) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}