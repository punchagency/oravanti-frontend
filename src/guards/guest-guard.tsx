// components/GuestGuard.tsx
import { useAuthRefresh } from "@/hooks/useAuthRefresh";
import { useAuthStore } from "@/store/auth-store";
import { Center, Spinner, Text, VStack } from "@chakra-ui/react";
import { Navigate, Outlet } from "react-router";

export function GuestGuard() {
  // Sync state with background data network
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

  // 2. If already logged in, redirect them away from Guest pages
  if (isAuthenticated && user) {
    let targetRoute = "/admin";

    // Route safely depending on their completion state
    switch (user.onboardingState) {
      case "email_verified":
        targetRoute = "/onboarding/step-1-domain";
        break;
      case "domain_verified":
        targetRoute = "/onboarding/step-2-profile";
        break;
      case "profile_completed":
        targetRoute = "/onboarding/step-3-firm-details";
        break;
      case "org_created":
        targetRoute = "/onboarding/step-4-tos";
        break;
      case "completed":
        targetRoute = "/admin";
        break;
    }

    return <Navigate to={targetRoute} replace />;
  }

  // 3. User is a genuine guest, let them see the public view
  return <Outlet />;
}
