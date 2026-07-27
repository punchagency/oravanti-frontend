import {
  OutlineButton,
  StatusPill,
  SurfaceCard,
} from "@/components/ui/intake-ui";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useExportReport, useResolutionLog } from "@/hooks/use-case-review";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { usePaginationQueryStates } from "@/hooks/usePaginationQueryStates";
import {
  Box,
  Flex,
  HStack,
  Menu,
  Portal,
  Skeleton,
  Table,
  Text,
} from "@chakra-ui/react";
import { CheckCircle2, Download } from "lucide-react";

export function AiReviewResolutionLogPage() {
  useDocumentTitle("Resolution log");
  const { currentPage, limit, setPagination } = usePaginationQueryStates();
  const query = useResolutionLog({ page: currentPage, limit });
  const exportReport = useExportReport();
  const summary = query.data?.summary;

  return (
    <Box pt="24px">
      <Flex justifyContent="space-between" alignItems="flex-start" gap="16px">
        <Box>
          <Text textStyle="heading">Resolution log</Text>
          <Text color="fg.muted" mt="2px" fontSize="14px">
            All AI-flagged issues resolved in the last 30 days
          </Text>
        </Box>
        <Menu.Root>
          <Menu.Trigger asChild>
            <OutlineButton loading={exportReport.isPending}>
              <HStack gap="6px">
                <Download size={14} />
                <Text>Export</Text>
              </HStack>
            </OutlineButton>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item
                  value="csv"
                  onClick={() =>
                    exportReport.mutate({ report: "resolution-log", format: "csv" })
                  }
                >
                  Export as CSV
                </Menu.Item>
                <Menu.Item
                  value="pdf"
                  onClick={() =>
                    exportReport.mutate({ report: "resolution-log", format: "pdf" })
                  }
                >
                  Export as PDF
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </Flex>

      {summary && (
        <Box
          mt="16px"
          bg="green.50"
          border="1px solid"
          borderColor="green.200"
          borderRadius="8px"
          px="14px"
          py="12px"
        >
          <HStack gap="8px" color="green.700">
            <CheckCircle2 size={16} />
            <Text fontSize="13px" fontWeight="500">
              {summary.resolved} issue{summary.resolved === 1 ? "" : "s"} resolved
              in the last {summary.windowDays} days.
              {summary.averageResolutionDays != null &&
                ` Average resolution time: ${summary.averageResolutionDays} days.`}
            </Text>
          </HStack>
        </Box>
      )}

      <SurfaceCard>
        <Box overflowX="auto">
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
              {query.isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <Table.Row key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <Table.Cell key={j}>
                          <Skeleton h="16px" w="80%" />
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))
                : query.data?.data.map((row) => (
                    <Table.Row key={row.id}>
                      <Table.Cell fontWeight="500">{row.title}</Table.Cell>
                      <Table.Cell>
                        <Text fontWeight="500">
                          {row.client?.name ?? row.scenario.reference ?? "—"}
                        </Text>
                        {row.scenario.reference && row.client && (
                          <Text
                            fontSize="11px"
                            color="fg.muted"
                            fontFamily="mono"
                          >
                            {row.scenario.reference}
                          </Text>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {row.resolvedBy ? (
                          <HStack gap="6px">
                            <Text>{row.resolvedBy.name}</Text>
                            {row.resolvedBy.role && (
                              <StatusPill
                                tone={
                                  row.resolvedBy.role === "attorney" ||
                                  row.resolvedBy.role === "owner"
                                    ? "info"
                                    : "neutral"
                                }
                              >
                                {row.resolvedBy.role}
                              </StatusPill>
                            )}
                          </HStack>
                        ) : (
                          "—"
                        )}
                      </Table.Cell>
                      <Table.Cell color="fg.muted">
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
      </SurfaceCard>

      {query.data && query.data.pagination.total > limit && (
        <Box mt="16px">
          <PaginationControls
            total={query.data.pagination.total}
            currentPage={currentPage}
            limit={limit}
            onPageChange={(page) => setPagination({ currentPage: page })}
            onLimitChange={(l) => setPagination({ limit: l, currentPage: 1 })}
          />
        </Box>
      )}
    </Box>
  );
}
