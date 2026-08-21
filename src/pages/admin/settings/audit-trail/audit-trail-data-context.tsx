import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { parseAsString, useQueryStates } from "nuqs";
import { useDebounce } from "@uidotdev/usehooks";
import { usePaginationQueryStates } from "@/hooks/usePaginationQueryStates";
import { useAuditEvents, useAuditFacets } from "@/hooks/use-audit";
import { exportAuditEvents, type AuditEvent, type PaginationMeta } from "@/api/audit";
import { toast } from "sonner";

const EMPTY_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

interface AuditTrailDataContextValue {
  events: AuditEvent[];
  isLoading: boolean;
  isError: boolean;
  currentPage: number;
  pageLimit: number;
  pagination: PaginationMeta;
  setPagination: ReturnType<typeof usePaginationQueryStates>["setPagination"];
  facets: Awaited<ReturnType<typeof useAuditFacets>>["data"];
  searchDraft: string;
  setSearchDraft: (q: string) => void;
  domain: string;
  setDomain: (d: string) => void;
  category: string;
  setCategory: (c: string) => void;
  action: string;
  setAction: (a: string) => void;
  from: string;
  setFrom: (f: string) => void;
  to: string;
  setTo: (t: string) => void;
  actionOptions: { action: string; label: string; count: number }[];
  isFiltered: boolean;
  clearAll: () => void;
  exporting: boolean;
  handleExport: () => Promise<void>;
}

const AuditTrailDataContext = createContext<AuditTrailDataContextValue | null>(null);

/** `filters.from`/`filters.to` round-trip through the URL via `nuqs`, so a
 * hand-edited or shared link can carry a non-date string — guard against
 * `.toISOString()` throwing on an Invalid Date mid-render. */
function toIsoOrUndefined(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function AuditTrailDataProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useQueryStates({
    domain: parseAsString.withDefault(""),
    category: parseAsString.withDefault(""),
    action: parseAsString.withDefault(""),
    search: parseAsString.withDefault(""),
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault(""),
  });

  const { currentPage, limit: pageLimit, setPagination } = usePaginationQueryStates();

  const [searchDraft, setSearchDraft] = useState(filters.search);
  const debouncedSearch = useDebounce(searchDraft, 300);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters({ search: debouncedSearch });
      setPagination({ currentPage: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters.search, setFilters]);

  const queryFilters = useMemo(
    () => ({
      domain: filters.domain || undefined,
      category: filters.category || undefined,
      action: filters.action || undefined,
      search: filters.search || undefined,
      from: toIsoOrUndefined(filters.from),
      to: toIsoOrUndefined(filters.to),
      page: currentPage,
      limit: pageLimit,
    }),
    [filters, currentPage, pageLimit],
  );

  const { data, isLoading, isError } = useAuditEvents(queryFilters);

  const { data: facets } = useAuditFacets();

  const events = useMemo(() => data?.data ?? [], [data]);
  const pagination = useMemo(
    () => data?.pagination ?? { ...EMPTY_PAGINATION, limit: pageLimit },
    [data, pageLimit],
  );

  const isFiltered = useMemo(
    () =>
      searchDraft !== "" ||
      Object.entries(filters).some(([k, v]) => k !== "search" && v !== ""),
    [searchDraft, filters],
  );

  const actionOptions = useMemo(() => {
    const all = facets?.actions ?? [];
    if (!filters.domain) return all;
    return all.filter((a) => a.action.startsWith(`${filters.domain}.`));
  }, [facets, filters.domain]);

  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
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
  }, [queryFilters]);

  const setDomain = useCallback(
    (d: string) => {
      setFilters({ domain: d, action: "" });
      setPagination({ currentPage: 1 });
    },
    [setFilters, setPagination],
  );
  const setCategory = useCallback(
    (c: string) => {
      setFilters({ category: c });
      setPagination({ currentPage: 1 });
    },
    [setFilters, setPagination],
  );
  const setAction = useCallback(
    (a: string) => {
      setFilters({ action: a });
      setPagination({ currentPage: 1 });
    },
    [setFilters, setPagination],
  );
  const setFrom = useCallback(
    (f: string) => {
      setFilters({ from: f });
      setPagination({ currentPage: 1 });
    },
    [setFilters, setPagination],
  );
  const setTo = useCallback(
    (t: string) => {
      setFilters({ to: t });
      setPagination({ currentPage: 1 });
    },
    [setFilters, setPagination],
  );

  const clearAll = useCallback(() => {
    setSearchDraft("");
    setFilters({
      domain: "",
      category: "",
      action: "",
      search: "",
      from: "",
      to: "",
    });
    setPagination({ currentPage: 1 });
  }, [setFilters, setPagination]);

  const value = useMemo<AuditTrailDataContextValue>(
    () => ({
      events,
      isLoading,
      isError,
      currentPage,
      pageLimit,
      pagination,
      setPagination,
      facets,
      searchDraft,
      setSearchDraft,
      domain: filters.domain,
      setDomain,
      category: filters.category,
      setCategory,
      action: filters.action,
      setAction,
      from: filters.from,
      setFrom,
      to: filters.to,
      setTo,
      actionOptions,
      isFiltered,
      clearAll,
      exporting,
      handleExport,
    }),
    [
      events,
      isLoading,
      isError,
      currentPage,
      pageLimit,
      pagination,
      setPagination,
      facets,
      searchDraft,
      filters,
      setDomain,
      setCategory,
      setAction,
      setFrom,
      setTo,
      actionOptions,
      isFiltered,
      clearAll,
      exporting,
      handleExport,
    ],
  );

  return (
    <AuditTrailDataContext.Provider value={value}>
      {children}
    </AuditTrailDataContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuditTrailData() {
  const ctx = useContext(AuditTrailDataContext);
  if (!ctx)
    throw new Error("useAuditTrailData must be used within AuditTrailDataProvider");
  return ctx;
}
