import { SurfaceCard } from "@/components/ui/intake-ui";
import { Flex, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

type Tone = "critical" | "warning" | "info" | "success";

const TONES: Record<Tone, { circleBg: string; circleFg: string; value: string }> = {
  // Only critical and warnings colour the number, matching the mockup; the other
  // two keep a neutral value with just a tinted icon badge.
  critical: { circleBg: "#fde8e8", circleFg: "#d64545", value: "#c0392b" },
  warning: { circleBg: "#fbeecf", circleFg: "#b5851f", value: "#b5851f" },
  info: { circleBg: "#ece9fb", circleFg: "#6a5cc7", value: "fg" },
  success: { circleBg: "#daf3e6", circleFg: "#2e9e6b", value: "fg" },
};

export function StatTile({
  label,
  value,
  caption,
  icon,
  tone,
}: {
  label: string;
  value: number;
  caption: string;
  icon: ReactNode;
  tone: Tone;
}) {
  const t = TONES[tone];
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
        <Flex
          w="30px"
          h="30px"
          borderRadius="full"
          align="center"
          justify="center"
          bg={t.circleBg}
          color={t.circleFg}
        >
          {icon}
        </Flex>
      </Flex>
      <Text mt="8px" fontSize="30px" fontWeight="700" color={t.value} lineHeight="1">
        {value}
      </Text>
      <Text mt="8px" fontSize="12px" color="fg.muted">
        {caption}
      </Text>
    </SurfaceCard>
  );
}
