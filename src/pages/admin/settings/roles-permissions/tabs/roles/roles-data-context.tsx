import { useDebounce } from "@uidotdev/usehooks";
import type { RoleSummary } from "@/api/roles-permissions";
import { useRoles } from "@/hooks/use-roles";
import { usePaginationQueryStates } from "@/hooks/usePaginationQueryStates";
import { parseAsString, useQueryState } from "nuqs";
import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
} from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const ROLE_TYPE_FILTERS = [
  { value: "all", label: "All types" },
  { value: "default", label: "Default" },
  { value: "custom", label: "Custom" },
] as const;

export type RoleTypeFilter = (typeof ROLE_TYPE_FILTERS)[number]["value"];

/**
 * Search/type-filter/pagination for the Roles tab — all done server-side
 * (`useRoles` params). The URL state (q/type/page) drives the request;
 * the response's `total` drives the pager.
 */
interface RolesDataContextValue {
  /** Current page slice — what the grid renders. */
  roles: RoleSummary[];
  /**
   * Unpaginated, unfiltered list — for the permission viewer and any
   * picker that must resolve a role the current page may not contain.
   */
  allRoles: RoleSummary[];
  total: number;
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  typeFilter: RoleTypeFilter;
  setTypeFilter: (t: RoleTypeFilter) => void;
  currentPage: number;
  pageLimit: number;
  setPagination: ReturnType<typeof usePaginationQueryStates>["setPagination"];
}

const RolesDataContext = createContext<RolesDataContextValue | null>(null);

function isTypeFilter(value: string): value is RoleTypeFilter {
  return ROLE_TYPE_FILTERS.some((t) => t.value === value);
}

export function RolesDataProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useQueryState("q", parseAsString.withDefault(""));
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [typeFilterRaw, setTypeFilterRaw] = useQueryState("type", parseAsString.withDefault("all"));
  const typeFilter: RoleTypeFilter = isTypeFilter(typeFilterRaw) ? typeFilterRaw : "all";
  const { currentPage, limit: pageLimit, setPagination } = usePaginationQueryStates();

  const resetToFirstPage = useCallback(
    () => setPagination({ currentPage: 1 }),
    [setPagination],
  );
  const setSearchQueryAndResetPage = useCallback(
    (q: string) => { setSearchQuery(q); resetToFirstPage(); },
    [setSearchQuery, resetToFirstPage],
  );
  const setTypeFilterAndResetPage = useCallback(
    (t: RoleTypeFilter) => { setTypeFilterRaw(t); resetToFirstPage(); },
    [setTypeFilterRaw, resetToFirstPage],
  );

  const rolesQuery = useRoles({
    q: debouncedSearch.trim() || undefined,
    type: typeFilter,
    page: currentPage,
    limit: pageLimit,
  });
  // Full list for pickers/viewers — separate cache entry from the paged one.
  const allRolesQuery = useRoles();

  return (
    <RolesDataContext.Provider
      value={{
        roles: rolesQuery.data?.roles ?? [],
        allRoles: allRolesQuery.data?.roles ?? [],
        total: rolesQuery.data?.total ?? 0,
        isLoading: rolesQuery.isLoading,
        searchQuery,
        setSearchQuery: setSearchQueryAndResetPage,
        typeFilter,
        setTypeFilter: setTypeFilterAndResetPage,
        currentPage,
        pageLimit,
        setPagination,
      }}
    >
      {children}
    </RolesDataContext.Provider>
  );
}

/*
  Fast refresh wants components-only modules. The provider and its
  consumer hook are one unit here; hoisting the context into a third
  module to satisfy the rule buys indirection and nothing else. The
  cost is a full reload, not a hot update, when this file is edited.
*/
// eslint-disable-next-line react-refresh/only-export-components
export function useRolesData() {
  const ctx = useContext(RolesDataContext);
  if (!ctx)
    throw new Error("useRolesData must be used within RolesDataProvider");
  return ctx;
}
