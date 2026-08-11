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
    twoFactorPending,
  } = useAuthStore();

  const isLoading = queryLoading || storeLoading;

  // Client users → client portal; staff/admin/contractor → admin app.
  const isAuthed = isAuthenticated && !!user;
  const router = isLoading
    ? publicRouter
    : twoFactorPending
      ? publicRouter
      : isAuthed
        ? user!.accountType === "client"
          ? clientPortalRouter
          : adminRouter
        : publicRouter;

  if (isLoading) {
    return <FullPageLoader />;
  }

  // When 2FA is pending the public router is active and the /two-factor
  // route will render.  Once the user verifies, setAuth() clears the flag
  // and AppRouter re-renders with the correct authenticated router.

  // 2FA uses the same public router — no key change, so the router stays
  // mounted and preserves the current URL (/two-factor).
  const routerKey = isAuthed
    ? user!.accountType === "client"
      ? "client"
      : "admin"
    : "public";

  return <RouterProvider router={router} key={routerKey} />;
}
