import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  getAuditEvents,
  getAuditFacets,
  getEntityActivity,
  getRequestActivity,
  type AuditEventFilters,
  type AuditEventPage,
} from "@/api/audit";

/**
 * The firm-wide audit trail, paged by cursor.
 *
 * `useInfiniteQuery` rather than a page number, because the endpoint is
 * keyset-paginated: there is no page 4 to jump to, only "what comes after this
 * row". That is the point of the design — the trail grows at the end a reader
 * starts from, and offset paging silently skips events as new ones arrive
 * mid-scroll.
 *
 * No `staleTime: Infinity` here, unlike most list queries in this app. The
 * trail is append-only and read during incidents, so a stale first page is
 * actively misleading.
 */
export function useAuditEvents(filters: AuditEventFilters = {}) {
  const { cursor: _cursor, ...stableFilters } = filters;

  return useInfiniteQuery<
    AuditEventPage,
    Error,
    InfiniteData<AuditEventPage>,
    unknown[],
    string | undefined
  >({
    queryKey: ["auditEvents", stableFilters],
    queryFn: ({ pageParam }) =>
      getAuditEvents({ ...stableFilters, cursor: pageParam }),
    initialPageParam: undefined,
    // Null rather than undefined ends the pagination; the API returns null on
    // the last page, so normalise it.
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  });
}

/**
 * The actions, domains and categories this firm's trail actually contains.
 *
 * Cached longer than the events themselves: a new *kind* of action appearing is
 * far rarer than a new event, and this drives filter controls that should not
 * flicker while someone is using them.
 */
export function useAuditFacets(enabled = true) {
  return useQuery({
    queryKey: ["auditFacets"],
    queryFn: getAuditFacets,
    enabled,
    staleTime: 5 * 60_000,
  });
}

/** One entity's activity — changes and views together, cursor-paged. */
export function useEntityActivity(
  entityType: string,
  entityId: string,
  opts: { category?: string; limit?: number; enabled?: boolean } = {},
) {
  const { category, limit, enabled = true } = opts;

  return useInfiniteQuery<
    AuditEventPage,
    Error,
    InfiniteData<AuditEventPage>,
    unknown[],
    string | undefined
  >({
    queryKey: ["entityActivity", entityType, entityId, category, limit],
    queryFn: ({ pageParam }) =>
      getEntityActivity(entityType, entityId, {
        category,
        limit,
        cursor: pageParam,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: enabled && Boolean(entityType) && Boolean(entityId),
    staleTime: 30_000,
  });
}

/** Everything one request did. The access log gives you the id. */
export function useRequestActivity(requestId: string, enabled = true) {
  return useQuery({
    queryKey: ["requestActivity", requestId],
    queryFn: () => getRequestActivity(requestId),
    enabled: enabled && Boolean(requestId),
    staleTime: Infinity,
  });
}
