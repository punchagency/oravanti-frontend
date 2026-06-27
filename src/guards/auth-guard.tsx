import { useAuthRefresh } from "@/hooks/useAuthRefresh";
import { useAuthStore } from "@/store/auth-store";
import { Center, Spinner, Text, VStack } from "@chakra-ui/react";
import { Navigate, Outlet, useLocation } from "react-router";

export function AuthGuard() {
  const location = useLocation();
  const { isLoading: queryLoading } = useAuthRefresh();
  const {
    user,
    isAuthenticated,
    isLoading: storeLoading,
    needsAcceptInvitation,
    needsPasswordChange,
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

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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

  // // if user is not an admin, show a page with the logout button
  // if (!user.accountType || user.accountType !== "firm_admin") {
  //   return (
  //     <Box>
  //       <p>Dashboard not ready</p>
  //       <Button onClick={() => logOut()}>log out</Button>
  //     </Box>
  //   );
  // }

  const isOnboarding = location.pathname.startsWith("/onboarding");
  const isAdmin = location.pathname.startsWith("/admin");

  if (user.onboardingState === "completed" && isOnboarding) {
    return <Navigate to="/admin" replace />;
  }

  if (user.onboardingState !== "completed" && isAdmin) {
    return <Navigate to="/onboarding/step-0-source" replace />;
  }

  if (isOnboarding) {
    return <Outlet />;
  }

  return <Outlet />;
}
