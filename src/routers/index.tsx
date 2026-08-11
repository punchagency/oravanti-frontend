import { useLayoutEffect } from "react";
import { Center, Spinner, Text, VStack } from "@chakra-ui/react";
import { RouterProvider } from "react-router";
import { useAuthRefresh } from "@/hooks/useAuthRefresh";
import { useAuthStore } from "@/store/auth-store";
import { createAdminRouter } from "./admin";
import { createClientPortalRouter } from "./client";
import { createPublicRouter } from "./public";

const adminRouter = createAdminRouter();
const clientPortalRouter = createClientPortalRouter();
const publicRouter = createPublicRouter();

function FullPageLoader() {
  return (
    <Center h="100vh" bg="bg">
      <VStack gap="4">
        <Spinner size="xl" color="brand.solid" />
        <Text textStyle="sm" color="fg.muted">
          Loading...
        </Text>
      </VStack>
    </Center>
  );
}

export function AppRouter() {
  const { isLoading: queryLoading } = useAuthRefresh();
  const {
    user,
    isAuthenticated,
    isLoading: storeLoading,
    redirectPath,
  } = useAuthStore();

  const isLoading = queryLoading || storeLoading;

  // Client users → client portal; staff/admin/contractor → admin app.
  const isAuthed = isAuthenticated && !!user;
  const router = isLoading
    ? publicRouter
    : isAuthed
      ? user!.accountType === "client"
        ? clientPortalRouter
        : adminRouter
      : publicRouter;

  // Apply any redirect requested outside the router (login, logout, 2FA,
  // session expiry). Runs before paint so there is no flash of the previous
  // route, and navigates whichever router is now active. Must be called
  // unconditionally (before any early return) to satisfy the Rules of Hooks.
  useLayoutEffect(() => {
    if (!isLoading && redirectPath) {
      router.navigate(redirectPath, { replace: true });
      useAuthStore.getState().setRedirectPath(null);
    }
  }, [router, redirectPath, isLoading]);

  if (isLoading) {
    return <FullPageLoader />;
  }

  const routerKey = isAuthed
    ? user!.accountType === "client"
      ? "client"
      : "admin"
    : "public";

  return <RouterProvider router={router} key={routerKey} />;
}
