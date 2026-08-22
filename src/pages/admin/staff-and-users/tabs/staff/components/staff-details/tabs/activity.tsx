import { getAuditEvents, type AuditEvent, type AuditEventFilters } from "@/api/audit";
import { ActivityFeed } from "@/components/ui/activity-feed";
import { useAuditEvents } from "@/hooks/use-audit";
import { VStack } from "@chakra-ui/react";
import { useState } from "react";

const PAGE_SIZE = 20;

/**
 * What this staff member has done, from the firm's audit trail.
 *
 * Filtered on `actorStaffId` rather than `actorId`: the audit row snapshots
 * both, and the staff id is the one that survives the person's user account
 * being deleted — which is precisely the case where someone comes looking at
 * this tab.
 *
 * `useAuditEvents` is page/limit-paginated, not infinite-scroll. This feed
 * still wants a "load more" affordance, so later pages are fetched
 * imperatively on click and appended locally, rather than mirroring query
 * state into local state via an effect. The caller remounts this component
 * (via `key={staffId}`) when the staff member changes, so there's no reset
 * case to handle here.
 */
export function Activity({ staffId }: { staffId?: string }) {
  const filters: AuditEventFilters = staffId ? { actorStaffId: staffId } : {};

  const { data, isLoading } = useAuditEvents({ ...filters, page: 1, limit: PAGE_SIZE });

  const [extraEvents, setExtraEvents] = useState<AuditEvent[]>([]);
  const [nextPage, setNextPage] = useState(2);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const events = [...(data?.data ?? []), ...extraEvents];
  const hasNextPage = extraEvents.length > 0 ? hasMore : (data?.pagination.hasNextPage ?? false);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const page = await getAuditEvents({ ...filters, page: nextPage, limit: PAGE_SIZE });
      setExtraEvents((prev) => [...prev, ...page.data]);
      setNextPage((p) => p + 1);
      setHasMore(page.pagination.hasNextPage);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <VStack gap={4} align="stretch" px={5} pb={5}>
      <ActivityFeed
        events={events}
        isLoading={isLoading}
        emptyMessage="No recorded activity for this staff member."
        hasNextPage={hasNextPage}
        isFetchingNextPage={loadingMore}
        onLoadMore={handleLoadMore}
      />
    </VStack>
  );
}
