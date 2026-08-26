import { Box, Button, Grid, HStack, Text, VStack } from "@chakra-ui/react";
import type { BaseSyntheticEvent, ReactNode } from "react";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { SectionLabel } from "../shared";

/**
 * Shared chrome for the two practice-area detail panels.
 *
 * Both are the same shape — a titled group of fields with one save button that
 * only lights up when something changed — so the chrome lives here and each
 * panel contributes only its own fields. Extracted because there are exactly
 * two and they are genuinely identical, not in anticipation of a third.
 */
export function DetailsPanel({
  title,
  description,
  children,
  onSubmit,
  isDirty,
  isSaving,
  isLoading,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  /** `handleSubmit(...)` from react-hook-form, whose signature this matches. */
  onSubmit: (event?: BaseSyntheticEvent) => unknown;
  isDirty: boolean;
  isSaving: boolean;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <VStack align="stretch" gap={2}>
        <ThemeSkeleton h="11px" w="130px" borderRadius="4px" />
        {Array.from({ length: 4 }, (_, i) => (
          <ThemeSkeleton key={i} h="52px" w="100%" borderRadius="6px" />
        ))}
      </VStack>
    );
  }

  return (
    <Box as="form" onSubmit={onSubmit}>
      <HStack justify="space-between" align="start" mb={2}>
        <Box>
          <SectionLabel>{title}</SectionLabel>
          {description && (
            <Text fontSize="10px" color="fg.subtle" mt={-1} mb={1}>
              {description}
            </Text>
          )}
        </Box>

        <Button
          type="submit"
          size="xs"
          h="26px"
          fontSize="11px"
          colorPalette="brand"
          disabled={!isDirty}
          loading={isSaving}
        >
          Save
        </Button>
      </HStack>

      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
        {children}
      </Grid>
    </Box>
  );
}

/** One labelled control. `hint` is where a field's consequence gets said out loud. */
export function PanelField({
  label,
  hint,
  error,
  children,
  span,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  span?: boolean;
}) {
  return (
    <Box gridColumn={span ? { base: "auto", md: "span 2" } : undefined}>
      <Text
        color="fg.subtle"
        fontSize="10px"
        fontWeight="500"
        letterSpacing="0.5px"
        textTransform="uppercase"
        mb={1}
      >
        {label}
      </Text>
      {children}
      {hint && !error && (
        <Text fontSize="10px" color="fg.subtle" mt={1}>
          {hint}
        </Text>
      )}
      {error && (
        <Text fontSize="10px" color="red.500" mt={1}>
          {error}
        </Text>
      )}
    </Box>
  );
}

/** A read-only figure, for values the firm reads but never types. */
export function PanelStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Box border="1px solid" borderColor="border.muted" borderRadius="6px" px={2.5} py={2}>
      <Text
        color="fg.subtle"
        fontSize="9px"
        fontWeight="500"
        letterSpacing="0.5px"
        textTransform="uppercase"
      >
        {label}
      </Text>
      <Text color="fg" fontSize="14px" fontWeight="600" lineHeight="1.3">
        {value}
      </Text>
      {hint && (
        <Text fontSize="10px" color="fg.subtle">
          {hint}
        </Text>
      )}
    </Box>
  );
}
