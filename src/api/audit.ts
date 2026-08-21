import { API } from "./index";

/**
 * The firm-wide audit trail.
 *
 * One endpoint over one table. `action` is a registry name — the same string
 * the backend call site used, the same string in the column, and the key this
 * app renders from. See `@/lib/audit`, and never re-case it.
 */
export interface AuditEvent {
  id: string;
  action: string;
  /** The registry's display name for `action`. Render this. */
  label: string;
  category: string;
  actionType: string;
  /** The sentence written when the event happened, in the vocabulary of the time. */
  summary: string;
  entityType: string;
  entityId: string | null;
  parentEntityType: string | null;
  parentEntityId: string | null;
  actorType: string;
  actorId: string | null;
  actorStaffId: string | null;
  /** The name as it stood then — never a live lookup. */
  actorName: string;
  actorEmail: string | null;
  /** The changed fields only, not whole rows. Null for reads. */
  before: unknown;
  after: unknown;
  metadata: Record<string, unknown> | null;
  /** Correlates this event with the access log and the trace. */
  requestId: string | null;
  ipAddress: string | null;
  source: string;
  occurredAt: string;
}

export interface AuditEventFilters {
  category?: string;
  action?: string;
  domain?: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  actorStaffId?: string;
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
  /** Page/limit, for the firm-wide trail (`getAuditEvents`). */
  page?: number;
  /** Keyset cursor, for `getEntityActivity` only. */
  cursor?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AuditEventsResponse {
  data: AuditEvent[];
  pagination: PaginationMeta;
}

export interface AuditEventPage {
  data: AuditEvent[];
  /** Null means this was the last page. */
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * What this firm's trail actually contains.
 *
 * Driven by the rows that exist rather than by the registry — the registry
 * lists every action the system *can* write, which for most firms would be a
 * dropdown of 150 entries where twenty have ever happened.
 */
export interface AuditFacets {
  actions: { action: string; label: string; category: string; count: number }[];
  domains: { domain: string; count: number }[];
  categories: { category: string; count: number }[];
}

/** Drops empty values so they do not reach the API as `?search=`. */
const toParams = (filters: AuditEventFilters): Record<string, string> => {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    params[key] = String(value);
  }
  return params;
};

export async function getAuditEvents(
  filters: AuditEventFilters = {},
): Promise<AuditEventsResponse> {
  const { data } = await API.get<{ data: AuditEvent[]; pagination: PaginationMeta }>(
    "/audit-events",
    { params: toParams(filters) },
  );

  return { data: data.data, pagination: data.pagination };
}

export async function getAuditFacets(): Promise<AuditFacets> {
  const { data } = await API.get<{ data: AuditFacets }>("/audit-events/filters");
  return data.data;
}

/** One entity's activity — changes and views together. */
export async function getEntityActivity(
  entityType: string,
  entityId: string,
  filters: Pick<AuditEventFilters, "category" | "limit" | "cursor"> = {},
): Promise<AuditEventPage> {
  const { data } = await API.get<{
    data: AuditEvent[];
    nextCursor: string | null;
    hasMore: boolean;
  }>(`/audit-events/entity/${entityType}/${entityId}`, {
    params: toParams(filters),
  });

  return {
    data: data.data,
    nextCursor: data.nextCursor,
    hasMore: data.hasMore,
  };
}

/** Everything one request did. The access log gives you the id. */
export async function getRequestActivity(
  requestId: string,
): Promise<AuditEvent[]> {
  const { data } = await API.get<{ data: AuditEvent[] }>(
    `/audit-events/request/${requestId}`,
  );
  return data.data;
}

/**
 * Downloads the filtered trail.
 *
 * Fetched as a blob and saved client-side rather than navigated to, because
 * the endpoint is cookie-authenticated through the same axios instance that
 * carries the org headers — a plain `window.open` would miss them.
 */
export async function exportAuditEvents(
  filters: AuditEventFilters = {},
  format: "csv" | "pdf" = "csv",
): Promise<Blob> {
  const { data } = await API.get<Blob>("/audit-events/export", {
    params: { ...toParams({ ...filters, cursor: undefined, limit: undefined, page: undefined }), format },
    responseType: "blob",
  });
  return data;
}
