import type { InvoiceListRow, InvoiceListTotals } from "@/api/finance";
import { BrandButton, OutlineButton, StatusPill } from "@/components/ui/intake-ui";
import { REPORT_CELL_PY, ReportTable } from "@/components/ui/report-table";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { Box, Center, Flex, Spinner, Table, Text, VStack } from "@chakra-ui/react";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE } from "../data";

const HEADERS = [
  "Invoice #",
  "Client",
  "Matter",
  "Operating",
  "Trust",
  "Total",
  "Status",
  "Due date",
  "Action",
];

/**
 * Row actions follow the status the SERVER assigned, never a client-side date
 * comparison — the firm's timezone decides what "overdue" means, and the two
 * would disagree either side of midnight.
 *
 *   paid                → View
 *   unpaid, due ahead   → Record payment
 *   past due            → Follow up + Pay
 */
function RowActions({
  row,
  onView,
  onRecordPayment,
  onFollowUp,
}: {
  row: InvoiceListRow;
  onView: (row: InvoiceListRow) => void;
  onRecordPayment: (row: InvoiceListRow) => void;
  onFollowUp: (row: InvoiceListRow) => void;
}) {
  if (row.status === "paid" || row.status === "void") {
    return <OutlineButton onClick={() => onView(row)}>View</OutlineButton>;
  }

  if (row.status === "overdue") {
    return (
      <Flex gap="6px" justify="flex-end">
        <OutlineButton onClick={() => onFollowUp(row)}>Follow up</OutlineButton>
        <BrandButton onClick={() => onRecordPayment(row)}>Pay</BrandButton>
      </Flex>
    );
  }

  return (
    <BrandButton onClick={() => onRecordPayment(row)}>Record payment</BrandButton>
  );
}

export function InvoicesTable({
  rows,
  totals,
  isLoading,
  trustVisible,
  onView,
  onRecordPayment,
  onFollowUp,
}: {
  rows: InvoiceListRow[];
  totals: InvoiceListTotals | undefined;
  isLoading: boolean;
  trustVisible: boolean;
  onView: (row: InvoiceListRow) => void;
  onRecordPayment: (row: InvoiceListRow) => void;
  onFollowUp: (row: InvoiceListRow) => void;
}) {
  const headers = trustVisible ? HEADERS : HEADERS.filter((h) => h !== "Trust");

  if (isLoading) {
    return (
      <Box border="1px solid" borderColor="border" borderRadius="10px">
        <Center py={16}>
          <Spinner />
        </Center>
      </Box>
    );
  }

  if (rows.length === 0) {
    return (
      <Box border="1px solid" borderColor="border" borderRadius="10px">
        <VStack py={16} gap={2} textAlign="center">
          <Text color="fg.muted" textStyle="lg" fontWeight="600">
            No invoices found
          </Text>
          <Text color="fg.subtle" textStyle="body-sm">
            Try adjusting your filters or search terms.
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <ReportTable headers={headers}>
      {rows.map((row) => {
        const partialDue = row.status === "partial" && row.balanceDue > 0;
        return (
          <Table.Row key={row.id}>
            <Table.Cell py={REPORT_CELL_PY}>
              <Text fontSize="13px" fontWeight="600">
                {row.invoiceNumber}
              </Text>
              <Text fontSize="11px" color="fg.muted">
                {formatDate(row.issueDate)}
              </Text>
            </Table.Cell>

            <Table.Cell py={REPORT_CELL_PY}>
              <Text fontSize="13px" fontWeight="600">
                {row.clientName}
              </Text>
              {row.clientEmail && (
                <Text fontSize="11px" color="fg.muted">
                  {row.clientEmail}
                </Text>
              )}
            </Table.Cell>

            <Table.Cell py={REPORT_CELL_PY}>
              <Text fontSize="12px" color="fg.muted">
                {row.caseNumber ?? "—"}
              </Text>
              {row.caseTypeLabel && (
                <Box mt="4px">
                  <StatusPill tone="success">{row.caseTypeLabel}</StatusPill>
                </Box>
              )}
            </Table.Cell>

            <Table.Cell py={REPORT_CELL_PY}>
              <Text fontSize="13px" fontWeight="600" color="#6a5cc7">
                {formatCurrency(row.operatingAmount)}
              </Text>
            </Table.Cell>

            {trustVisible && (
              <Table.Cell py={REPORT_CELL_PY}>
                <Text
                  fontSize="13px"
                  fontWeight="600"
                  color={row.trustAmount ? "#2e9e6b" : "fg.muted"}
                >
                  {row.trustAmount ? formatCurrency(row.trustAmount) : "—"}
                </Text>
              </Table.Cell>
            )}

            <Table.Cell py={REPORT_CELL_PY}>
              <Text fontSize="13px" fontWeight="700">
                {formatCurrency(row.totalAmount)}
              </Text>
              {partialDue && (
                <Text fontSize="11px" color="#b5851f">
                  {formatCurrency(row.balanceDue)} due
                </Text>
              )}
            </Table.Cell>

            <Table.Cell py={REPORT_CELL_PY}>
              <StatusPill tone={INVOICE_STATUS_TONE[row.status]}>
                {INVOICE_STATUS_LABEL[row.status]}
              </StatusPill>
            </Table.Cell>

            <Table.Cell py={REPORT_CELL_PY}>
              <Text
                fontSize="12px"
                color={row.status === "overdue" ? "#d64545" : "fg.muted"}
                fontWeight={row.status === "overdue" ? "600" : "400"}
              >
                {formatDate(row.dueDate)}
              </Text>
            </Table.Cell>

            <Table.Cell py={REPORT_CELL_PY} textAlign="right">
              <RowActions
                row={row}
                onView={onView}
                onRecordPayment={onRecordPayment}
                onFollowUp={onFollowUp}
              />
            </Table.Cell>
          </Table.Row>
        );
      })}

      {totals && (
        <Table.Row bg="bg.muted">
          <Table.Cell py="12px" colSpan={3}>
            <Text fontSize="12px" color="fg.muted">
              {rows.length} invoice{rows.length === 1 ? "" : "s"}
            </Text>
          </Table.Cell>
          <Table.Cell py="12px" colSpan={trustVisible ? 6 : 5}>
            <Flex gap="16px" justify="flex-end" flexWrap="wrap">
              <Text fontSize="12px" color="#6a5cc7">
                Operating: <b>{formatCurrency(totals.operating)}</b>
              </Text>
              {trustVisible && (
                <Text fontSize="12px" color="#2e9e6b">
                  Trust: <b>{formatCurrency(totals.trust)}</b>
                </Text>
              )}
              <Text fontSize="12px" color="fg">
                Total: <b>{formatCurrency(totals.total)}</b>
              </Text>
            </Flex>
          </Table.Cell>
        </Table.Row>
      )}
    </ReportTable>
  );
}
