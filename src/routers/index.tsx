import { Center, Spinner, Text, VStack } from "@chakra-ui/react";
import { RouterProvider } from "react-router";
import { useAuthRefresh } from "@/hooks/useAuthRefresh";
import { useAuthStore } from "@/store/auth-store";
import type { SessionUser } from "@/types/auth";
import { createAdminRouter } from "./admin";
import { createClientPortalRouter } from "./client";
import { createPlatformRouter } from "./platform";
import { createPublicRouter } from "./public";

const routers = {
  admin: createAdminRouter(),
  client: createClientPortalRouter(),
  platform: createPlatformRouter(),
  public: createPublicRouter(),
};

type RouterName = keyof typeof routers;

/**
 * Which experience an account gets.
 *
 * A lookup rather than a chain of ternaries: with four routers the nested
 * conditional stopped being readable, and the `key` below needs the same
 * answer — so naming it once removes the chance of the two disagreeing about
 * which router is mounted.
 *
 * Everything that is not a client or an Oravanti operator is firm staff of
 * some kind, which is why `admin` is the fallback rather than an entry.
 */
const ROUTER_BY_ACCOUNT: Partial<Record<SessionUser["accountType"], RouterName>> = {
  client: "client",
  platform_admin: "platform",
};

const routerFor = (accountType: SessionUser["accountType"]): RouterName =>
  ROUTER_BY_ACCOUNT[accountType] ?? "admin";

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

  // Client users → client portal; Oravanti operators → the platform CRM;
  // staff/admin/contractor → the firm app.
  const isAuthed = isAuthenticated && !!user;

  // When 2FA is pending the public router is active and the /two-factor route
  // will render. Once the user verifies, setAuth() clears the flag and
  // AppRouter re-renders with the correct authenticated router.
  //
  // 2FA uses the same public router — no key change, so the router stays
  // mounted and preserves the current URL (/two-factor).
  const name: RouterName =
    isLoading || twoFactorPending || !isAuthed
      ? "public"
      : routerFor(user!.accountType);

  if (isLoading) {
    return <FullPageLoader />;
  }

  return <RouterProvider router={routers[name]} key={name} />;
}
