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

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.accountType !== "client") {
    return <Navigate to="/" replace />;
  }

  if (portalStatus === "disabled" && location.pathname !== "/portal-access-disabled") {
    return <Navigate to="/portal-access-disabled" replace />;
  }

  if (portalStatus === "active" && location.pathname === "/portal-access-disabled") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
