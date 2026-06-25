import type { ReactNode } from "react";
import { Box, chakra } from "@chakra-ui/react";

export function NotifyChip({
  active,
  icon,
  children,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <chakra.button
      type="button"
      display="inline-flex"
      alignItems="center"
      gap="6px"
      minH="28px"
      px="10px"
      border="1px solid"
      borderColor={active ? "brand.solid" : "border"}
      borderRadius="999px"
      bg="bg"
      color={active ? "fg" : "fg.muted"}
      fontSize="12px"
      onClick={onClick}
    >
      {icon}
      <Box as="span">{children}</Box>
    </chakra.button>
  );
}
