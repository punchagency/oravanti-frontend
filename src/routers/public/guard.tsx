import { useAuthRefresh } from "@/hooks/useAuthRefresh";
import { useAuthStore } from "@/store/auth-store";
import { Center, Spinner, Text, VStack } from "@chakra-ui/react";
import { Navigate, Outlet } from "react-router";

export function GuestGuard() {
  const { isLoading: queryLoading } = useAuthRefresh();
  const { user, isAuthenticated, isLoading: storeLoading } = useAuthStore();

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

  if (isAuthenticated && user) {
    // Authenticated user hitting a public route -> send to their portal root.
    // Router selection by accountType in AppRouter picks the right router.
    const targetPath =
      user.onboardingState === "completed" ? "/" : "/onboarding/step-0-source";

    return <Navigate to={targetPath} replace />;
  }

  return <Outlet />;
}
