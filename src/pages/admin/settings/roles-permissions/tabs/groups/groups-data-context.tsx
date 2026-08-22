import { useDebounce } from "@uidotdev/usehooks";
import type { RoleGroupSummary } from "@/api/role-groups";
import { useRoleGroups } from "@/hooks/use-role-groups";
import { usePaginationQueryStates } from "@/hooks/usePaginationQueryStates";
import { parseAsString, useQueryState } from "nuqs";
import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
} from "react";

/**
 * Server-driven search/pagination for the Groups tab — the backend filters
 * and slices; this provider only owns the URL state that feeds it.
 */
interface GroupsDataContextValue {
  groups: RoleGroupSummary[];
  total: number;
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  currentPage: number;
  pageLimit: number;
  setPagination: ReturnType<typeof usePaginationQueryStates>["setPagination"];
}

const GroupsDataContext = createContext<GroupsDataContextValue | null>(null);

export function GroupsDataProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useQueryState("q", parseAsString.withDefault(""));
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { currentPage, limit: pageLimit, setPagination } = usePaginationQueryStates();

  const resetToFirstPage = useCallback(
    () => setPagination({ currentPage: 1 }),
    [setPagination],
  );
  const setSearchQueryAndResetPage = useCallback(
    (q: string) => { setSearchQuery(q); resetToFirstPage(); },
    [setSearchQuery, resetToFirstPage],
  );

  const groupsQuery = useRoleGroups({
    q: debouncedSearch.trim() || undefined,
    page: currentPage,
    limit: pageLimit,
  });

  return (
    <GroupsDataContext.Provider
      value={{
        groups: groupsQuery.data?.groups ?? [],
        total: groupsQuery.data?.total ?? 0,
        isLoading: groupsQuery.isLoading,
        searchQuery,
        setSearchQuery: setSearchQueryAndResetPage,
        currentPage,
        pageLimit,
        setPagination,
      }}
    >
      {children}
    </GroupsDataContext.Provider>
  );
}

/*
  Fast refresh wants components-only modules. The provider and its
  consumer hook are one unit here; hoisting the context into a third
  module to satisfy the rule buys indirection and nothing else. The
  cost is a full reload, not a hot update, when this file is edited.
*/
// eslint-disable-next-line react-refresh/only-export-components
export function useGroupsData() {
  const ctx = useContext(GroupsDataContext);
  if (!ctx)
    throw new Error("useGroupsData must be used within GroupsDataProvider");
  return ctx;
}
