import type { FinanceReport } from "@/api/finance";
import { CardTitle, StatusPill, SurfaceCard } from "@/components/ui/intake-ui";
import { REPORT_CELL_PY, ReportTable } from "@/components/ui/report-table";
import { formatCurrency, formatPercent, percentOf } from "@/utils/currency";
import { Box, Flex, Grid, Table, Text } from "@chakra-ui/react";
import { ShieldCheck } from "lucide-react";

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "info"> = {
  paid: "success",
  overdue: "danger",
  partial: "info",
  unpaid: "warning",
};

const STATUS_BAR: Record<string, string> = {
  paid: "#2e9e6b",
  overdue: "#d64545",
  partial: "#3b82c4",
  unpaid: "#b5851f",
};

export function AccountSplitCard({
  split,
}: {
  split: FinanceReport["accountSplit"];
}) {
  const trustVisible = split.trust !== null;

  return (
    <SurfaceCard>
      <CardTitle>Account split</CardTitle>
      <Text fontSize="12px" color="fg.muted" mt="2px">
        Operating vs Trust (IOLTA) by invoice total
      </Text>

      <Flex mt="16px" h="28px" borderRadius="6px" overflow="hidden">
        <Flex
          align="center"
          justify="center"
          bg="#6a5cc7"
          color="white"
          w={`${trustVisible ? split.operatingPercent : 100}%`}
          fontSize="11px"
          fontWeight="700"
          transition="width 200ms ease"
        >
          {split.operatingPercent}%
        </Flex>
        {trustVisible && (
          <Flex
            align="center"
            justify="center"
            bg="#2e9e6b"
            color="white"
            w={`${split.trustPercent ?? 0}%`}
            fontSize="11px"
            fontWeight="700"
            transition="width 200ms ease"
          >
            {split.trustPercent}%
          </Flex>
        )}
      </Flex>

      <Grid
        templateColumns={{ base: "1fr", sm: trustVisible ? "1fr 1fr" : "1fr" }}
        gap="12px"
        mt="14px"
      >
        <Box p="14px" borderRadius="10px" bg="bg.muted">
          <Flex align="center" gap="7px">
            <Box w="7px" h="7px" borderRadius="full" bg="#6a5cc7" />
            <Text fontSize="12px" color="fg.muted">
              Operating account
            </Text>
          </Flex>
          <Text fontSize="18px" fontWeight="700" mt="4px" color="#6a5cc7">
            {formatCurrency(split.operating)}
          </Text>
          <Text fontSize="11px" color="fg.muted">
            {split.operatingPercent}% of total
          </Text>
        </Box>

        {trustVisible && (
          <Box p="14px" borderRadius="10px" bg="bg.muted">
            <Flex align="center" gap="7px">
              <Box w="7px" h="7px" borderRadius="full" bg="#2e9e6b" />
              <Text fontSize="12px" color="fg.muted">
                Trust (IOLTA)
              </Text>
            </Flex>
            <Text fontSize="18px" fontWeight="700" mt="4px" color="#2e9e6b">
              {formatCurrency(split.trust)}
            </Text>
            <Text fontSize="11px" color="fg.muted">
              {split.trustPercent}% of total
            </Text>
          </Box>
        )}
      </Grid>
    </SurfaceCard>
  );
}

export function CollectionStatusCard({
  summary,
  rows,
}: {
  summary: FinanceReport["summary"];
  rows: FinanceReport["collectionStatus"];
}) {
  const max = Math.max(...rows.map((r) => r.amount), 0);

  return (
    <SurfaceCard>
      <CardTitle>Collection status</CardTitle>
      <Text fontSize="12px" color="fg.muted" mt="2px">
        Invoice breakdown by payment status
      </Text>

      <Flex direction="column" align="center" py="18px">
        <Text fontSize="44px" fontWeight="700" color="#2e9e6b" lineHeight="1">
          {formatPercent(summary.collectionRate)}
        </Text>
        <Text fontSize="12px" color="fg.muted" mt="6px">
          Collection rate
        </Text>
        <Text fontSize="11px" color="fg.muted">
          {formatCurrency(summary.collected)} collected of{" "}
          {formatCurrency(summary.totalRevenue)}
        </Text>
      </Flex>

      <Flex direction="column" gap="10px" pt="10px" borderTop="1px solid" borderColor="border.muted">
        {rows.map((row) => (
          <Flex key={row.status} align="center" gap="10px">
            <Box minW="64px">
              <StatusPill tone={STATUS_TONE[row.status] ?? "neutral"}>
                {row.status[0]!.toUpperCase() + row.status.slice(1)}
              </StatusPill>
            </Box>
            <Box flex="1" h="7px" borderRadius="999px" bg="border.muted" overflow="hidden">
              <Box
                h="100%"
                borderRadius="999px"
                bg={STATUS_BAR[row.status] ?? "#8a8a8a"}
                w={`${percentOf(row.amount, max)}%`}
              />
            </Box>
            <Text fontSize="12px" color="fg.muted" minW="18px" textAlign="right">
              {row.count}
            </Text>
            <Text fontSize="12px" fontWeight="600" minW="88px" textAlign="right">
              {formatCurrency(row.amount)}
            </Text>
          </Flex>
        ))}
      </Flex>
    </SurfaceCard>
  );
}

export function PracticeAreaTable({
  rows,
}: {
  rows: FinanceReport["byPracticeArea"];
}) {
  return (
    <SurfaceCard>
      <CardTitle>Revenue by practice area</CardTitle>
      <Text fontSize="12px" color="fg.muted" mt="2px" mb="14px">
        Invoiced amounts broken down by practice area
      </Text>

      <ReportTable
        headers={[
          "Practice area",
          "Invoices",
          "Invoiced",
          "Collected",
          "Outstanding",
          "Rate",
        ]}
      >
        {rows.map((row) => (
          <Table.Row key={row.practiceAreaId ?? row.name}>
            <Table.Cell py={REPORT_CELL_PY}>
              <StatusPill tone="info">{row.name}</StatusPill>
            </Table.Cell>
            <Table.Cell py={REPORT_CELL_PY} textAlign="right">
              <Text fontSize="13px">{row.invoiceCount}</Text>
            </Table.Cell>
            <Table.Cell py={REPORT_CELL_PY} textAlign="right">
              <Text fontSize="13px" fontWeight="600">
                {formatCurrency(row.invoiced)}
              </Text>
            </Table.Cell>
            <Table.Cell py={REPORT_CELL_PY} textAlign="right">
              <Text fontSize="13px" color="#2e9e6b">
                {formatCurrency(row.collected)}
              </Text>
            </Table.Cell>
            <Table.Cell py={REPORT_CELL_PY} textAlign="right">
              <Text fontSize="13px" color="#b5851f">
                {formatCurrency(row.outstanding)}
              </Text>
            </Table.Cell>
            <Table.Cell py={REPORT_CELL_PY} textAlign="right">
              <Text
                fontSize="13px"
                fontWeight="600"
                color={row.collectionRate > 0 ? "#2e9e6b" : "#d64545"}
              >
                {row.collectionRate}%
              </Text>
            </Table.Cell>
          </Table.Row>
        ))}
      </ReportTable>
    </SurfaceCard>
  );
}

export function ReceivableAgingCard({ aging }: { aging: FinanceReport["aging"] }) {
  const max = Math.max(...aging.buckets.map((b) => b.amount), 0);
  const colors = ["#2e9e6b", "#b5851f", "#d98324", "#d64545"];

  return (
    <SurfaceCard>
      <CardTitle>Accounts receivable aging</CardTitle>
      <Text fontSize="12px" color="fg.muted" mt="2px">
        Outstanding balances by age — {formatCurrency(aging.total)} total
      </Text>

      <Flex direction="column" gap="14px" mt="16px">
        {aging.buckets.map((bucket, index) => (
          <Box key={bucket.key}>
            <Flex justify="space-between" align="baseline">
              <Text fontSize="12px" color="fg.muted">
                {bucket.label}
              </Text>
              <Text
                fontSize="12px"
                fontWeight="700"
                color={bucket.amount > 0 ? colors[index] : "fg.muted"}
              >
                {formatCurrency(bucket.amount)}
              </Text>
            </Flex>
            <Box
              mt="6px"
              h="7px"
              borderRadius="999px"
              bg="border.muted"
              overflow="hidden"
            >
              <Box
                h="100%"
                borderRadius="999px"
                bg={colors[index]}
                w={`${percentOf(bucket.amount, max)}%`}
              />
            </Box>
          </Box>
        ))}
      </Flex>
    </SurfaceCard>
  );
}

export function TrustReconciliationCard({
  trust,
}: {
  trust: NonNullable<FinanceReport["trustReconciliation"]>;
}) {
  return (
    <SurfaceCard>
      <CardTitle>Trust account reconciliation</CardTitle>
      <Text fontSize="12px" color="fg.muted" mt="2px">
        IOLTA compliance summary (ABA Rule 1.15)
      </Text>

      <Flex
        align="center"
        gap="10px"
        mt="14px"
        p="14px"
        borderRadius="10px"
        border="1px solid"
        borderColor="#b9e3cd"
        bg="#f1faf5"
        _dark={{
          bg: "rgba(46, 158, 107, 0.12)",
          borderColor: "rgba(46,158,107,0.35)",
        }}
      >
        <Box color="#2e9e6b">
          <ShieldCheck size={17} />
        </Box>
        <Box>
          <Text fontSize="13px" fontWeight="600" color="#2e9e6b">
            Trust account compliant
          </Text>
          <Text fontSize="12px" color="fg.muted">
            All client funds properly segregated from the operating account
          </Text>
        </Box>
      </Flex>

      <Box mt="14px">
        {[
          ["Total filing fees invoiced", formatCurrency(trust.filingFeesInvoiced)],
          ["Filing fees collected", formatCurrency(trust.filingFeesCollected)],
          ["Invoiced but not yet collected", formatCurrency(trust.heldInTrustPending)],
          ["Number of trust invoices", `${trust.trustInvoiceCount} invoices`],
        ].map(([label, value]) => (
          <Flex
            key={label}
            justify="space-between"
            py="10px"
            borderTop="1px solid"
            borderColor="border.muted"
          >
            <Text fontSize="12px" color="fg.muted">
              {label}
            </Text>
            <Text fontSize="12px" fontWeight="700">
              {value}
            </Text>
          </Flex>
        ))}
      </Box>

      {/* Named honestly: nothing records a disbursement OUT of trust yet, so
          this figure can only grow and is not a true trust balance. */}
      {!trust.disbursementsTracked && (
        <Text fontSize="11px" color="fg.muted" mt="8px">
          Disbursements out of trust are not yet tracked, so this is money
          invoiced but not yet collected rather than a live trust balance.
        </Text>
      )}

      {trust.invoices.length > 0 && (
        <Box mt="18px">
          <Text
            fontSize="10px"
            letterSpacing="0.06em"
            color="fg.muted"
            fontWeight="600"
          >
            INVOICES WITH TRUST AMOUNTS
          </Text>
          {trust.invoices.map((inv, index) => (
            <Flex
              key={inv.id}
              justify="space-between"
              gap="10px"
              py="10px"
              borderTop={index === 0 ? "none" : "1px solid"}
              borderColor="border.muted"
              mt={index === 0 ? "8px" : 0}
            >
              <Box minW={0}>
                <Text fontSize="12px" fontWeight="600" truncate>
                  {inv.clientName}
                </Text>
                <Text fontSize="11px" color="fg.muted">
                  {inv.invoiceNumber}
                </Text>
              </Box>
              <Box textAlign="right" flexShrink={0}>
                <Text fontSize="12px" fontWeight="700" color="#2e9e6b">
                  {formatCurrency(inv.trustAmount)}
                </Text>
                <Box mt="2px">
                  <StatusPill tone={inv.paid ? "success" : "warning"}>
                    {inv.paid ? "Paid" : "Unpaid"}
                  </StatusPill>
                </Box>
              </Box>
            </Flex>
          ))}
        </Box>
      )}
    </SurfaceCard>
  );
}
