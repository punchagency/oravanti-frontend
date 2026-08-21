import { PageTitle } from "@/components/layout/shared/nav-context";
import { Box, Tabs, Text, VStack } from "@chakra-ui/react";
import { Outlet, useLocation, useNavigate } from "react-router";

const DEFAULT_TAB = "staff";

const TABS = [
  { value: "staff", label: "Members" },
  { value: "roles", label: "Roles" },
  { value: "groups", label: "Groups" },
  { value: "matrix", label: "Permissions matrix" },
] as const;

/**
 * The tabs shell. Each tab (`tabs/staff`, `tabs/roles`, `tabs/groups`,
 * `tabs/matrix`) is its own routed, lazy-loaded page — matching how every
 * other tabbed settings page in the app works (see `firm-settings`) —
 * rather than all four being eagerly bundled and mounted at once behind
 * local tab state.
 */
export function RolesPermissionsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const segments = location.pathname.replace(/\/+$/, "").split("/");
  const last = segments[segments.length - 1];
  const currentTab =
    last === "rbac"
      ? DEFAULT_TAB
      : TABS.some((t) => t.value === last)
        ? last
        : DEFAULT_TAB;

  return (
    <VStack align="stretch" gap={{ base: 5, md: 6 }} pb="24px">
      <Box py="28px" pb="16px">
        <PageTitle>
          <Text as="h1" m="0" color="fg" fontSize="22px" fontWeight="500" lineHeight="1.2">
            Roles &amp; permissions
          </Text>
        </PageTitle>
        <Text m="6px 0 0" color="fg.muted" fontSize="13px">
          Manage roles, permission groups, and staff role assignments
        </Text>
      </Box>

      <Tabs.Root
        value={currentTab}
        onValueChange={(e) =>
          navigate(e.value === DEFAULT_TAB ? "/settings/rbac" : `/settings/rbac/${e.value}`)
        }
        variant="line"
      >
        <Tabs.List borderBottom="1px solid" borderColor="border.muted">
          {TABS.map((t) => (
            <Tabs.Trigger key={t.value} value={t.value} fontSize="13px">
              {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs.Root>

      <Box pt="4px">
        <Outlet />
      </Box>
    </VStack>
  );
}

export default RolesPermissionsPage;
