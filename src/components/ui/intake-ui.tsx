import { Box, Button, HStack, Skeleton, Stack, Text } from "@chakra-ui/react";
import type { ButtonProps } from "@chakra-ui/react";
import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

const intakeColors = {
  success: {
    bg: "#d9f8ed",
    color: "#00785a",
  },
  neutral: {
    bg: "#f1eee6",
    color: "#6b6252",
  },
  warning: {
    bg: "#fbefd8",
    color: "#8a641d",
  },
  gold: {
    bg: "#fff0c9",
    color: "#795000",
  },
  danger: {
    bg: "#ffe2e4",
    color: "#b00020",
  },
  info: {
    bg: "#e7f0ff",
    color: "#2f63c7",
  },
  brand: {
    bg: "brand.solid",
    color: "brand.fg",
  },
} as const;

type Tone = keyof typeof intakeColors;

export function SurfaceCard({ children }: { children: ReactNode }) {
  return (
    <Box
      bg="bg"
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      p="18px"
    >
      {children}
    </Box>
  );
}

export function IntakeListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Stack gap="16px" aria-label="Loading" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <SurfaceCard key={i}>
          <HStack justifyContent="space-between" gap="16px">
            <HStack gap="12px">
              <Skeleton w="36px" h="36px" borderRadius="full" />
              <Stack gap="6px">
                <Skeleton h="14px" w="160px" borderRadius="4px" />
                <Skeleton h="11px" w="100px" borderRadius="4px" />
              </Stack>
            </HStack>
            <Skeleton h="20px" w="96px" borderRadius="99px" />
          </HStack>
          <Skeleton mt="16px" h="58px" w="100%" borderRadius="8px" />
        </SurfaceCard>
      ))}
    </Stack>
  );
}

export function PracticePill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  const color = intakeColors[tone];

  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      w="fit-content"
      minH="18px"
      px="8px"
      py="2px"
      borderRadius="999px"
      bg={color.bg}
      color={color.color}
      fontSize="10px"
      fontWeight="500"
      lineHeight="1"
    >
      {children}
    </Box>
  );
}

export function StatusPill({
  children,
  tone = "success",
  icon,
}: {
  children: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
}) {
  const color = intakeColors[tone];

  return (
    <HStack
      as="span"
      display="inline-flex"
      gap="4px"
      justifyContent="center"
      minH="18px"
      px="9px"
      py="2px"
      borderRadius="999px"
      bg={color.bg}
      color={color.color}
      fontSize="10px"
      fontWeight="500"
      lineHeight="1"
      whiteSpace="nowrap"
    >
      {icon}
      <Box as="span">{children}</Box>
    </HStack>
  );
}

export function AddOnWarning() {
  return (
    <HStack mt="0" gap="3px" color="brand.700" fontSize="10px" fontWeight="500">
      <AlertTriangle size={11} />
      <Box as="span">Not active</Box>
    </HStack>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <Text m="0" color="fg" fontSize="16px" fontWeight="500" lineHeight="1.15">
      {children}
    </Text>
  );
}

export function MutedText({
  children,
  fontSize = "12px",
}: {
  children: ReactNode;
  fontSize?: string;
}) {
  return (
    <Text m="0" color="fg.muted" fontSize={fontSize} lineHeight="1.2">
      {children}
    </Text>
  );
}

export function BrandButton(props: ButtonProps) {
  return (
    <Button
      h="34px"
      minH="34px"
      px="14px"
      borderRadius="7px"
      layerStyle="brand-button"
      fontSize="13px"
      fontWeight="500"
      {...props}
    />
  );
}

export function OutlineButton(props: ButtonProps) {
  return (
    <Button
      h="34px"
      minH="34px"
      px="14px"
      borderRadius="7px"
      border="1px solid"
      borderColor="border"
      bg="bg"
      color="fg"
      fontSize="13px"
      fontWeight="500"
      variant="outline"
      {...props}
    />
  );
}
