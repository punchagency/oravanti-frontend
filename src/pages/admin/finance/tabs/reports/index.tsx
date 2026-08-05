import { StatTile } from "@/components/ui/stat-tile";
import { useFinanceReport } from "@/hooks/use-finance";
import { formatCurrency, formatPercent } from "@/utils/currency";
import { Box, Center, Grid, Spinner, Text } from "@chakra-ui/react";
import { CheckCircle2, Landmark, ShieldCheck, TrendingUp } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import {
  AccountSplitCard,
  CollectionStatusCard,
  PracticeAreaTable,
  ReceivableAgingCard,
  TrustReconciliationCard,
} from "../../components/report-cards";
import { currentMonth } from "../../data";

export default function ReportsTab() {
  // Same URL key the shell's month selector writes, so the two cannot disagree.
  const [month] = useQueryState("month", parseAsString.withDefault(currentMonth()));
  const { data: report, isLoading } = useFinanceReport(month);

  if (isLoading || !report) {
    return (
      <Center py={20}>
        <Spinner />
      </Center>
    );
  }

  const trustVisible = report.accountSplit.trust !== null;

  return (
    <Box>
      <Grid
        templateColumns={{ base: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }}
        gap="16px"
      >
        <StatTile
          variant="icon-top"
          label="Total revenue invoiced"
          value={formatCurrency(report.summary.totalRevenue)}
          caption={`${report.summary.invoiceCount} invoices`}
          icon={<TrendingUp size={15} />}
          tone="info"
          mutedValue
          progress={100}
        />
        <StatTile
          variant="icon-top"
          label="Revenue collected"
          value={formatCurrency(report.summary.collected)}
          caption={`${formatPercent(report.summary.collectionRate)} collection rate`}
          icon={<CheckCircle2 size={15} />}
          tone="success"
          progress={report.summary.collectionRate}
        />
        <StatTile
          variant="icon-top"
          label="Operating account"
          value={formatCurrency(report.accountSplit.operating)}
          caption="Attorney & legal fees"
          icon={<Landmark size={15} />}
          tone="info"
          mutedValue
          progress={report.accountSplit.operatingPercent}
        />
        {/* Hidden outright without IOLTA access — a $0.00 tile would read as
            "no client funds", which is a different claim from "not visible". */}
        {trustVisible && (
          <StatTile
            variant="icon-top"
            label="Trust account (IOLTA)"
            value={formatCurrency(report.accountSplit.trust)}
            caption="Filing fees held for clients"
            icon={<ShieldCheck size={15} />}
            tone="success"
            progress={report.accountSplit.trustPercent ?? 0}
          />
        )}
      </Grid>

      <Grid
        templateColumns={{ base: "1fr", xl: "1fr 1fr" }}
        gap="16px"
        mt="20px"
        alignItems="start"
      >
        <AccountSplitCard split={report.accountSplit} />
        <CollectionStatusCard
          summary={report.summary}
          rows={report.collectionStatus}
        />
      </Grid>

      <Box mt="20px">
        <PracticeAreaTable rows={report.byPracticeArea} />
      </Box>

      <Grid
        templateColumns={{ base: "1fr", xl: "1fr 1fr" }}
        gap="16px"
        mt="20px"
        alignItems="start"
      >
        <ReceivableAgingCard aging={report.aging} />
        {report.trustReconciliation ? (
          <TrustReconciliationCard trust={report.trustReconciliation} />
        ) : (
          <Box
            p="18px"
            borderRadius="10px"
            border="1px dashed"
            borderColor="border"
          >
            <Text fontSize="13px" fontWeight="600">
              Trust account reconciliation
            </Text>
            <Text fontSize="12px" color="fg.muted" mt="4px">
              You do not have access to trust (IOLTA) account data. Ask a firm
              admin if you need it.
            </Text>
          </Box>
        )}
      </Grid>
    </Box>
  );
}
