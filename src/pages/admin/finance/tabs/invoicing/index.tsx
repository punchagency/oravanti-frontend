import type {
  AccountFilter,
  InvoiceListRow,
  InvoiceStatusFilter,
} from "@/api/finance";
import { FilterCombobox } from "@/components/ui/filter-combobox";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { StatTile } from "@/components/ui/stat-tile";
import {
  useFinanceActivity,
  useInvoiceAging,
  useInvoiceStats,
  useInvoices,
} from "@/hooks/use-finance";
import { usePaginationQueryStates } from "@/hooks/usePaginationQueryStates";
import { formatCurrency, percentOf } from "@/utils/currency";
import { Box, Checkbox, Flex, Grid, Input, Text } from "@chakra-ui/react";
import { useDebounce } from "@uidotdev/usehooks";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Search,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { parseAsBoolean, parseAsString, useQueryState } from "nuqs";
import { AgingSummaryCard } from "../../components/aging-summary-card";
import { InvoiceDetailDialog } from "../../components/dialogs/invoice-detail-dialog";
import { PaymentFollowUpDialog } from "../../components/dialogs/payment-follow-up-dialog";
import { RecordPaymentDialog } from "../../components/dialogs/record-payment-dialog";
import { InvoiceFormDialog } from "../../components/dialogs/invoice-form-dialog";
import { RescheduleDialog } from "../../components/dialogs/reschedule-dialog";
import { ExtendDueDateDialog } from "../../components/dialogs/extend-due-date-dialog";
import { VoidInvoiceDialog } from "../../components/dialogs/void-invoice-dialog";
import {
  SendInvoiceDialog,
  type SendableInvoice,
} from "../../components/dialogs/send-invoice-dialog";
import { InvoicesTable } from "../../components/invoices-table";
import { RecentActivityCard } from "../../components/recent-activity-card";
import { ACCOUNT_OPTIONS, INVOICE_STATUS_OPTIONS } from "../../data";
import { SurfaceCard } from "@/components/ui/intake-ui";

export default function InvoicingTab() {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault("all"),
  );
  const [account, setAccount] = useQueryState(
    "account",
    parseAsString.withDefault("all"),
  );
  // Only meaningful on "all" — every other bucket names a non-draft state.
  const [includeDrafts, setIncludeDrafts] = useQueryState(
    "drafts",
    parseAsBoolean.withDefault(false),
  );
  const { currentPage, limit, setPagination } = usePaginationQueryStates();
  const debouncedSearch = useDebounce(search, 300);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<InvoiceListRow | null>(
    null,
  );
  const [followUpTarget, setFollowUpTarget] = useState<InvoiceListRow | null>(
    null,
  );
  const [sendTarget, setSendTarget] = useState<SendableInvoice | null>(null);
  // The whole row, not just an id: the confirmation names the party and the
  // amount, and asking for the invoice again to render a warning would leave
  // the dialog briefly claiming to void something it cannot yet describe.
  const [voidTarget, setVoidTarget] = useState<InvoiceListRow | null>(null);
  const [extendTarget, setExtendTarget] = useState<InvoiceListRow | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: status as InvoiceStatusFilter,
      account: account as AccountFilter,
      includeDrafts,
      page: currentPage,
      limit,
    }),
    [debouncedSearch, status, account, includeDrafts, currentPage, limit],
  );

  const invoices = useInvoices(params);
  const statsQuery = useInvoiceStats();
  const aging = useInvoiceAging();
  const activity = useFinanceActivity();

  const stats = statsQuery.data?.stats;
  const trustVisible = statsQuery.data?.restrictions.trust !== "no_access";

  // Any filter change invalidates the current page number.
  const withPageReset = useCallback(
    (fn: (value: string) => void) => (value: string) => {
      fn(value);
      void setPagination({ currentPage: 1 });
    },
    [setPagination],
  );

  const onSearch = withPageReset((v) => void setSearch(v));
  const onStatus = withPageReset((v) => void setStatus(v || "all"));
  const onAccount = withPageReset((v) => void setAccount(v || "all"));

  return (
    <Box>
      {/* The banner that stood here announced consultation fee tracking as
          "coming soon" and sent firms to Analytics → Revenue. Both halves were
          wrong: a consultation fee is raised as a real invoice against the lead
          (`raiseConsultationInvoice`) and is listed below like any other, and
          the page it pointed at is itself a ComingSoonPage. Removed rather than
          reworded — there is nothing to announce about a feature that works. */}
      <Grid
        templateColumns={{ base: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }}
        gap="16px"
        mt="20px"
      >
        <StatTile
          label="Total invoiced"
          value={stats?.invoiceCount ?? 0}
          caption={`${formatCurrency(stats?.totalInvoiced ?? 0)} total billed`}
          icon={<FileText size={15} />}
          tone="info"
          mutedValue
          progress={100}
        />
        <StatTile
          label="Collected"
          value={formatCurrency(stats?.collected ?? 0)}
          caption={`${stats?.collectedCount ?? 0} invoices paid`}
          icon={<CheckCircle2 size={15} />}
          tone="success"
          progress={percentOf(stats?.collected ?? 0, stats?.totalInvoiced ?? 0)}
        />
        <StatTile
          label="Outstanding"
          value={formatCurrency(stats?.outstanding ?? 0)}
          caption={`${stats?.outstandingCount ?? 0} invoices pending`}
          icon={<Clock size={15} />}
          tone="warning"
          progress={percentOf(
            stats?.outstanding ?? 0,
            stats?.totalInvoiced ?? 0,
          )}
        />
        <StatTile
          label="Overdue invoices"
          value={stats?.overdueCount ?? 0}
          caption={`${formatCurrency(stats?.pastDueAmount ?? 0)} past due`}
          icon={<AlertTriangle size={15} />}
          tone="critical"
          progress={percentOf(
            stats?.pastDueAmount ?? 0,
            stats?.totalInvoiced ?? 0,
          )}
        />
      </Grid>

      <Grid
        templateColumns={{ base: "1fr", xl: "minmax(0, 2.2fr) minmax(0, 1fr)" }}
        gap="16px"
        mt="20px"
        alignItems="start"
      >
        {/* p="0" so the table can reach the card's edges as it does in the
            design. Everything that is NOT the table pads itself back in. */}
        {/* overflow hidden so the table's square bottom corners are clipped to
            the card's radius — with no padding it now reaches the edge. Doing
            it here means no child has to know about the card's corners. */}
        <SurfaceCard p="0" overflow="hidden">
          <Flex
            justify="space-between"
            align="center"
            gap="12px"
            flexWrap="wrap"
            p="18px"
            pb="14px"
          >
            <Text textStyle="label" fontWeight="700">
              All invoices
            </Text>

            <Flex gap="8px" align="center" flexWrap="wrap">
              <Box position="relative">
                <Box
                  position="absolute"
                  left="3"
                  top="50%"
                  transform="translateY(-50%)"
                  color="fg.muted"
                  pointerEvents="none"
                >
                  <Search size={16} />
                </Box>
                <Input
                  pl={9}
                  size="sm"
                  bg="bg.input"
                  borderColor="border.input"
                  placeholder="Search invoices…"
                  value={search}
                  onChange={(e) => onSearch(e.target.value)}
                  w={{ base: "full", sm: "200px" }}
                />
              </Box>

              <FilterCombobox
                options={INVOICE_STATUS_OPTIONS}
                value={status === "all" ? "" : status}
                onChange={onStatus}
                placeholder="All statuses"
                noun="status"
              />
              <FilterCombobox
                options={ACCOUNT_OPTIONS}
                value={account === "all" ? "" : account}
                onChange={onAccount}
                placeholder="All accounts"
                noun="account"
              />

              {status === "all" && (
                <Checkbox.Root
                  size="sm"
                  checked={includeDrafts}
                  onCheckedChange={(d) => {
                    void setIncludeDrafts(Boolean(d.checked) || null);
                    void setPagination({ currentPage: 1 });
                  }}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label
                    fontSize="12px"
                    color="fg.muted"
                    whiteSpace="nowrap"
                  >
                    Include drafts
                  </Checkbox.Label>
                </Checkbox.Root>
              )}

              <Text fontSize="12px" color="fg.muted" whiteSpace="nowrap">
                {invoices.data?.pagination.total ?? 0} invoices
              </Text>
            </Flex>
          </Flex>

          {status === "draft" && (
            <Text fontSize="11px" color="fg.muted" px="18px" mb="10px">
              Drafts have not been sent to the client and are excluded from the
              totals above — they are not invoiced revenue until delivered.
            </Text>
          )}

          <InvoicesTable
            rows={invoices.data?.data ?? []}
            totals={invoices.data?.totals}
            isLoading={invoices.isLoading}
            trustVisible={trustVisible}
            onView={(row) => setDetailId(row.id)}
            onRecordPayment={setPaymentTarget}
            onFollowUp={setFollowUpTarget}
            onSend={(row) =>
              setSendTarget({
                id: row.id,
                invoiceNumber: row.invoiceNumber,
                clientName: row.party.name,
                clientEmail: row.party.email,
                isLead: row.party.type === "lead",
                totalAmount: row.totalAmount,
                dueDate: row.dueDate,
              })
            }
            onEdit={(row) => setEditId(row.id)}
            onReschedule={(row) => setRescheduleId(row.id)}
            onVoid={setVoidTarget}
            onExtend={setExtendTarget}
          />

          {invoices.data && invoices.data.pagination.total > limit && (
            <Box p="18px">
              <PaginationControls
                total={invoices.data.pagination.total}
                currentPage={currentPage}
                limit={limit}
                onPageChange={(page) =>
                  void setPagination({ currentPage: page })
                }
                onLimitChange={(l) =>
                  void setPagination({ currentPage: 1, limit: l })
                }
              />
            </Box>
          )}
        </SurfaceCard>

        <Flex direction="column" gap="16px">
          <AgingSummaryCard
            buckets={aging.data ?? []}
            isLoading={aging.isLoading}
          />
          <RecentActivityCard
            entries={activity.data ?? []}
            isLoading={activity.isLoading}
          />
        </Flex>
      </Grid>

      <InvoiceDetailDialog
        invoiceId={detailId}
        open={detailId !== null}
        onOpenChange={(d) => !d.open && setDetailId(null)}
      />
      <RecordPaymentDialog
        invoice={paymentTarget}
        open={paymentTarget !== null}
        onOpenChange={(d) => !d.open && setPaymentTarget(null)}
      />
      <PaymentFollowUpDialog
        invoice={followUpTarget}
        open={followUpTarget !== null}
        onOpenChange={(d) => !d.open && setFollowUpTarget(null)}
      />
      <SendInvoiceDialog
        invoice={sendTarget}
        open={sendTarget !== null}
        onOpenChange={(d) => !d.open && setSendTarget(null)}
      />
      <RescheduleDialog
        invoiceId={rescheduleId}
        open={rescheduleId !== null}
        onOpenChange={(d) => !d.open && setRescheduleId(null)}
      />
      <ExtendDueDateDialog
        invoice={extendTarget}
        open={extendTarget !== null}
        onOpenChange={(d) => !d.open && setExtendTarget(null)}
      />
      <VoidInvoiceDialog
        invoice={voidTarget}
        open={voidTarget !== null}
        onOpenChange={(d) => !d.open && setVoidTarget(null)}
      />
      <InvoiceFormDialog
        invoiceId={editId}
        open={editId !== null}
        onOpenChange={(d) => !d.open && setEditId(null)}
        onReadyToSend={(invoice) =>
          setSendTarget({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            clientName: invoice.party.name,
            clientEmail: invoice.party.email,
            isLead: invoice.party.type === "lead",
            totalAmount: invoice.totals.total,
            dueDate: invoice.dueDate,
          })
        }
      />
    </Box>
  );
}
