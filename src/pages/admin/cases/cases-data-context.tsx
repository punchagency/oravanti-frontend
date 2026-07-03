import { useDebounce } from "@uidotdev/usehooks";
import { usePaginationQueryStates } from "@/hooks/usePaginationQueryStates";
import { getPracticeAreaByValue } from "@/utils/practice-areas";
import { parseAsString, useQueryState } from "nuqs";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { mockCases } from "./components/cases-table";

interface Counts {
  active: number;
  rfe: number;
  pending: number;
  closed: number;
}

interface CasesDataContextValue {
  filteredCases: typeof mockCases;
  paginatedCases: typeof mockCases;
  counts: Counts;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  practiceAreaFilter: string;
  setPracticeAreaFilter: (p: string) => void;
  caseTypeFilter: string;
  setCaseTypeFilter: (f: string) => void;
  stageFilter: string;
  setStageFilter: (s: string) => void;
  teamFilter: string;
  setTeamFilter: (s: string) => void;
  sortDirection: "asc" | "desc";
  setSortDirection: (d: "asc" | "desc") => void;
  currentPage: number;
  pageLimit: number;
  setPagination: ReturnType<typeof usePaginationQueryStates>["setPagination"];
  pagination: { total: number; limit: number; offset: number };
}

const CasesDataContext = createContext<CasesDataContextValue | null>(null);

export function CasesDataProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString.withDefault(""),
  );
  const [practiceAreaFilter, setPracticeAreaFilter] = useQueryState(
    "practice",
    parseAsString.withDefault(""),
  );
  const [caseTypeFilter, setCaseTypeFilter] = useQueryState(
    "caseType",
    parseAsString.withDefault(""),
  );
  const [stageFilter, setStageFilter] = useQueryState(
    "stage",
    parseAsString.withDefault(""),
  );
  const [teamFilter, setTeamFilter] = useQueryState(
    "team",
    parseAsString.withDefault(""),
  );
  const [sortDirection, setSortDirection] = useQueryState(
    "sort",
    parseAsString.withDefault("asc"),
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
  const setPracticeAreaFilterAndResetPage = useCallback(
    (p: string) => { setPracticeAreaFilter(p); setPagination({ currentPage: 1 }); },
    [setPracticeAreaFilter, setPagination],
  );
  const setCaseTypeFilterAndResetPage = useCallback(
    (f: string) => { setCaseTypeFilter(f); setPagination({ currentPage: 1 }); },
    [setCaseTypeFilter, setPagination],
  );
  const setStageFilterAndResetPage = useCallback(
    (s: string) => { setStageFilter(s); setPagination({ currentPage: 1 }); },
    [setStageFilter, setPagination],
  );
  const setTeamFilterAndResetPage = useCallback(
    (s: string) => { setTeamFilter(s); setPagination({ currentPage: 1 }); },
    [setTeamFilter, setPagination],
  );

  const filteredCases = useMemo(() => {
    let result = [...mockCases];

    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(
        (c) =>
          c.clientName.toLowerCase().includes(searchLower) ||
          c.caseRef.toLowerCase().includes(searchLower) ||
          c.caseType.toLowerCase().includes(searchLower),
      );
    }

    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (practiceAreaFilter) {
      const practiceArea = getPracticeAreaByValue(practiceAreaFilter);
      if (practiceArea) {
        result = result.filter((c) => c.specialty === practiceArea.specialty);
      }
    }

    if (caseTypeFilter) {
      result = result.filter((c) =>
        c.caseType.toLowerCase().includes(caseTypeFilter.toLowerCase()),
      );
    }

    if (stageFilter) {
      result = result.filter((c) =>
        c.stage.toLowerCase().includes(stageFilter.toLowerCase()),
      );
    }

    if (teamFilter) {
      result = result.filter((c) =>
        c.assignedTeam.toLowerCase().includes(teamFilter.toLowerCase()),
      );
    }

    result.sort((a, b) => {
      const comparison = a.clientName.localeCompare(b.clientName);
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [debouncedSearch, statusFilter, practiceAreaFilter, caseTypeFilter, stageFilter, teamFilter, sortDirection]);

  const paginatedCases = useMemo(() => {
    const startIndex = (currentPage - 1) * pageLimit;
    return filteredCases.slice(startIndex, startIndex + pageLimit);
  }, [filteredCases, currentPage, pageLimit]);

  const counts = useMemo(() => ({
    active: mockCases.filter((c) => c.status === "Active").length,
    rfe: mockCases.filter((c) => c.status === "RFE").length,
    pending: mockCases.filter((c) => c.status === "Pending" || c.status === "Interview").length,
    closed: mockCases.filter((c) => c.status === "Closed").length,
  }), []);

  const pagination = useMemo(() => ({
    total: filteredCases.length,
    limit: pageLimit,
    offset: (currentPage - 1) * pageLimit,
  }), [filteredCases.length, pageLimit, currentPage]);

  return (
    <CasesDataContext.Provider
      value={{
        filteredCases,
        paginatedCases,
        counts,
        searchQuery,
        setSearchQuery: setSearchQueryAndResetPage,
        statusFilter,
        setStatusFilter: setStatusFilterAndResetPage,
        practiceAreaFilter,
        setPracticeAreaFilter: setPracticeAreaFilterAndResetPage,
        caseTypeFilter,
        setCaseTypeFilter: setCaseTypeFilterAndResetPage,
        stageFilter,
        setStageFilter: setStageFilterAndResetPage,
        teamFilter,
        setTeamFilter: setTeamFilterAndResetPage,
        sortDirection: sortDirection as "asc" | "desc",
        setSortDirection,
        currentPage,
        pageLimit,
        setPagination,
        pagination,
      }}
    >
      {children}
    </CasesDataContext.Provider>
  );
}

export function useCasesData() {
  const ctx = useContext(CasesDataContext);
  if (!ctx)
    throw new Error("useCasesData must be used within CasesDataProvider");
  return ctx;
}
