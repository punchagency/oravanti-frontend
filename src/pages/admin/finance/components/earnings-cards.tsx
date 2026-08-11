import type { EarningsByStaffRow, TopMattersResult } from "@/api/finance";
import { CardTitle, SurfaceCard } from "@/components/ui/intake-ui";
import { formatCurrency, percentOf } from "@/utils/currency";
import { Box, Flex, Text } from "@chakra-ui/react";

export function EarningsByStaffCard({
  rows,
  isLoading,
}: {
  rows: EarningsByStaffRow[];
  isLoading: boolean;
}) {
  // Scaled against the top earner so the bars compare people, not absolutes.
  const max = Math.max(...rows.map((r) => r.amount), 0);

  return (
    <SurfaceCard>
      <CardTitle>Earnings by staff member</CardTitle>
      <Text fontSize="12px" color="fg.muted" mt="2px">
        Billable hours &amp; revenue breakdown
      </Text>

      <Flex direction="column" gap="14px" mt="16px">
        {isLoading ? (
          Array.from({ length: 4 }, (_, i) => (
            <Box key={i} h="34px" borderRadius="6px" bg="bg.muted" />
          ))
        ) : rows.length === 0 ? (
          <Text fontSize="12px" color="fg.muted">
            No approved billable time in this period.
          </Text>
        ) : (
          rows.map((row) => (
            <Box key={row.staffId}>
              <Flex justify="space-between" align="baseline" gap="8px">
                <Text fontSize="12px" fontWeight="600" truncate>
                  {row.staffName}
                  <Text as="span" color="fg.muted" fontWeight="400" ml="6px">
                    {row.hours.toFixed(1)}h · {row.entryCount} entries
                  </Text>
                </Text>
                <Text fontSize="12px" fontWeight="700" flexShrink={0}>
                  {formatCurrency(row.amount)}
                </Text>
              </Flex>
              <Box
                mt="6px"
                h="6px"
                borderRadius="999px"
                bg="border.muted"
                overflow="hidden"
              >
                <Box
                  h="100%"
                  borderRadius="999px"
                  bg="#6a5cc7"
                  w={`${percentOf(row.amount, max)}%`}
                  transition="width 200ms ease"
                />
              </Box>
            </Box>
          ))
        )}
      </Flex>
    </SurfaceCard>
  );
}

export function TopMattersCard({
  data,
  isLoading,
}: {
  data: TopMattersResult | undefined;
  isLoading: boolean;
}) {
  return (
    <SurfaceCard>
      <CardTitle>Top matters by hours</CardTitle>
      <Text fontSize="12px" color="fg.muted" mt="2px">
        Most time-intensive matters this month
      </Text>

      <Flex direction="column" mt="12px">
        {isLoading ? (
          Array.from({ length: 4 }, (_, i) => (
            <Box key={i} h="38px" mb="8px" borderRadius="6px" bg="bg.muted" />
          ))
        ) : !data || data.matters.length === 0 ? (
          <Text fontSize="12px" color="fg.muted" py="8px">
            No matter time logged in this period.
          </Text>
        ) : (
          data.matters.map((matter, index) => (
            <Flex
              key={matter.caseId}
              justify="space-between"
              gap="10px"
              py="10px"
              borderTop={index === 0 ? "none" : "1px solid"}
              borderColor="border.muted"
            >
              <Box minW={0}>
                <Text fontSize="12px" fontWeight="600" truncate>
                  {matter.clientName}
                </Text>
                <Text fontSize="11px" color="fg.muted">
                  {matter.caseNumber}
                </Text>
              </Box>
              <Box textAlign="right" flexShrink={0}>
                <Text fontSize="12px" fontWeight="600" color="#3b82c4">
                  {matter.hours.toFixed(1)}h
                </Text>
                <Text fontSize="11px" color="fg.muted">
                  {formatCurrency(matter.amount)}
                </Text>
              </Box>
            </Flex>
          ))
        )}

        {/* Surfaced so the matter rows reconcile with the hours-logged tile —
            time_entries.caseId is nullable, so admin time belongs to no matter. */}
        {data && data.unattributedHours > 0 && (
          <Text
            fontSize="11px"
            color="fg.muted"
            mt="10px"
            pt="10px"
            borderTop="1px solid"
            borderColor="border.muted"
          >
            {data.unattributedHours.toFixed(1)}h logged against no matter
          </Text>
        )}
      </Flex>
    </SurfaceCard>
  );
}
