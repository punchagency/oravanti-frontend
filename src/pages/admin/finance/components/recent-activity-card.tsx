import {
  PAYMENT_METHOD_LABELS,
  type FinanceActivityEntry,
} from "@/api/finance";
import { CardTitle, SurfaceCard } from "@/components/ui/intake-ui";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { Box, Flex, Text } from "@chakra-ui/react";

/** Dot colour by what happened, so the feed is scannable without reading it. */
const EVENT_DOT: Record<string, string> = {
  invoice_paid: "#2e9e6b",
  invoice_partially_paid: "#3b82c4",
  payment_recorded: "#2e9e6b",
  payment_followup_sent: "#d64545",
  invoice_sent: "#b5851f",
  invoice_created: "#b5851f",
  invoice_voided: "#8a8a8a",
  invoice_updated: "#8a8a8a",
  time_entry_logged: "#6a5cc7",
  time_entry_approved: "#2e9e6b",
  time_entry_rejected: "#d64545",
  billing_rate_changed: "#6a5cc7",
};

export function RecentActivityCard({
  entries,
  isLoading,
}: {
  entries: FinanceActivityEntry[];
  isLoading: boolean;
}) {
  return (
    <SurfaceCard>
      <CardTitle>Recent activity</CardTitle>

      <Flex direction="column" mt="14px">
        {isLoading ? (
          Array.from({ length: 4 }, (_, i) => (
            <Box key={i} h="42px" mb="10px" borderRadius="6px" bg="bg.muted" />
          ))
        ) : entries.length === 0 ? (
          <Text fontSize="12px" color="fg.muted" py="12px">
            Nothing has happened here yet. Invoices, payments and follow-ups will
            appear as they are recorded.
          </Text>
        ) : (
          entries.map((entry, index) => (
            <Flex
              key={entry.id}
              gap="10px"
              py="10px"
              borderTop={index === 0 ? "none" : "1px solid"}
              borderColor="border.muted"
            >
              <Box
                w="7px"
                h="7px"
                mt="5px"
                borderRadius="full"
                flexShrink={0}
                bg={EVENT_DOT[entry.eventType] ?? "#8a8a8a"}
              />
              <Box minW={0}>
                <Text fontSize="12px" fontWeight="600">
                  {entry.invoiceNumber ? `${entry.invoiceNumber} — ` : ""}
                  {entry.title.replace(/^INV-[\d-]+ — /, "")}
                </Text>
                <Text fontSize="11px" color="fg.muted">
                  {[
                    entry.amount != null ? formatCurrency(entry.amount) : null,
                    formatDate(entry.createdAt),
                    entry.paymentMethod
                      ? PAYMENT_METHOD_LABELS[entry.paymentMethod]
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </Box>
            </Flex>
          ))
        )}
      </Flex>
    </SurfaceCard>
  );
}
