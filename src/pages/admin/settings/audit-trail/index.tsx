import { exportAuditEvents, type AuditEvent } from "@/api/audit";
import { PageTitle } from "@/components/layout/shared/nav-context";
import { ReportTable, REPORT_CELL_PY } from "@/components/ui/report-table";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { useAuditEvents, useAuditFacets } from "@/hooks/use-audit";
import {
  colorForCategory,
  iconForAction,
  labelForCategory,
  labelForDomain,
} from "@/lib/audit";
import { useAuthStore } from "@/store/auth-store";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Input,
  NativeSelect,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Download, Search } from "lucide-react";
import { parseAsString, useQueryStates } from "nuqs";
import { useMemo, useState } from "react";
import { toast } from "sonner";

/**
 * The firm-wide audit trail.
 *
 * One component for every action in the system. It holds no vocabulary of its
 * own: the row label comes from the API (which reads it from the registry), the
 * icon is resolved by domain, and the filter options are the actions this firm
 * has actually recorded. A new action therefore appears here correctly the day
 * it ships, with no change to this file — which is the whole reason the eleven
 * per-domain event tables and their divergent frontend label maps were
 * collapsed into one.
 */

/** Rendered when a filter has no matches, and when the trail is genuinely empty. */
function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <Box py={12} textAlign="center">
      <Text fontSize="13px" color="fg.muted">
        {filtered
          ? "No events match these filters."
          : "No audit events recorded yet."}
      </Text>
    </Box>
  );
}

function AuditRow({ event }: { event: AuditEvent }) {
  return (
    <Table.Row>
      <Table.Cell py={REPORT_CELL_PY} whiteSpace="nowrap">
        <Text fontSize="12px" color="fg">
          {new Date(event.occurredAt).toLocaleDateString()}
        </Text>
        <Text fontSize="10px" color="fg.muted">
          {new Date(event.occurredAt).toLocaleTimeString()}
        </Text>
      </Table.Cell>

      <Table.Cell py={REPORT_CELL_PY}>
        <HStack gap={2} align="start">
          <Text fontSize="13px" lineHeight="1.3">
            {iconForAction(event.action)}
          </Text>
          <Box>
            <Text fontSize="12px" fontWeight="500" color="fg">
              {event.label}
            </Text>
            {/*
              Only when it adds something. Most summaries are the label plus
              their subject, and repeating the label underneath it is noise.
            */}
            {event.summary && event.summary !== event.label && (
              <Text fontSize="11px" color="fg.subtle" lineHeight="1.4">
                {event.summary}
              </Text>
            )}
          </Box>
        </HStack>
      </Table.Cell>

      <Table.Cell py={REPORT_CELL_PY}>
        <Badge
          size="sm"
          colorPalette={colorForCategory(event.category)}
          variant="subtle"
        >
          {labelForCategory(event.category)}
        </Badge>
      </Table.Cell>

      <Table.Cell py={REPORT_CELL_PY}>
        {/* The stored snapshot, not a live lookup — renames must not rewrite history. */}
        <Text fontSize="12px" color="fg">
          {event.actorName}
        </Text>
        {event.actorEmail && (
          <Text fontSize="10px" color="fg.muted">
            {event.actorEmail}
          </Text>
        )}
      </Table.Cell>

      <Table.Cell py={REPORT_CELL_PY}>
        <Text fontSize="11px" color="fg.muted">
          {labelForDomain(event.entityType)}
        </Text>
      </Table.Cell>

      <Table.Cell py={REPORT_CELL_PY} whiteSpace="nowrap">
        <Text fontSize="11px" color="fg.muted" fontFamily="mono">
          {event.ipAddress ?? "—"}
        </Text>
      </Table.Cell>
    </Table.Row>
  );
}

const TABLE_HEADERS = [
  "WHEN",
  "EVENT",
  "CATEGORY",
  "ACTOR",
  "ENTITY",
  "IP ADDRESS",
];

export function AuditTrailPage() {
  const memberRole = useAuthStore((s) => s.memberRole);
  // The route is gated server-side on the `audit` resource; this only decides
  // whether to render the control, so an attorney is not shown a button that
  // would 403.
  const canExport = memberRole === "owner" || memberRole === "admin";

  const [filters, setFilters] = useQueryStates({
    domain: parseAsString.withDefault(""),
    category: parseAsString.withDefault(""),
    action: parseAsString.withDefault(""),
    search: parseAsString.withDefault(""),
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault(""),
  });

  // Typing must not fire a request per keystroke; the box commits on Enter or
  // on the button, and this holds the uncommitted text meanwhile.
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const [exporting, setExporting] = useState(false);

  const queryFilters = useMemo(
    () => ({
      domain: filters.domain || undefined,
      category: filters.category || undefined,
      action: filters.action || undefined,
      search: filters.search || undefined,
      from: filters.from ? new Date(filters.from).toISOString() : undefined,
      to: filters.to ? new Date(filters.to).toISOString() : undefined,
      limit: 50,
    }),
    [filters],
  );

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useAuditEvents(queryFilters);
  const { data: facets } = useAuditFacets();

  const events = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  const isFiltered = Object.values(filters).some(Boolean);

  /**
   * Actions narrowed to the selected domain.
   *
   * Otherwise the action dropdown lists everything the firm has ever recorded
   * while the domain filter says "lead", which offers combinations that return
   * nothing.
   */
  const actionOptions = useMemo(() => {
    const all = facets?.actions ?? [];
    if (!filters.domain) return all;
    return all.filter((a) => a.action.startsWith(`${filters.domain}.`));
  }, [facets, filters.domain]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportAuditEvents(queryFilters, "csv");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Audit trail exported");
    } catch {
      toast.error("Could not export the audit trail");
    } finally {
      setExporting(false);
    }
  };

  return (
    <VStack align="stretch" gap={4}>
      <PageTitle>Audit trail</PageTitle>

      <Flex justify="space-between" align="center" gap={3} wrap="wrap">
        <Box>
          <Text fontSize="15px" fontWeight="600" color="fg">
            Audit trail
          </Text>
          <Text fontSize="12px" color="fg.muted">
            Every recorded action, newest first. Views and downloads are
            excluded unless you select the Access category.
          </Text>
        </Box>

        {canExport && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            loading={exporting}
          >
            <Download size={14} /> Export CSV
          </Button>
        )}
      </Flex>

      <Flex gap={2} wrap="wrap" align="end">
        <Box flex="1" minW="200px">
          <Text fontSize="10px" color="fg.muted" mb={1}>
            SEARCH
          </Text>
          <HStack gap={1}>
            <Input
              size="sm"
              placeholder="Search summaries…"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setFilters({ search: searchDraft });
              }}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFilters({ search: searchDraft })}
              aria-label="Search"
            >
              <Search size={14} />
            </Button>
          </HStack>
        </Box>

        <Box minW="150px">
          <Text fontSize="10px" color="fg.muted" mb={1}>
            AREA
          </Text>
          <NativeSelect.Root size="sm">
            <NativeSelect.Field
              value={filters.domain}
              // Clearing the action alongside the domain: an action from the
              // previous domain would otherwise silently contradict the new one.
              onChange={(e) =>
                setFilters({ domain: e.currentTarget.value, action: "" })
              }
            >
              <option value="">All areas</option>
              {facets?.domains.map((d) => (
                <option key={d.domain} value={d.domain}>
                  {labelForDomain(d.domain)} ({d.count})
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Box>

        <Box minW="150px">
          <Text fontSize="10px" color="fg.muted" mb={1}>
            CATEGORY
          </Text>
          <NativeSelect.Root size="sm">
            <NativeSelect.Field
              value={filters.category}
              onChange={(e) => setFilters({ category: e.currentTarget.value })}
            >
              <option value="">Changes only</option>
              {facets?.categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {labelForCategory(c.category)} ({c.count})
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Box>

        <Box minW="190px">
          <Text fontSize="10px" color="fg.muted" mb={1}>
            EVENT
          </Text>
          <NativeSelect.Root size="sm">
            <NativeSelect.Field
              value={filters.action}
              onChange={(e) => setFilters({ action: e.currentTarget.value })}
            >
              <option value="">All events</option>
              {actionOptions.map((a) => (
                <option key={a.action} value={a.action}>
                  {a.label} ({a.count})
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Box>

        <Box>
          <Text fontSize="10px" color="fg.muted" mb={1}>
            FROM
          </Text>
          <Input
            size="sm"
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ from: e.currentTarget.value })}
          />
        </Box>

        <Box>
          <Text fontSize="10px" color="fg.muted" mb={1}>
            TO
          </Text>
          <Input
            size="sm"
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ to: e.currentTarget.value })}
          />
        </Box>

        {isFiltered && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSearchDraft("");
              setFilters({
                domain: "",
                category: "",
                action: "",
                search: "",
                from: "",
                to: "",
              });
            }}
          >
            Clear
          </Button>
        )}
      </Flex>

      {isLoading ? (
        <VStack align="stretch" gap={2}>
          {Array.from({ length: 8 }, (_, i) => (
            <ThemeSkeleton key={i} h="52px" borderRadius="6px" />
          ))}
        </VStack>
      ) : isError ? (
        <Box py={12} textAlign="center">
          <Text fontSize="13px" color="fg.muted">
            The audit trail could not be loaded.
          </Text>
        </Box>
      ) : events.length === 0 ? (
        <EmptyState filtered={isFiltered} />
      ) : (
        <>
          <ReportTable headers={TABLE_HEADERS}>
            {events.map((event) => (
              <AuditRow key={event.id} event={event} />
            ))}
          </ReportTable>

          {/*
            A "load more" button rather than page numbers, because the endpoint
            is keyset-paginated: there is no page 4 to jump to, only what comes
            after the last row shown. Offset paging over an append-only table
            skips events as new ones arrive mid-scroll.
          */}
          {hasNextPage && (
            <Flex justify="center" pt={1}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchNextPage()}
                loading={isFetchingNextPage}
              >
                Load more
              </Button>
            </Flex>
          )}
        </>
      )}
    </VStack>
  );
}

export default AuditTrailPage;
