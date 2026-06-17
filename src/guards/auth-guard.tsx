import { useAuthRefresh } from "@/hooks/useAuthRefresh";
import { useSignOut } from "@/hooks/useSignOut";
import { useAuthStore } from "@/store/auth-store";
import { Box, Button, Center, Spinner, Text, VStack } from "@chakra-ui/react";
import { Navigate, Outlet, useLocation } from "react-router";

export function AuthGuard() {
  const location = useLocation();
  const { isLoading: queryLoading } = useAuthRefresh();
  const { user, isAuthenticated, isLoading: storeLoading } = useAuthStore();
  const { mutateAsync: logOut } = useSignOut();

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

  // if user is not an admin, show a page with the logout button
  if (!user.accountType || user.accountType !== "firm_admin") {
    return (
      <Box>
        <p>Dashboard not ready</p>
        <Button onClick={() => logOut()}>log out</Button>
      </Box>
    );
  }

  const isOnboarding = location.pathname.startsWith("/onboarding");
  const isAdmin = location.pathname.startsWith("/admin");

  if (user.onboardingState === "completed" && isOnboarding) {
    return <Navigate to="/admin" replace />;
  }

  if (user.onboardingState !== "completed" && isAdmin) {
    return <Navigate to="/onboarding/step-1-profile" replace />;
  }

  if (isOnboarding) {
    return <Outlet />;
  }

  return <Outlet />;
}
