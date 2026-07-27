import { SurfaceCard } from "@/components/ui/intake-ui";
import { Box, Flex, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

export function StatTile({
  label,
  value,
  caption,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  caption: string;
  icon: ReactNode;
  tone?: "critical" | "warning" | "neutral" | "success";
}) {
  const valueColor =
    tone === "critical"
      ? "red.500"
      : tone === "warning"
        ? "orange.500"
        : tone === "success"
          ? "green.500"
          : "fg";

  return (
    <SurfaceCard>
      <Flex justifyContent="space-between" alignItems="flex-start">
        <Text
          fontSize="11px"
          fontWeight="600"
          letterSpacing="0.06em"
          color="fg.muted"
        >
          {label.toUpperCase()}
        </Text>
        <Box color="fg.subtle">{icon}</Box>
      </Flex>
      <Text mt="6px" fontSize="30px" fontWeight="700" color={valueColor} lineHeight="1">
        {value}
      </Text>
      <Text mt="6px" fontSize="12px" color="fg.muted">
        {caption}
      </Text>
    </SurfaceCard>
  );
}
