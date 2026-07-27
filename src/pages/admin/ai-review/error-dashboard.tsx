import {
  useCaseReviewIssues,
  useCaseReviewStats,
  useExportReport,
  useResolutionLog,
  useRunFullScan,
} from "@/hooks/use-case-review";
import {
  BrandButton,
  IntakeListSkeleton,
  OutlineButton,
  StatusPill,
} from "@/components/ui/intake-ui";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  Box,
  Flex,
  Grid,
  HStack,
  Menu,
  Portal,
  Table,
  Text,
} from "@chakra-ui/react";
import {
  AlertCircle,
  AlertTriangle,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  Download,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { IssueCard } from "./components/issue-card";
import { StatTile } from "./components/stat-tile";

const formatScanTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

function ExportMenu({
  report,
  label,
}: {
  report: "issues" | "resolution-log";
  label: string;
}) {
  const exportReport = useExportReport();
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <OutlineButton loading={exportReport.isPending}>
          <HStack gap="6px">
            <Download size={14} />
            <Text>{label}</Text>
          </HStack>
        </OutlineButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item
              value="csv"
              onClick={() => exportReport.mutate({ report, format: "csv" })}
            >
              Export as CSV
            </Menu.Item>
            <Menu.Item
              value="pdf"
              onClick={() => exportReport.mutate({ report, format: "pdf" })}
            >
              Export as PDF
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}

export function AiReviewDashboardPage() {
  useDocumentTitle("AI case review");
  const stats = useCaseReviewStats();
  const issues = useCaseReviewIssues({ status: "open" });
  const runScan = useRunFullScan();
  const [showResolved, setShowResolved] = useState(false);
  const resolved = useResolutionLog({ limit: 20 });

  const s = stats.data;
  const scanLine = s?.lastScan.at
    ? `Last scan: ${formatScanTime(s.lastScan.at)} · ${s.lastScan.mattersReviewed} matters reviewed · ${s.lastScan.issuesFound} issues found · ${s.lastScan.resolvedSince} resolved since`
    : "No scan has run yet";

  return (
    <Box pt="24px">
      <Flex justifyContent="space-between" alignItems="flex-start" gap="16px" flexWrap="wrap">
        <Box>
          <Text textStyle="heading">AI case review</Text>
          <Text color="fg.muted" mt="2px" fontSize="14px">
            Automated error detection across all active matters
          </Text>
        </Box>
        <HStack gap="8px">
          <OutlineButton
            loading={runScan.isPending}
            onClick={() => runScan.mutate()}
          >
            <HStack gap="6px">
              <RefreshCw size={14} />
              <Text>Run full scan</Text>
            </HStack>
          </OutlineButton>
          <ExportMenu report="issues" label="Export report" />
        </HStack>
      </Flex>

      <HStack mt="16px" gap="6px" color="fg.muted" fontSize="12px">
        <Bot size={14} />
        <Text>{scanLine}</Text>
      </HStack>

      <Grid
        mt="16px"
        templateColumns={{ base: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }}
        gap="16px"
      >
        <StatTile
          label="Critical issues"
          value={s?.criticalIssues ?? 0}
          caption="Immediate action required"
          tone="critical"
          icon={<AlertCircle size={16} />}
        />
        <StatTile
          label="Warnings"
          value={s?.warnings ?? 0}
          caption="Review recommended"
          tone="warning"
          icon={<AlertTriangle size={16} />}
        />
        <StatTile
          label="Matters affected"
          value={s?.mattersAffected ?? 0}
          caption={`Of ${s?.totalActiveMatters ?? 0} active matters`}
          tone="info"
          icon={<BriefcaseBusiness size={16} />}
        />
        <StatTile
          label="Resolved (30d)"
          value={s?.resolvedLast30Days ?? 0}
          caption="Successfully closed"
          tone="success"
          icon={<CheckCircle2 size={16} />}
        />
      </Grid>

      <Flex mt="28px" justifyContent="space-between" alignItems="flex-end">
        <Box>
          <Text fontSize="18px" fontWeight="600" color="fg">
            Active issues
          </Text>
          <Text fontSize="13px" color="fg.muted">
            Issues requiring attention, sorted by severity
          </Text>
        </Box>
        {s && (
          <Text fontSize="12px" color="fg.muted">
            {s.criticalIssues} critical · {s.warnings} warnings
          </Text>
        )}
      </Flex>

      <Box mt="16px">
        {issues.isLoading ? (
          <IntakeListSkeleton rows={3} />
        ) : issues.data && issues.data.data.length > 0 ? (
          <Flex direction="column" gap="16px">
            {issues.data.data.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </Flex>
        ) : (
          <Box
            border="1px dashed"
            borderColor="border"
            borderRadius="10px"
            p="40px"
            textAlign="center"
          >
            <CheckCircle2
              size={28}
              color="var(--chakra-colors-green-500)"
              style={{ margin: "0 auto" }}
            />
            <Text mt="8px" fontWeight="600" color="fg">
              No active issues
            </Text>
            <Text fontSize="13px" color="fg.muted">
              Every scanned matter is clear.
            </Text>
          </Box>
        )}
      </Box>

      <Flex mt="28px" justifyContent="space-between" alignItems="center">
        <Text fontSize="16px" fontWeight="600" color="fg">
          Recently resolved (last 30 days)
        </Text>
        <HStack gap="8px">
          {showResolved && (
            <ExportMenu report="resolution-log" label="Export" />
          )}
          <BrandButton onClick={() => setShowResolved((v) => !v)}>
            {showResolved
              ? "Hide resolved"
              : `Show resolved (${resolved.data?.summary.resolved ?? 0})`}
          </BrandButton>
        </HStack>
      </Flex>

      {showResolved && (
        <Box mt="14px" overflowX="auto">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row bg="bg.muted">
                {["Issue", "Case", "Resolved by", "Resolved date", "Action taken"].map(
                  (h) => (
                    <Table.ColumnHeader
                      key={h}
                      fontSize="10px"
                      letterSpacing="0.06em"
                      color="fg.muted"
                    >
                      {h.toUpperCase()}
                    </Table.ColumnHeader>
                  ),
                )}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {resolved.data?.data.map((row) => (
                <Table.Row key={row.id}>
                  <Table.Cell>{row.title}</Table.Cell>
                  <Table.Cell>
                    {row.client?.name ?? row.scenario.reference ?? "—"}
                  </Table.Cell>
                  <Table.Cell>{row.resolvedBy?.name ?? "—"}</Table.Cell>
                  <Table.Cell>
                    {row.resolvedAt
                      ? new Date(row.resolvedAt).toLocaleDateString()
                      : "—"}
                  </Table.Cell>
                  <Table.Cell>
                    {row.actionTaken ? (
                      <StatusPill tone="success">{row.actionTaken}</StatusPill>
                    ) : (
                      "—"
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}
    </Box>
  );
}
