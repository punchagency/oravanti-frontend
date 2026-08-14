import type { InvoiceListRow, InvoiceListTotals } from "@/api/finance";
import { StatusPill } from "@/components/ui/intake-ui";
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
import {
  Ban,
  BellRing,
  CalendarClock,
  CreditCard,
  Eye,
  Pencil,
  Send,
} from "lucide-react";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE } from "../data";
import { RowActionMenu, type RowAction } from "./row-action-menu";

const HEADERS = [
  "Invoice #",
  "Billed to",
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
 *   draft               → Edit + Send to client + Void
 *   paid / void         → View
 *   past due            → Follow up + Pay + Void
 *   otherwise           → Reschedule/Plan + Record payment + Void
 *
 * Void is offered on anything live that has taken NO money. The server refuses
 * it once `amountPaid > 0` — voiding would drop received money out of every
 * report while the payments stayed on the ledger, and there is no reversing
 * entry to correct that with. Offering an action the server will reject is
 * worse than not offering it, so the same condition is applied here.
 *
 * Note `partial` implies a payment, so it never reaches the check.
 */
function voidAction(
  row: InvoiceListRow,
  onVoid: (row: InvoiceListRow) => void,
): RowAction[] {
  if (row.status === "void" || row.status === "paid") return [];
  if (row.amountPaid > 0) return [];
  return [
    {
      label: "Void invoice",
      icon: <Ban size={14} />,
      danger: true,
      onSelect: () => onVoid(row),
    },
  ];
}

function rowActions(
  row: InvoiceListRow,
  handlers: {
    onView: (row: InvoiceListRow) => void;
    onRecordPayment: (row: InvoiceListRow) => void;
    onFollowUp: (row: InvoiceListRow) => void;
    onSend: (row: InvoiceListRow) => void;
    onEdit: (row: InvoiceListRow) => void;
    onReschedule: (row: InvoiceListRow) => void;
    onVoid: (row: InvoiceListRow) => void;
  },
): RowAction[] {
  // A draft has not reached the client, so it is the one state where changing
  // what the invoice charges is still honest — and where recording a payment
  // against it is refused by the server.
  if (row.status === "draft") {
    return [
      {
        label: "Edit invoice",
        icon: <Pencil size={14} />,
        onSelect: () => handlers.onEdit(row),
      },
      {
        label: "Send to client",
        icon: <Send size={14} />,
        onSelect: () => handlers.onSend(row),
      },
      ...voidAction(row, handlers.onVoid),
    ];
  }

  if (row.status === "paid" || row.status === "void") {
    return [
      {
        label: "View invoice",
        icon: <Eye size={14} />,
        onSelect: () => handlers.onView(row),
      },
    ];
  }

  if (row.status === "overdue") {
    return [
      {
        label: "Follow up",
        icon: <BellRing size={14} />,
        onSelect: () => handlers.onFollowUp(row),
      },
      {
        label: "Record payment",
        icon: <CreditCard size={14} />,
        onSelect: () => handlers.onRecordPayment(row),
      },
      ...voidAction(row, handlers.onVoid),
    ];
  }

  return [
    // Renegotiating a plan is the point of offering one, so this is offered on
    // a live invoice — unlike editing its lines, which freeze on send.
    {
      label: row.schedule ? "Reschedule plan" : "Create payment plan",
      icon: <CalendarClock size={14} />,
      onSelect: () => handlers.onReschedule(row),
    },
    {
      label: "Record payment",
      icon: <CreditCard size={14} />,
      onSelect: () => handlers.onRecordPayment(row),
    },
    ...voidAction(row, handlers.onVoid),
  ];
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
  onReschedule,
  onVoid,
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
  onReschedule: (row: InvoiceListRow) => void;
  onVoid: (row: InvoiceListRow) => void;
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
                <Flex align="center" gap="6px">
                  <Text fontSize="13px" fontWeight="600" textWrap="auto">
                    {row.party.name}
                  </Text>
                  {/* Consultation fees and fee agreements are billed before the
                      lead retains the firm. Labelling it stops the list reading
                      as though they were already a client. */}
                  {row.party.type === "lead" && (
                    <StatusPill tone="neutral">Lead</StatusPill>
                  )}
                </Flex>
                {row.party.email && (
                  <Text fontSize="11px" color="fg.muted" textWrap="auto">
                    {row.party.email}
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
              {/* On a plan the header date is the FINAL instalment, so showing
                  it alone would read as "nothing is due until November" while
                  a payment is already late. The schedule line below carries
                  the date that actually matters. */}
              <Text
                fontSize="12px"
                color={row.status === "overdue" ? "#d64545" : "fg.muted"}
                fontWeight={row.status === "overdue" ? "600" : "400"}
              >
                {formatDate(row.dueDate)}
              </Text>
              {row.schedule && (
                <Text fontSize="11px" color="fg.subtle">
                  {row.schedule.paidCount} of {row.schedule.count} paid
                  {row.schedule.nextDueDate
                    ? ` · next ${formatDate(row.schedule.nextDueDate)}`
                    : ""}
                </Text>
              )}
            </Table.Cell>

            <Table.Cell py={REPORT_CELL_PY} whiteSpace="nowrap">
              <RowActionMenu
                ariaLabel={`Actions for invoice ${row.invoiceNumber}`}
                actions={rowActions(row, {
                  onView,
                  onRecordPayment,
                  onFollowUp,
                  onSend,
                  onEdit,
                  onReschedule,
                  onVoid,
                })}
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
