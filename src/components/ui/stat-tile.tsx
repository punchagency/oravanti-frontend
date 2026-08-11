import { SurfaceCard } from "@/components/ui/intake-ui";
import { Box, Flex, Text } from "@chakra-ui/react";
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

/**
 * `label-top` puts the caption above and the icon badge top-right.
 * `icon-top` leads with the icon badge and drops the top label — the finance
 * Time & Billing and Reports tiles read that way, with the figure itself as
 * the headline.
 */
type Variant = "label-top" | "icon-top";

export function StatTile({
  label,
  value,
  caption,
  icon,
  tone,
  mutedValue = false,
  variant = "label-top",
  progress,
}: {
  label: string;
  /** Strings are accepted so a caller can pass pre-formatted currency. */
  value: number | string;
  caption: string;
  icon: ReactNode;
  tone: Tone;
  /** Keep the number neutral while the icon badge still carries the tone. */
  mutedValue?: boolean;
  variant?: Variant;
  /** 0–100. Renders the thin bar under the caption when provided. */
  progress?: number;
}) {
  const t = TONES[tone];

  const badge = (
    <Flex
      w="30px"
      h="30px"
      borderRadius="full"
      align="center"
      justify="center"
      bg={t.circleBg}
      color={t.circleFg}
      flexShrink={0}
    >
      {icon}
    </Flex>
  );

  const figure = (
    <Text
      fontSize="30px"
      fontWeight="700"
      color={mutedValue ? "fg" : t.value}
      lineHeight="1"
    >
      {value}
    </Text>
  );

  return (
    <SurfaceCard>
      {variant === "label-top" ? (
        <>
          <Flex justifyContent="space-between" alignItems="flex-start">
            <Text
              fontSize="11px"
              fontWeight="600"
              letterSpacing="0.06em"
              color="fg.muted"
            >
              {label.toUpperCase()}
            </Text>
            {badge}
          </Flex>
          <Box mt="8px">{figure}</Box>
        </>
      ) : (
        <>
          {badge}
          <Box mt="16px">{figure}</Box>
          <Text mt="8px" fontSize="13px" fontWeight="600" color="fg">
            {label}
          </Text>
        </>
      )}
      <Text mt="8px" fontSize="12px" color="fg.muted">
        {caption}
      </Text>
      {progress !== undefined && (
        <Box mt="12px" h="4px" borderRadius="999px" bg="border.muted" overflow="hidden">
          <Box
            h="100%"
            borderRadius="999px"
            bg={t.circleFg}
            w={`${Math.min(Math.max(progress, 0), 100)}%`}
            transition="width 200ms ease"
          />
        </Box>
      )}
    </SurfaceCard>
  );
}
