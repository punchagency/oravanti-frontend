import { useDebounce } from "@uidotdev/usehooks";
import type { RoleSummary } from "@/api/roles-permissions";
import { useStaffGroupsMap } from "@/hooks/use-role-groups";
import { useRoles } from "@/hooks/use-roles";
import { useStaffsList, type StaffMemberDTO } from "@/hooks/use-staff-list";
import { usePaginationQueryStates } from "@/hooks/usePaginationQueryStates";
import { parseAsString, useQueryState } from "nuqs";
import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
} from "react";

/**
 * Server-driven search/filter/pagination for the Members tab — the staffs
 * endpoint filters by search/role/group and slices; this provider only owns
 * the URL state that feeds it. `groupsByMember` stays client-side because it
 * labels rows (chips), it doesn't filter them.
 */
interface MembersDataContextValue {
  members: StaffMemberDTO[];
  total: number;
  isLoading: boolean;
  roles: RoleSummary[];
  groupsByMember: Record<string, string[]>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  roleFilter: string;
  setRoleFilter: (r: string) => void;
  groupFilter: string;
  setGroupFilter: (g: string) => void;
  currentPage: number;
  pageLimit: number;
  setPagination: ReturnType<typeof usePaginationQueryStates>["setPagination"];
}

const MembersDataContext = createContext<MembersDataContextValue | null>(null);

export function MembersDataProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useQueryState("q", parseAsString.withDefault(""));
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [roleFilter, setRoleFilter] = useQueryState("role", parseAsString.withDefault(""));
  const [groupFilter, setGroupFilter] = useQueryState("group", parseAsString.withDefault(""));
  const { currentPage, limit: pageLimit, setPagination } = usePaginationQueryStates();

  const resetToFirstPage = useCallback(
    () => setPagination({ currentPage: 1 }),
    [setPagination],
  );
  const setSearchQueryAndResetPage = useCallback(
    (q: string) => { setSearchQuery(q); resetToFirstPage(); },
    [setSearchQuery, resetToFirstPage],
  );
  const setRoleFilterAndResetPage = useCallback(
    (r: string) => { setRoleFilter(r); resetToFirstPage(); },
    [setRoleFilter, resetToFirstPage],
  );
  const setGroupFilterAndResetPage = useCallback(
    (g: string) => { setGroupFilter(g); resetToFirstPage(); },
    [setGroupFilter, resetToFirstPage],
  );

  const staffQuery = useStaffsList({
    search: debouncedSearch.trim() || undefined,
    role: roleFilter || undefined,
    group: groupFilter || undefined,
    page: currentPage,
    limit: pageLimit,
  });
  const rolesQuery = useRoles();
  const { groupsByMember, isLoading: groupsLoading } = useStaffGroupsMap();

  return (
    <MembersDataContext.Provider
      value={{
        members: staffQuery.data?.data ?? [],
        total: staffQuery.data?.pagination?.total ?? 0,
        isLoading: staffQuery.isLoading || rolesQuery.isLoading || groupsLoading,
        roles: rolesQuery.data?.roles ?? [],
        groupsByMember,
        searchQuery,
        setSearchQuery: setSearchQueryAndResetPage,
        roleFilter,
        setRoleFilter: setRoleFilterAndResetPage,
        groupFilter,
        setGroupFilter: setGroupFilterAndResetPage,
        currentPage,
        pageLimit,
        setPagination,
      }}
    >
      {children}
    </MembersDataContext.Provider>
  );
}

/*
  Fast refresh wants components-only modules. The provider and its
  consumer hook are one unit here; hoisting the context into a third
  module to satisfy the rule buys indirection and nothing else. The
  cost is a full reload, not a hot update, when this file is edited.
*/
// eslint-disable-next-line react-refresh/only-export-components
export function useMembersData() {
  const ctx = useContext(MembersDataContext);
  if (!ctx)
    throw new Error("useMembersData must be used within MembersDataProvider");
  return ctx;
}
