import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import { FormSelect } from "@/components/ui/form-select";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  useFinanceReport,
  useInvoiceStats,
  useTimeBillingStats,
} from "@/hooks/use-finance";
import {
  exportFinanceReport,
  exportInvoices,
  exportTimeEntries,
} from "@/api/finance";
import { formatCurrency, formatHours, formatPercent } from "@/utils/currency";
import { Box, Flex, ScrollArea, Tabs, Text } from "@chakra-ui/react";
import { Download, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { parseAsString, useQueryState } from "nuqs";
import { Outlet, useLocation, useNavigate } from "react-router";
import { AccountBanner } from "./components/account-banner";
import { SummaryChips, type SummaryChip } from "./components/summary-chips";
import { InvoiceFormDialog } from "./components/dialogs/invoice-form-dialog";
import {
  SendInvoiceDialog,
  type SendableInvoice,
} from "./components/dialogs/send-invoice-dialog";
import {
  buildMonthOptions,
  CHIP_COLORS,
  currentMonth,
  DEFAULT_TAB,
  tabsConfig,
} from "./data";

/**
 * The Finance shell: page header, the operating/trust banner (Invoicing only),
 * a per-tab chip row, and the route-synced tab bar.
 *
 * All three stats hooks are declared unconditionally and gated by `enabled`,
 * because hooks cannot be conditional. They share the query cache with the tab
 * bodies, so nothing is fetched twice.
 */
export function FinancePage() {
  useDocumentTitle("Finance - Oravanti");
  const navigate = useNavigate();
  const location = useLocation();

  const segments = location.pathname.replace(/\/+$/, "").split("/");
  const last = segments[segments.length - 1];
  const currentTab = tabsConfig.some((t) => t.value === last)
    ? (last as (typeof tabsConfig)[number]["value"])
    : DEFAULT_TAB;

  // Shared with the Reports tab through the URL, so a linked month survives a
  // refresh and the shell's selector and the tab body cannot disagree.
  const [month, setMonth] = useQueryState(
    "month",
    parseAsString.withDefault(currentMonth()),
  );
  const monthOptions = useMemo(() => buildMonthOptions(), []);

  const [newInvoiceOpen, setNewInvoiceOpen] = useState(false);
  const [sendTarget, setSendTarget] = useState<SendableInvoice | null>(null);

  const invoiceStats = useInvoiceStats();
  const timeStats = useTimeBillingStats();
  const report = useFinanceReport(month);

  const chips: SummaryChip[] = useMemo(() => {
    if (currentTab === "invoicing") {
      const s = invoiceStats.data?.stats;
      if (!s) return [];
      return [
        {
          label: "Operating Account",
          value: formatCurrency(s.operatingTotal),
          dot: CHIP_COLORS.purple,
        },
        // Withheld rather than shown as zero when the caller has no IOLTA access.
        ...(s.trustTotal !== null
          ? [
              {
                label: "Trust Account",
                value: formatCurrency(s.trustTotal),
                dot: CHIP_COLORS.green,
              },
            ]
          : []),
        {
          label: "Collected",
          value: formatCurrency(s.collected),
          dot: CHIP_COLORS.green,
        },
        {
          label: "Outstanding",
          value: formatCurrency(s.outstanding),
          dot: CHIP_COLORS.red,
        },
        {
          label: "Overdue",
          value: `${s.overdueCount} overdue`,
          dot: CHIP_COLORS.amber,
        },
      ];
    }

    if (currentTab === "time-billing") {
      const s = timeStats.data;
      if (!s) return [];
      return [
        {
          label: "Total hours logged",
          value: formatHours(s.hoursLogged),
          dot: CHIP_COLORS.blue,
        },
        {
          label: "Billable hours",
          value: formatHours(s.billableHours),
          dot: CHIP_COLORS.green,
        },
        {
          label: "Total earnings",
          value: formatCurrency(s.totalEarnings),
          dot: CHIP_COLORS.purple,
        },
        {
          label: "Approved",
          value: `${s.approvedCount} entries`,
          dot: CHIP_COLORS.green,
        },
        {
          label: "Pending approval",
          value: `${s.pendingCount} entries`,
          dot: CHIP_COLORS.amber,
        },
      ];
    }

    const r = report.data;
    if (!r) return [];
    return [
      {
        label: "Total revenue",
        value: formatCurrency(r.summary.totalRevenue),
        dot: CHIP_COLORS.purple,
      },
      {
        label: "Collected",
        value: formatCurrency(r.summary.collected),
        dot: CHIP_COLORS.green,
      },
      {
        label: "Outstanding",
        value: formatCurrency(r.summary.outstanding),
        dot: CHIP_COLORS.amber,
      },
      {
        label: "Overdue",
        value: formatCurrency(r.summary.overdue),
        dot: CHIP_COLORS.red,
      },
      {
        label: "Collection rate",
        value: formatPercent(r.summary.collectionRate),
        dot: CHIP_COLORS.blue,
      },
    ];
  }, [currentTab, invoiceStats.data, timeStats.data, report.data]);

  const handleExport = useCallback(() => {
    if (currentTab === "invoicing") return exportInvoices("csv");
    if (currentTab === "time-billing") return exportTimeEntries("csv");
    return exportFinanceReport("csv", month);
  }, [currentTab, month]);

  const handleMonthChange = useCallback(
    (value: string) => void setMonth(value),
    [setMonth],
  );

  return (
    <Box pt="24px" pb="56px">
      <Flex
        justifyContent="space-between"
        alignItems="flex-start"
        gap="16px"
        flexWrap="wrap"
      >
        <Box>
          <Text textStyle="heading">Finance</Text>
          <Text color="fg.muted" mt="2px" fontSize="14px">
            Invoicing, billing, trust accounts, and financial reports
          </Text>
        </Box>

        <Flex gap="8px" align="center">
          {currentTab === "reports" && (
            <Box minW="150px">
              <FormSelect
                options={monthOptions}
                value={month}
                onChange={handleMonthChange}
                placeholder="Select month"
              />
            </Box>
          )}
          {currentTab === "invoicing" && (
            <BrandButton onClick={() => setNewInvoiceOpen(true)}>
              <Plus size={14} />
              New invoice
            </BrandButton>
          )}
          <OutlineButton onClick={handleExport}>
            <Download size={14} />
            Export
          </OutlineButton>
        </Flex>
      </Flex>

      {currentTab === "invoicing" && invoiceStats.data && (
        <AccountBanner
          operatingTotal={invoiceStats.data.stats.operatingTotal}
          trustTotal={invoiceStats.data.stats.trustTotal}
        />
      )}

      <SummaryChips chips={chips} />

      <Tabs.Root
        value={currentTab}
        onValueChange={(e) => navigate(`/finance/${e.value}`)}
        variant="plain"
        w="full"
        mt="20px"
      >
        <ScrollArea.Root w="full" size="xs">
          <ScrollArea.Viewport>
            <ScrollArea.Content>
              <Tabs.List
                borderBottom="1px solid"
                borderColor="border.muted"
                gap={6}
              >
                {tabsConfig.map((tab) => (
                  <Tabs.Trigger
                    key={tab.value}
                    value={tab.value}
                    textStyle="label"
                    color="fg.muted"
                    pb="10px"
                    px={0}
                    borderRadius="none"
                    whiteSpace="nowrap"
                    borderBottom="2px solid transparent"
                    _selected={{
                      borderBottom: "2px solid",
                      borderColor: "brand.solid",
                    }}
                    _hover={{ color: "fg" }}
                    transition="all 0.2s"
                  >
                    {tab.label}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="horizontal" />
          <ScrollArea.Corner />
        </ScrollArea.Root>

        <Box pt="24px">
          <Outlet />
        </Box>
      </Tabs.Root>

      <InvoiceFormDialog
        invoiceId={null}
        open={newInvoiceOpen}
        onOpenChange={(d) => setNewInvoiceOpen(d.open)}
        // Saved as a draft either way; this only fires when the author asked to
        // go on and send it, and even then the send is confirmed against the
        // rendered PDF first.
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
      <SendInvoiceDialog
        invoice={sendTarget}
        open={sendTarget !== null}
        onOpenChange={(d) => !d.open && setSendTarget(null)}
      />
    </Box>
  );
}
