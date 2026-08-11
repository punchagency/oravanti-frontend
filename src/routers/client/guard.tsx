import { useAuthRefresh } from "@/hooks/useAuthRefresh";
import { useAuthStore } from "@/store/auth-store";
import { Center, Spinner, Text, VStack } from "@chakra-ui/react";
import { Navigate, Outlet, useLocation } from "react-router";

export function ClientGuard() {
  const location = useLocation();
  const { isLoading: queryLoading } = useAuthRefresh();
  const {
    user,
    isAuthenticated,
    isLoading: storeLoading,
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

  // Not authenticated -> kick to central root login (firm.com/login)
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Staff/Admin should be on the admin router; router selection by accountType
  // in AppRouter makes this unreachable, but guard defensively.
  if (user.accountType !== "client") {
    return <Navigate to="/" replace />;
  }

  if (!user.emailVerified) {
    if (location.pathname !== "/verify-email") {
      return <Navigate to="/verify-email" replace />;
    }
    return <Outlet />;
  }

  if (needsPasswordChange && location.pathname !== "/set-password") {
    return <Navigate to="/set-password" replace />;
  }

  return <Outlet />;
}