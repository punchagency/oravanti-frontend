import type { AuditEvent } from "@/api/audit";
import { PageTitle } from "@/components/layout/shared/nav-context";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import {
  colorForCategory,
  labelForCategory,
  labelForDomain,
} from "@/lib/audit";
import {
  Badge,
  Box,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Shield } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { AuditTrailDataProvider, useAuditTrailData } from "./audit-trail-data-context";
import { AuditTrailFilters } from "./components/audit-trail-filters";
import { AuditEventDetailDialog } from "./components/audit-event-detail-dialog";

const TABLE_HEADERS = [
  "TIMESTAMP",
  "",
  "EVENT",
  "TYPE",
  "CATEGORY",
  "ACTOR",
  "ENTITY",
  "IP ADDRESS",
  "SOURCE",
];

/**
 * Memoized, with a stable `onSelect` from the parent (see
 * `AuditTrailContent`) — without both, opening/closing the shared detail
 * dialog re-rendered every row on the page.
 */
const AuditRow = memo(function AuditRow({ event, onSelect }: { event: AuditEvent; onSelect: (event: AuditEvent) => void }) {
  return (
    <Table.Row
      borderBottom="1px solid"
      borderColor="border.muted"
      _last={{ borderBottom: "none" }}
      _hover={{ bg: "bg.muted" }}
      cursor="pointer"
      transition="background 0.15s"
      onClick={() => onSelect(event)}
    >
      <Table.Cell py="12px" whiteSpace="nowrap" verticalAlign="top">
        <Text fontSize="12px" color="fg">
          {new Date(event.occurredAt).toLocaleDateString()}
        </Text>
        <Text fontSize="10px" color="fg.muted">
          {new Date(event.occurredAt).toLocaleTimeString()}
        </Text>
      </Table.Cell>

      <Table.Cell py="12px" verticalAlign="top" w="32px">
        <Shield size={14} color="fg.subtle" />
      </Table.Cell>

      <Table.Cell py="12px" verticalAlign="top" minW="200px">
        <Text fontSize="12px" fontWeight="500" color="fg" lineHeight="1.4">
          {event.label}
        </Text>
        {event.summary && event.summary !== event.label && (
          <Text fontSize="11px" color="fg.subtle" lineHeight="1.4" mt="2px">
            {event.summary}
          </Text>
        )}
      </Table.Cell>

      <Table.Cell py="12px" whiteSpace="nowrap" verticalAlign="top">
        <Badge size="sm" variant="outline" colorPalette={event.actionType === "delete" ? "red" : event.actionType === "create" ? "green" : "gray"}>
          {event.actionType}
        </Badge>
      </Table.Cell>

      <Table.Cell py="12px" whiteSpace="nowrap" verticalAlign="top">
        <Badge size="sm" colorPalette={colorForCategory(event.category)} variant="subtle">
          {labelForCategory(event.category)}
        </Badge>
      </Table.Cell>

      <Table.Cell py="12px" verticalAlign="top">
        <Text fontSize="12px" color="fg">
          {event.actorName}
        </Text>
        {event.actorEmail && (
          <Text fontSize="10px" color="fg.muted">
            {event.actorEmail}
          </Text>
        )}
      </Table.Cell>

      <Table.Cell py="12px" whiteSpace="nowrap" verticalAlign="top">
        <Text fontSize="11px" color="fg">
          {labelForDomain(event.entityType)}
        </Text>
        {event.entityId && (
          <Text fontSize="10px" color="fg.muted" fontFamily="mono">
            {event.entityId.slice(0, 8)}
          </Text>
        )}
      </Table.Cell>

      <Table.Cell py="12px" whiteSpace="nowrap" verticalAlign="top">
        <Text fontSize="11px" color="fg.muted" fontFamily="mono">
          {event.ipAddress ?? "\u2014"}
        </Text>
      </Table.Cell>

      <Table.Cell py="12px" whiteSpace="nowrap" verticalAlign="top">
        <Text fontSize="11px" color="fg.muted">
          {event.source ?? "\u2014"}
        </Text>
      </Table.Cell>
    </Table.Row>
  );
});

function AuditTrailContent() {
  const {
    events,
    isLoading,
    isError,
    isFiltered,
    currentPage,
    pageLimit,
    pagination,
    setPagination,
  } = useAuditTrailData();
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const handleSelectEvent = useCallback((event: AuditEvent) => {
    setSelectedEvent(event);
    setDetailOpen(true);
  }, []);

  return (
    <VStack align="stretch" gap={4}>
      <AuditTrailFilters />

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
        <Box py={12} textAlign="center">
          <Text fontSize="13px" color="fg.muted">
            {isFiltered
              ? "No events match these filters."
              : "No audit events recorded yet."}
          </Text>
        </Box>
      ) : (
        <>
          <Box border="1px solid" borderColor="border" borderRadius="10px" overflow="hidden">
            <Box overflowX="auto">
              <Table.Root size="md">
                <Table.Header>
                  <Table.Row bg="bg.muted">
                    {TABLE_HEADERS.map((h) => (
                      <Table.ColumnHeader
                        key={h}
                        py="12px"
                        fontSize="10px"
                        letterSpacing="0.06em"
                        color="fg.muted"
                        whiteSpace="nowrap"
                      >
                        {h ? h.toUpperCase() : "\u00A0"}
                      </Table.ColumnHeader>
                    ))}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {events.map((event) => (
                    <AuditRow key={event.id} event={event} onSelect={handleSelectEvent} />
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          </Box>

          <PaginationControls
            total={pagination.total}
            currentPage={currentPage}
            limit={pageLimit}
            onPageChange={(page) => setPagination({ currentPage: page })}
            onLimitChange={(newLimit) => setPagination({ currentPage: 1, limit: newLimit })}
          />
        </>
      )}

      <AuditEventDetailDialog
        event={selectedEvent}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onExitComplete={() => setSelectedEvent(null)}
      />
    </VStack>
  );
}

export function AuditTrailPage() {
  return (
    <AuditTrailDataProvider>
      <VStack align="stretch" gap={4}>
        <Box py="28px" pb="16px">
          <PageTitle>
            <Text as="h1" m="0" color="fg" fontSize="22px" fontWeight="500" lineHeight="1.2">
              Audit trail
            </Text>
          </PageTitle>
          <Text m="6px 0 0" color="fg.muted" fontSize="13px">
            Every recorded action, newest first. Views and downloads are
            excluded unless you select the Access category.
          </Text>
        </Box>

        <AuditTrailContent />
      </VStack>
    </AuditTrailDataProvider>
  );
}

export default AuditTrailPage;
