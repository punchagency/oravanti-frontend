import { Center, Spinner, Text, VStack } from "@chakra-ui/react";
import { Navigate, Outlet } from "react-router";

import { useAuthRefresh } from "@/hooks/useAuthRefresh";
import { useAuthStore } from "@/store/auth-store";

/**
 * Keeps everyone but Oravanti's own staff out of the CRM.
 *
 * Defensive, exactly like `AdminGuard`: `AppRouter` already picks this router
 * by account type, so a firm user reaching here should be unreachable. Both
 * checks exist because "unreachable" is a property of today's `AppRouter`, and
 * neither is the real gate — `requirePlatformAdmin` on the server is, and it
 * is checked on every request regardless of what the browser believes.
 *
 * Deliberately much shorter than `AdminGuard`. Email verification, invitation
 * acceptance, forced password change, onboarding completion and portal status
 * are all concepts belonging to a firm's staff joining a firm. An operator is
 * created from the CLI with none of them pending, so branching on them here
 * would be dead code that reads like policy.
 */
export function PlatformGuard() {
  const { isLoading: queryLoading } = useAuthRefresh();
  const { user, isAuthenticated, isLoading: storeLoading } = useAuthStore();

  if (queryLoading || storeLoading) {
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

  if (user.accountType !== "platform_admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
