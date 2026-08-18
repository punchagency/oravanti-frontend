import { ActivityFeed } from "@/components/ui/activity-feed";
import { useAuditEvents } from "@/hooks/use-audit";
import { VStack } from "@chakra-ui/react";
import { useMemo } from "react";

/**
 * What this staff member has done, from the firm's audit trail.
 *
 * Filtered on `actorStaffId` rather than `actorId`: the audit row snapshots
 * both, and the staff id is the one that survives the person's user account
 * being deleted — which is precisely the case where someone comes looking at
 * this tab.
 */
export function Activity({ staffId }: { staffId?: string }) {
  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useAuditEvents(staffId ? { actorStaffId: staffId } : {});

  const events = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  return (
    <VStack gap={4} align="stretch" px={5} pb={5}>
      <ActivityFeed
        events={events}
        isLoading={isLoading}
        emptyMessage="No recorded activity for this staff member."
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={fetchNextPage}
      />
    </VStack>
  );
}
