import { useDebounce } from "@uidotdev/usehooks";
import {
  useTeamsList,
  type PaginationMeta,
  type TeamCounts,
  type TeamListDTO,
} from "@/hooks/use-teams-list";
import { usePaginationQueryStates } from "@/hooks/usePaginationQueryStates";
import { parseAsString, useQueryState } from "nuqs";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

interface TeamsDataContextValue {
  teams: TeamListDTO[];
  counts: TeamCounts;
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  currentPage: number;
  pageLimit: number;
  setPagination: ReturnType<typeof usePaginationQueryStates>["setPagination"];
  pagination: PaginationMeta;
}

const TeamsDataContext = createContext<TeamsDataContextValue | null>(null);

export function TeamsDataProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString.withDefault(""),
  );

  const { currentPage, limit: pageLimit, setPagination } = usePaginationQueryStates();

  const setSearchQueryAndResetPage = useCallback(
    (q: string) => { setSearchQuery(q); setPagination({ currentPage: 1 }); },
    [setSearchQuery, setPagination],
  );
  const setStatusFilterAndResetPage = useCallback(
    (s: string) => { setStatusFilter(s); setPagination({ currentPage: 1 }); },
    [setStatusFilter, setPagination],
  );

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      page: currentPage,
      limit: pageLimit,
    }),
    [debouncedSearch, statusFilter, currentPage, pageLimit],
  );

  const { data: response, isLoading: apiLoading } = useTeamsList(params);

  const data = response?.data;
  const counts = response?.counts ?? {
    totalTeams: 0,
    activeMembers: 0,
    atCapacity: 0,
    practiceAreasCovered: 0,
  };
  const pagination = response?.pagination ?? {
    total: 0,
    limit: pageLimit,
    offset: 0,
  };

  const isLoading = apiLoading && (!data || data.length === 0);

  return (
    <TeamsDataContext.Provider
      value={{
        teams: data ?? [],
        counts,
        isLoading,
        searchQuery,
        setSearchQuery: setSearchQueryAndResetPage,
        statusFilter,
        setStatusFilter: setStatusFilterAndResetPage,
        currentPage,
        pageLimit,
        setPagination,
        pagination,
      }}
    >
      {children}
    </TeamsDataContext.Provider>
  );
}

export function useTeamsData() {
  const ctx = useContext(TeamsDataContext);
  if (!ctx)
    throw new Error("useTeamsData must be used within TeamsDataProvider");
  return ctx;
}
