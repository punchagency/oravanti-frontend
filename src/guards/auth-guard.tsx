// components/AuthGuard.tsx
import { useAuthRefresh } from "@/hooks/useAuthRefresh";
import { useAuthStore } from "@/store/auth-store";
import { Center, Spinner, Text, VStack } from "@chakra-ui/react";
import { Navigate, Outlet, useLocation } from "react-router";

export function AuthGuard() {
  const location = useLocation();
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

  // Bounce completely out if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Email validation checkpoint
  if (!user.emailVerified) {
    if (location.pathname !== "/verify-email") {
      return <Navigate to="/verify-email" replace />;
    }
    return <Outlet />;
  }

  // Map onboarding states to step numbers (1-based)
  const stateStep: Record<string, number> = {
    email_verified: 1,
    domain_verified: 2,
    completed: 5,
  };

  const stepPath: Record<number, string> = {
    1: "/onboarding/step-1-domain",
    2: "/onboarding/step-2-profile",
    3: "/onboarding/step-3-firm-details",
    4: "/onboarding/step-4-tos",
  };

  const userStep = stateStep[user.onboardingState] ?? 1;
  const isOnboarding = location.pathname.startsWith("/onboarding");
  const isAdmin = location.pathname.startsWith("/admin");

  // Completed users go to dashboard
  if (user.onboardingState === "completed" && isOnboarding) {
    return <Navigate to="/admin" replace />;
  }

  // Unfinished users stay out of dashboard
  if (user.onboardingState !== "completed" && isAdmin) {
    return <Navigate to={stepPath[userStep] ?? "/onboarding/step-1-domain"} replace />;
  }

  if (isOnboarding) {
    const pathStep = Number(
      Object.entries(stepPath).find(
        ([, p]) => p === location.pathname,
      )?.[0] ?? userStep,
    );

    // Domain verified state: steps 2-4 are all accessible (multi-form with local store)
    if (user.onboardingState === "domain_verified") {
      if (pathStep < 2) {
        return <Navigate to={stepPath[2]} replace />;
      }
      return <Outlet />;
    }

    // Original logic for other states
    if (pathStep > userStep) {
      return <Navigate to={stepPath[userStep]} replace />;
    }
    if (pathStep === 1 && userStep > 1) {
      return <Navigate to={stepPath[userStep]} replace />;
    }
  }

  return <Outlet />;
}
