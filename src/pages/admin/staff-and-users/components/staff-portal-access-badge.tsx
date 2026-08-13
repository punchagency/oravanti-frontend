import { Badge, type BadgeProps } from "@chakra-ui/react";

const statusConfig: Record<
  string,
  { label: string; colorScheme: BadgeProps["colorScheme"] }
> = {
  active: { label: "Active", colorScheme: "green" },
  pending: { label: "Pending", colorScheme: "yellow" },
  none: { label: "No access", colorScheme: "gray" },
  disabled: { label: "Disabled", colorScheme: "red" },
};

export function StaffPortalAccessBadge({
  status,
}: {
  status?: string | null;
}) {
  const config = status ? statusConfig[status] : undefined;
  if (!config) {
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
