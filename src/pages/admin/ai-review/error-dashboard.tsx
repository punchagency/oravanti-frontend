import {
  useCaseReviewIssues,
  useCaseReviewStats,
  useRunFullScan,
} from "@/hooks/use-case-review";
import {
  IntakeListSkeleton,
  OutlineButton,
} from "@/components/ui/intake-ui";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Box, Flex, Grid, HStack, Text } from "@chakra-ui/react";
import {
  AlertCircle,
  AlertTriangle,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { ExportMenu } from "./components/export-menu";
import { IssueCard } from "./components/issue-card";
import { RecentlyResolved } from "./components/recently-resolved";
import { StatTile } from "@/components/ui/stat-tile";

const formatScanTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export function AiReviewDashboardPage() {
  useDocumentTitle("AI case review");
  const stats = useCaseReviewStats();
  const issues = useCaseReviewIssues({ status: "open" });
  const runScan = useRunFullScan();

  const s = stats.data;
  const scanLine = s?.lastScan.at
    ? `Last scan: ${formatScanTime(s.lastScan.at)} · ${s.lastScan.mattersReviewed} matters reviewed · ${s.lastScan.issuesFound} issues found · ${s.lastScan.resolvedSince} resolved since`
    : "No scan has run yet";

  return (
    <Box pt="24px" pb="56px">
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

      <RecentlyResolved count={s?.resolvedLast30Days ?? 0} />
    </Box>
  );
}
