import { usePermissions } from "@/hooks/use-permissions";
import { Badge, Text, VStack } from "@chakra-ui/react";
import { Outlet } from "react-router";

type RequirePermissionProps = {
  /** Single `"resource:action"` or an array (any-of). */
  permission: string | string[];
};

function formatPermissionLabel(perm: string): string {
  const [resource, action] = perm.split(":");
  return `${resource.replace(/_/g, " ")} → ${action.replace(/_/g, " ")}`;
}

/**
 * Route-level layout guard. Wrap a group of routes:
 *
 *   <Route element={<RequirePermission permission="leads:read" />}>
 *     <Route path="leads" element={<LeadsPage />} />
 *   </Route>
 *
 * Reads the session grants synchronously — zero network cost.
 * Renders child routes via Outlet when allowed, otherwise
 * shows the access-restricted page with the required permission
 * so the admin knows exactly what to grant.
 */
export function RequirePermission({ permission }: RequirePermissionProps) {
  const { can, hasAny } = usePermissions();

  const perms = Array.isArray(permission) ? permission : [permission];
  const allowed = Array.isArray(permission)
    ? hasAny(permission)
    : can(permission.split(":")[0], permission.split(":")[1]);

  if (allowed) return <Outlet />;

  return (
    <VStack align="center" justify="center" gap="5" minH="400px" p="8">
      <Text fontSize="16px" fontWeight="600" color="fg">
        Access restricted
      </Text>
      <Text
        fontSize="13px"
        color="fg.muted"
        textAlign="center"
        maxW="440px"
        lineHeight="1.5"
      >
        You don&apos;t have permission to access this page. Ask your
        administrator to grant the following permission{perms.length > 1 ? "s" : ""}
        on your role:
      </Text>
      <VStack gap="2" mt="1">
        {perms.map((p) => (
          <Badge
            key={p}
            variant="surface"
            colorPalette="blue"
            fontSize="12px"
            px="10px"
            py="4px"
            borderRadius="6px"
            fontFamily="mono"
          >
            {formatPermissionLabel(p)}
          </Badge>
        ))}
      </VStack>
    </VStack>
  );
}
