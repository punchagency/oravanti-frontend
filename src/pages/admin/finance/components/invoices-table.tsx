import type { InvoiceListRow, InvoiceListTotals } from "@/api/finance";
import {
  BrandButton,
  OutlineButton,
  StatusPill,
} from "@/components/ui/intake-ui";
import { REPORT_CELL_PY, ReportTable } from "@/components/ui/report-table";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import {
  Box,
  Center,
  Flex,
  Spinner,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
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
 *   draft               → Edit + Send to client
 *   paid / void         → View
 *   past due            → Follow up + Pay
 *   otherwise           → Record payment
 */
function RowActions({
  row,
  onView,
  onRecordPayment,
  onFollowUp,
  onSend,
  onEdit,
}: {
  row: InvoiceListRow;
  onView: (row: InvoiceListRow) => void;
  onRecordPayment: (row: InvoiceListRow) => void;
  onFollowUp: (row: InvoiceListRow) => void;
  onSend: (row: InvoiceListRow) => void;
  onEdit: (row: InvoiceListRow) => void;
}) {
  // A draft has not reached the client, so it is the one state where changing
  // what the invoice charges is still honest — and where recording a payment
  // against it is refused by the server.
  if (row.status === "draft") {
    return (
      <Flex gap="6px">
        <OutlineButton onClick={() => onEdit(row)}>Edit</OutlineButton>
        <BrandButton onClick={() => onSend(row)}>Send</BrandButton>
      </Flex>
    );
  }

  if (row.status === "paid" || row.status === "void") {
    return <OutlineButton onClick={() => onView(row)}>View</OutlineButton>;
  }

  if (row.status === "overdue") {
    return (
      <Flex gap="6px">
        <OutlineButton onClick={() => onFollowUp(row)}>Follow up</OutlineButton>
        <BrandButton onClick={() => onRecordPayment(row)}>Pay</BrandButton>
      </Flex>
    );
  }

  return (
    <BrandButton onClick={() => onRecordPayment(row)}>
      Record payment
    </BrandButton>
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
  onSend,
  onEdit,
}: {
  rows: InvoiceListRow[];
  totals: InvoiceListTotals | undefined;
  isLoading: boolean;
  trustVisible: boolean;
  onView: (row: InvoiceListRow) => void;
  onRecordPayment: (row: InvoiceListRow) => void;
  onFollowUp: (row: InvoiceListRow) => void;
  onSend: (row: InvoiceListRow) => void;
  onEdit: (row: InvoiceListRow) => void;
}) {
  const headers = trustVisible ? HEADERS : HEADERS.filter((h) => h !== "Trust");

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
            No invoices found
          </Text>
          <Text color="fg.subtle" textStyle="body-sm">
            Try adjusting your filters or search terms.
          </Text>
        </VStack>
      </Box>
    );
  }

  // flush: the card draws the frame and clips the corners, so the table needs
  // no border of its own. The header band's own background separates it from
  // the controls above.
  return (
    <ReportTable headers={headers} flush>
      {rows.map((row) => {
        const partialDue = row.status === "partial" && row.balanceDue > 0;
        return (
          <Table.Row key={row.id}>
            <Table.Cell py={REPORT_CELL_PY} whiteSpace="nowrap">
              <Text fontSize="13px" fontWeight="600">
                {row.invoiceNumber}
              </Text>
              <Text fontSize="11px" color="fg.muted">
                {formatDate(row.issueDate)}
              </Text>
            </Table.Cell>

            <Table.Cell py={REPORT_CELL_PY} whiteSpace="nowrap">
              <Box maxW="150px">
                <Text fontSize="13px" fontWeight="600" textWrap="auto">
                  {row.clientName}
                </Text>
                {row.clientEmail && (
                  <Text fontSize="11px" color="fg.muted" textWrap="auto">
                    {row.clientEmail}
                  </Text>
                )}
              </Box>
            </Table.Cell>

            <Table.Cell py={REPORT_CELL_PY}>
              {/* The matter column is the flexible one, so it is the one that
                  gets capped. A Box rather than maxW on the cell: table
                  auto-layout treats a cell's max-width as a hint, but it has
                  to respect a constrained child. Both the reference and the
                  case-type label wrap here, exactly as they do in the design —
                  held on one line they steal the width DUE DATE and ACTION
                  need, which is what was pushing the action button out of the
                  card. */}
              <Box maxW="150px">
                <Text fontSize="12px" color="fg.muted" lineHeight="1.35">
                  {row.caseNumber ?? "—"}
                </Text>
                {row.caseTypeLabel && (
                  <Box mt="4px">
                    <StatusPill tone="success" wrap>
                      {row.caseTypeLabel}
                    </StatusPill>
                  </Box>
                )}
              </Box>
            </Table.Cell>

            <Table.Cell py={REPORT_CELL_PY} whiteSpace="nowrap">
              <Text fontSize="13px" fontWeight="600" color="#6a5cc7">
                {formatCurrency(row.operatingAmount)}
              </Text>
            </Table.Cell>

            {trustVisible && (
              <Table.Cell py={REPORT_CELL_PY} whiteSpace="nowrap">
                <Text
                  fontSize="13px"
                  fontWeight="600"
                  color={row.trustAmount ? "#2e9e6b" : "fg.muted"}
                >
                  {row.trustAmount ? formatCurrency(row.trustAmount) : "—"}
                </Text>
              </Table.Cell>
            )}

            <Table.Cell py={REPORT_CELL_PY} whiteSpace="nowrap">
              <Text fontSize="13px" fontWeight="700">
                {formatCurrency(row.totalAmount)}
              </Text>
              {partialDue && (
                <Text fontSize="11px" color="#b5851f">
                  {formatCurrency(row.balanceDue)} due
                </Text>
              )}
            </Table.Cell>

            <Table.Cell py={REPORT_CELL_PY} whiteSpace="nowrap">
              <StatusPill tone={INVOICE_STATUS_TONE[row.status]}>
                {INVOICE_STATUS_LABEL[row.status]}
              </StatusPill>
            </Table.Cell>

            <Table.Cell py={REPORT_CELL_PY} whiteSpace="nowrap">
              <Text
                fontSize="12px"
                color={row.status === "overdue" ? "#d64545" : "fg.muted"}
                fontWeight={row.status === "overdue" ? "600" : "400"}
              >
                {formatDate(row.dueDate)}
              </Text>
            </Table.Cell>

            <Table.Cell
              py={REPORT_CELL_PY}
              whiteSpace="nowrap"
            >
              <RowActions
                row={row}
                onView={onView}
                onRecordPayment={onRecordPayment}
                onFollowUp={onFollowUp}
                onSend={onSend}
                onEdit={onEdit}
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
            {/* Drafts can be on screen but are never in the totals beside this,
                because they are not invoiced revenue. Saying so is what stops
                the two figures looking like they disagree. */}
            {totals.draftCount > 0 && (
              <Text fontSize="11px" color="fg.subtle">
                includes {totals.draftCount} draft
                {totals.draftCount === 1 ? "" : "s"}, not counted in the totals
              </Text>
            )}
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
