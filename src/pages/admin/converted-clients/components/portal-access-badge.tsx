import { Badge, type BadgeProps } from "@chakra-ui/react";

const statusConfig: Record<string, { label: string; colorScheme: BadgeProps["colorScheme"] }> = {
  active: { label: "Active", colorScheme: "green" },
  invited: { label: "Invited", colorScheme: "yellow" },
  disabled: { label: "Disabled", colorScheme: "red" },
};

export function PortalAccessBadge({ status, hasAccount }: { status: string; hasAccount?: boolean }) {
  if (!hasAccount) {
    return (
      <Badge
        colorScheme="gray"
        variant="subtle"
        fontSize="11px"
        px="8px"
        py="2px"
        borderRadius="full"
      >
        No access
      </Badge>
    );
  }

  const config = statusConfig[status] ?? statusConfig.invited;
  return (
    <Badge
      colorScheme={config.colorScheme}
      variant="subtle"
      fontSize="11px"
      px="8px"
      py="2px"
      borderRadius="full"
    >
      {config.label}
    </Badge>
  );
}
