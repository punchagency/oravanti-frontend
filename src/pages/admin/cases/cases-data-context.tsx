import { useDebounce } from "@uidotdev/usehooks";
import { usePaginationQueryStates } from "@/hooks/usePaginationQueryStates";
import {
  useCases,
  type PaginationMeta,
} from "@/hooks/use-cases";
import { getPracticeAreaByValue, type SpecialtyType } from "@/utils/practice-areas";
import { parseAsString, useQueryState } from "nuqs";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { CaseRow } from "@/api/cases";

const SPECIALTY_MAP: Record<string, SpecialtyType> = {
  "Family Law": "family",
  "Business Law": "business",
  "Estate Planning": "estate",
  "Employment / Labor Law": "employment",
  "Real Estate Law": "realestate",
  "Criminal Defense": "criminal",
  "Personal Injury": "personalinjury",
  "Personal Injury Law": "personalinjury",
};

function mapPracticeArea(name: string): SpecialtyType {
  for (const [key, val] of Object.entries(SPECIALTY_MAP)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return "immigration";
}

function toCase(row: CaseRow) {
  return {
    id: row.id,
    clientName: row.client?.name ?? "",
    caseRef: row.caseNumber,
    caseType: row.caseType?.name ?? "",
    stage: row.currentStep ?? "Filed",
    assignedTeam: row.assignedTeam?.name ?? "",
    deadline: row.estimatedCompletionDate ?? undefined,
    status: row.status,
    specialty: mapPracticeArea(row.practiceArea?.name ?? ""),
  };
}

interface Counts {
  active: number;
  rfe: number;
  pending: number;
  closed: number;
}

interface CasesDataContextValue {
  filteredCases: ReturnType<typeof toCase>[];
  paginatedCases: ReturnType<typeof toCase>[];
  counts: Counts;
  isLoading: boolean;
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
  pagination: PaginationMeta;
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

  // ── Server-side params (all filters + pagination sent to backend) ────

  const params = useMemo(() => {
    const p: Record<string, string | number | undefined> = {
      page: currentPage,
      limit: pageLimit,
    };

    if (debouncedSearch) p.search = debouncedSearch;
    if (statusFilter) p.status = statusFilter;

    if (practiceAreaFilter) {
      const pa = getPracticeAreaByValue(practiceAreaFilter);
      if (pa) p.practiceAreaName = pa.label;
    }

    if (caseTypeFilter) p.caseTypeName = caseTypeFilter;
    if (stageFilter) p.subcategoryName = stageFilter;
    if (teamFilter) p.assigneeName = teamFilter;

    return p as any;
  }, [debouncedSearch, statusFilter, practiceAreaFilter, caseTypeFilter, stageFilter, teamFilter, currentPage, pageLimit]);

  const { data: response, isLoading: apiLoading } = useCases(params);

  const apiCases = response?.data;
  const pagination = response?.pagination ?? { total: 0, limit: pageLimit, offset: 0 };

  const rawCases = apiCases ?? [];

  const allCases = useMemo(() => rawCases.map(toCase), [rawCases]);

  const isLoading = apiLoading && (!apiCases || apiCases.length === 0);

  // Counts computed from full organization data (unfiltered)
  // For now, we keep client-side counts since we don't have a dedicated counts endpoint
  const counts = useMemo(() => ({
    active: allCases.filter((c) => c.status.toLowerCase() === "active").length,
    rfe: allCases.filter((c) => c.status.toLowerCase() === "rfe").length,
    pending: allCases.filter((c) => c.status.toLowerCase() === "pending" || c.status.toLowerCase() === "interview").length,
    closed: allCases.filter((c) => c.status.toLowerCase() === "closed").length,
  }), [allCases]);

  return (
    <CasesDataContext.Provider
      value={{
        filteredCases: allCases,
        paginatedCases: allCases,
        counts,
        isLoading,
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
