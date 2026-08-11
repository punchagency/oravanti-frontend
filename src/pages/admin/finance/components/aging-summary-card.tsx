import type { AgingBucket } from "@/api/finance";
import { CardTitle, SurfaceCard } from "@/components/ui/intake-ui";
import { formatCurrency, percentOf } from "@/utils/currency";
import { Box, Flex, Text } from "@chakra-ui/react";

const BAR_COLORS: Record<AgingBucket["key"], string> = {
  current: "#2e9e6b",
  "1_15": "#b5851f",
  "16_30": "#d98324",
  "31_plus": "#d64545",
};

/**
 * Outstanding balance by age.
 *
 * Bars are scaled against the largest bucket rather than the total, so a small
 * overdue amount beside a large current balance is still legible — the point of
 * this panel is comparing the buckets, not reading absolute widths.
 */
export function AgingSummaryCard({
  buckets,
  isLoading,
}: {
  buckets: AgingBucket[];
  isLoading: boolean;
}) {
  const max = Math.max(...buckets.map((b) => b.amount), 0);

  return (
    <SurfaceCard>
      <CardTitle>Aging summary</CardTitle>
      <Text fontSize="12px" color="fg.muted" mt="2px">
        Outstanding by age
      </Text>

      <Flex direction="column" gap="12px" mt="16px">
        {isLoading
          ? Array.from({ length: 4 }, (_, i) => (
              <Box key={i} h="26px" borderRadius="6px" bg="bg.muted" />
            ))
          : buckets.map((bucket) => (
              <Flex key={bucket.key} align="center" gap="12px">
                <Text
                  fontSize="12px"
                  color="fg.muted"
                  minW="76px"
                  flexShrink={0}
                >
                  {bucket.label}
                </Text>
                <Box
                  flex="1"
                  h="7px"
                  borderRadius="999px"
                  bg="border.muted"
                  overflow="hidden"
                >
                  <Box
                    h="100%"
                    borderRadius="999px"
                    bg={BAR_COLORS[bucket.key]}
                    w={`${percentOf(bucket.amount, max)}%`}
                    transition="width 200ms ease"
                  />
                </Box>
                <Text
                  fontSize="12px"
                  fontWeight="600"
                  minW="86px"
                  textAlign="right"
                  flexShrink={0}
                >
                  {formatCurrency(bucket.amount)}
                </Text>
              </Flex>
            ))}
      </Flex>
    </SurfaceCard>
  );
}
