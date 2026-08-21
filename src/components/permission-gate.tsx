import { usePermissions } from "@/hooks/use-permissions";
import { Badge, Text, VStack } from "@chakra-ui/react";
import type { ReactNode } from "react";

type PermissionGateProps = {
  /** Single `resource:action` string, or an array (user needs ANY of them). */
  permission: string | string[];
  /** Content rendered when the permission check passes. */
  children: ReactNode;
  /** Optional custom fallback when access is denied. */
  fallback?: ReactNode;
};

function formatPermissionLabel(perm: string): string {
  const [resource, action] = perm.split(":");
  return `${resource.replace(/_/g, " ")}:${action.replace(/_/g, " ")}`;
}

/**
 * Renders `children` only when the user holds the required grant(s).
 * Otherwise renders a standard "Access restricted" page -- no API call,
 * purely client-side from the session's grants list.
 *
 * Accepts a single `"resource:action"` or an array (any-of logic).
 */
export function PermissionGate({
  permission,
  children,
  fallback,
}: PermissionGateProps) {
  const { can, hasAny } = usePermissions();

  const perms = Array.isArray(permission) ? permission : [permission];
  const allowed = Array.isArray(permission)
    ? hasAny(permission)
    : can(permission.split(":")[0], permission.split(":")[1]);

  if (allowed) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <VStack align="center" justify="center" gap="5" minH="200px" p="6">
      <Text fontSize="14px" fontWeight="600" color="fg">
        Access restricted
      </Text>
      <Text
        fontSize="12px"
        color="fg.muted"
        textAlign="center"
        maxW="380px"
        lineHeight="1.5"
      >
        You don&apos;t have permission for this action. Ask your administrator
        to grant:
      </Text>
      <VStack gap="1.5" mt="1">
        {perms.map((p) => (
          <Badge
            key={p}
            variant="surface"
            colorPalette="blue"
            fontSize="11px"
            px="8px"
            py="3px"
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
