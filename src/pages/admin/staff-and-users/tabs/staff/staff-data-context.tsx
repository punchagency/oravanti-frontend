import { useDebounce } from "@uidotdev/usehooks";
import {
  useStaffsList,
  type PaginationMeta,
  type StatusCounts,
} from "@/hooks/use-staff-list";
import { usePaginationQueryStates } from "@/hooks/usePaginationQueryStates";
import { parseAsString, useQueryState } from "nuqs";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { toStaffMember, type StaffMember } from "../../data";

interface StaffDataContextValue {
  staffData: StaffMember[];
  filteredStaff: StaffMember[];
  counts: StatusCounts;
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  roleFilter: string;
  setRoleFilter: (r: string) => void;
  teamFilter: string;
  setTeamFilter: (t: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  currentPage: number;
  pageLimit: number;
  setPagination: ReturnType<typeof usePaginationQueryStates>["setPagination"];
  pagination: PaginationMeta;
}

const StaffDataContext = createContext<StaffDataContextValue | null>(null);

export function StaffDataProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [roleFilter, setRoleFilter] = useQueryState(
    "role",
    parseAsString.withDefault(""),
  );
  const [teamFilter, setTeamFilter] = useQueryState(
    "team",
    parseAsString.withDefault(""),
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString.withDefault(""),
  );

  const { currentPage, limit: pageLimit, setPagination } = usePaginationQueryStates();

  const setSearchQueryAndResetPage = useCallback(
    (q: string) => { setSearchQuery(q); setPagination({ currentPage: 1 }); },
    [setSearchQuery, setPagination],
  );
  const setRoleFilterAndResetPage = useCallback(
    (r: string) => { setRoleFilter(r); setPagination({ currentPage: 1 }); },
    [setRoleFilter, setPagination],
  );
  const setTeamFilterAndResetPage = useCallback(
    (t: string) => { setTeamFilter(t); setPagination({ currentPage: 1 }); },
    [setTeamFilter, setPagination],
  );
  const setStatusFilterAndResetPage = useCallback(
    (s: string) => { setStatusFilter(s); setPagination({ currentPage: 1 }); },
    [setStatusFilter, setPagination],
  );

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      role: roleFilter || undefined,
      team: teamFilter || undefined,
      status: statusFilter || undefined,
      page: currentPage,
      limit: pageLimit,
    }),
    [debouncedSearch, roleFilter, teamFilter, statusFilter, currentPage, pageLimit],
  );

  const { data: response, isLoading: apiLoading } = useStaffsList(params);

  const data = response?.data;
  const counts = response?.counts ?? {
    active: 0,
    onLeave: 0,
    recertifyRequired: 0,
    pendingInvitation: 0,
  };
  const pagination = response?.pagination ?? {
    total: 0,
    limit: pageLimit,
    offset: 0,
  };

  const isLoading = apiLoading && (!data || data.length === 0);

  const staffData = useMemo(() => (data ?? []).map(toStaffMember), [data]);

  return (
    <StaffDataContext.Provider
      value={{
        staffData,
        filteredStaff: staffData,
        counts,
        isLoading,
        searchQuery,
        setSearchQuery: setSearchQueryAndResetPage,
        roleFilter,
        setRoleFilter: setRoleFilterAndResetPage,
        teamFilter,
        setTeamFilter: setTeamFilterAndResetPage,
        statusFilter,
        setStatusFilter: setStatusFilterAndResetPage,
        currentPage,
        pageLimit,
        setPagination,
        pagination,
      }}
    >
      {children}
    </StaffDataContext.Provider>
  );
}

/*
  Fast refresh wants components-only modules. The provider and its
  consumer hook are one unit here; hoisting the context into a third
  module to satisfy the rule buys indirection and nothing else. The
  cost is a full reload, not a hot update, when this file is edited.
*/
// eslint-disable-next-line react-refresh/only-export-components
export function useStaffData() {
  const ctx = useContext(StaffDataContext);
  if (!ctx)
    throw new Error("useStaffData must be used within StaffDataProvider");
  return ctx;
}
