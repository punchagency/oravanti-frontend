import { Box, Flex, Text } from "@chakra-ui/react";

export type SummaryChip = {
  label: string;
  value: string;
  /** Dot colour. Kept as explicit hex to match the mockup's palette. */
  dot: string;
};

/**
 * The pill row under the page header. Its contents differ per tab, so the tab
 * supplies them rather than the shell guessing.
 */
export function SummaryChips({ chips }: { chips: SummaryChip[] }) {
  if (chips.length === 0) return null;

  return (
    <Flex gap="10px" flexWrap="wrap" mt="16px">
      {chips.map((chip) => (
        <Flex
          key={chip.label}
          align="center"
          gap="8px"
          px="14px"
          h="34px"
          borderRadius="999px"
          border="1px solid"
          borderColor="border"
          bg="bg"
        >
          <Box w="7px" h="7px" borderRadius="full" bg={chip.dot} flexShrink={0} />
          <Text fontSize="12px" color="fg.muted" whiteSpace="nowrap">
            {chip.label}:
          </Text>
          <Text fontSize="12px" fontWeight="700" color="fg" whiteSpace="nowrap">
            {chip.value}
          </Text>
        </Flex>
      ))}
    </Flex>
  );
}
