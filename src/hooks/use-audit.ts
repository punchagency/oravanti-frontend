import { useQuery } from "@tanstack/react-query";
import { getAuditEvents, getAuditFacets, type AuditEventFilters } from "@/api/audit";

/**
 * The firm-wide audit trail, page/limit-paginated — matching the numbered-
 * page pattern used by every other paginated list in the app (see
 * `useCases`), rather than a bespoke "Load more" UI for this one page.
 *
 * Freshness comes from invalidation after audited mutations, not from a
 * TTL — see the app-wide query policy in `providers/provider.tsx`.
 */
export function useAuditEvents(filters: AuditEventFilters = {}) {
  const {
    category, action, domain, entityType, entityId,
    actorId, actorStaffId, from, to, search, page, limit,
  } = filters;

  return useQuery({
    queryKey: [
      "auditEvents",
      category, action, domain, entityType, entityId,
      actorId, actorStaffId, from, to, search, page, limit,
    ],
    queryFn: () => getAuditEvents(filters),
  });
}

/**
 * The actions, domains and categories this firm's trail actually contains.
 * Drives filter controls that should not flicker while someone is using
 * them; refreshes via invalidation like every other query.
 */
export function useAuditFacets(enabled = true) {
  return useQuery({
    queryKey: ["auditFacets"],
    queryFn: getAuditFacets,
    enabled,
  });
}
