import type { TimeEntryRow } from "@/api/finance";
import { BrandButton, OutlineButton, StatusPill } from "@/components/ui/intake-ui";
import { REPORT_CELL_PY, ReportTable } from "@/components/ui/report-table";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { Box, Center, Flex, Spinner, Table, Text, VStack } from "@chakra-ui/react";
import { TIME_STATUS_LABEL, TIME_STATUS_TONE } from "../data";

const HEADERS = [
  "Staff member",
  "Matter",
  "Date",
  "Hours",
  "Amount",
  "Status",
  "Action",
];

export function TimeEntriesTable({
  rows,
  totals,
  isLoading,
  onApprove,
  onReject,
  isMutating,
}: {
  rows: TimeEntryRow[];
  totals: { hours: number; amount: number } | undefined;
  isLoading: boolean;
  onApprove: (row: TimeEntryRow) => void;
  onReject: (row: TimeEntryRow) => void;
  isMutating: boolean;
}) {
  if (isLoading) {
    return (
      <Box>
        <Center py={16}>
          <Spinner />
        </Center>
      </Box>
    );
  }

  if (rows.length === 0) {
    return (
      <Box>
        <VStack py={16} gap={2} textAlign="center">
          <Text color="fg.muted" textStyle="lg" fontWeight="600">
            No time entries
          </Text>
          <Text color="fg.subtle" textStyle="body-sm">
            Log time against a matter to see it here.
          </Text>
        </VStack>
      </Box>
    );
  }

  // Matches the invoices table: the card frames and clips it.
  return (
    <ReportTable headers={HEADERS} flush>
      {rows.map((row) => (
        <Table.Row key={row.id}>
          <Table.Cell py={REPORT_CELL_PY} whiteSpace="nowrap">
            <Text fontSize="13px" fontWeight="600">
              {row.staffName}
            </Text>
            <Text fontSize="11px" color="fg.muted">
              {row.staffRole ?? "—"}
            </Text>
          </Table.Cell>

          <Table.Cell py={REPORT_CELL_PY} whiteSpace="nowrap">
            <Text fontSize="12px" color="fg.muted">
              {row.caseNumber ?? "—"}
            </Text>
          </Table.Cell>

          <Table.Cell py={REPORT_CELL_PY} whiteSpace="nowrap">
            <Text fontSize="12px" color="fg.muted">
              {formatDate(row.entryDate)}
            </Text>
          </Table.Cell>

          <Table.Cell py={REPORT_CELL_PY} whiteSpace="nowrap">
            <Text fontSize="13px" fontWeight="600" color="#3b82c4">
              {row.hoursWorked.toFixed(1)}h
            </Text>
            <Text fontSize="10px" color="fg.muted">
              {row.billable ? "billable" : "non-billable"}
            </Text>
          </Table.Cell>

          <Table.Cell py={REPORT_CELL_PY} whiteSpace="nowrap">
            {/* A missing rate is reported, not rendered as $0.00 — the firm
                needs to know it is unconfigured rather than worthless. */}
            {row.rateUnset ? (
              <StatusPill tone="warning">Rate unset</StatusPill>
            ) : (
              <Text
                fontSize="13px"
                fontWeight="600"
                color={row.amount ? "#6a5cc7" : "fg.muted"}
              >
                {row.amount ? formatCurrency(row.amount) : "—"}
              </Text>
            )}
          </Table.Cell>

          <Table.Cell py={REPORT_CELL_PY} whiteSpace="nowrap">
            <StatusPill tone={TIME_STATUS_TONE[row.status]}>
              {TIME_STATUS_LABEL[row.status]}
            </StatusPill>
          </Table.Cell>

          <Table.Cell py={REPORT_CELL_PY} whiteSpace="nowrap">
            {row.status === "pending" ? (
              <Flex gap="6px" justify="flex-end">
                <OutlineButton
                  disabled={isMutating}
                  onClick={() => onReject(row)}
                >
                  Reject
                </OutlineButton>
                <BrandButton
                  disabled={isMutating}
                  onClick={() => onApprove(row)}
                >
                  Approve
                </BrandButton>
              </Flex>
            ) : (
              <Text fontSize="11px" color="fg.muted">
                {row.invoicedAt ? "Invoiced" : "—"}
              </Text>
            )}
          </Table.Cell>
        </Table.Row>
      ))}

      {totals && (
        <Table.Row bg="bg.muted">
          <Table.Cell py="12px" colSpan={3}>
            <Text fontSize="12px" color="fg.muted">
              {rows.length} entr{rows.length === 1 ? "y" : "ies"}
            </Text>
          </Table.Cell>
          <Table.Cell py="12px">
            <Text fontSize="12px" fontWeight="700" color="#3b82c4">
              {totals.hours.toFixed(1)} hrs
            </Text>
          </Table.Cell>
          <Table.Cell py="12px">
            <Text fontSize="12px" fontWeight="700" color="#6a5cc7">
              {formatCurrency(totals.amount)}
            </Text>
          </Table.Cell>
          <Table.Cell py="12px" colSpan={2} />
        </Table.Row>
      )}
    </ReportTable>
  );
}
