import { Badge, type BadgeProps } from "@chakra-ui/react";

const statusConfig: Record<string, { label: string; colorScheme: BadgeProps["colorScheme"] }> = {
  active: { label: "Active", colorScheme: "green" },
  invited: { label: "Invited", colorScheme: "yellow" },
  never_invited: { label: "No access", colorScheme: "gray" },
};

export function PortalAccessBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? statusConfig.never_invited;
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
