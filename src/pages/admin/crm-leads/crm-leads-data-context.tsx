import { useDebounce } from "@uidotdev/usehooks";
import { parseAsString, useQueryState } from "nuqs";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type {
  GetLeadsParams,
  Lead,
  LeadSource,
  PipelineStage,
} from "@/api/leads";
import { useLeads } from "@/hooks/use-leads";
import { usePaginationQueryStates } from "@/hooks/usePaginationQueryStates";

/**
 * Filters live in the URL, following the house pattern in
 * cases-data-context.tsx. Previously they were local useState, so a reload or a
 * back-navigation silently dropped whatever the user had filtered to, and a
 * filtered view could not be shared as a link.
 */

type CrmLeadsDataContextValue = {
  leads: Lead[];
  isLoading: boolean;
  total: number;

  searchQuery: string;
  setSearchQuery: (value: string) => void;

  stageFilter: string;
  setStageFilter: (value: string) => void;

  practiceAreaFilter: string;
  setPracticeAreaFilter: (value: string) => void;

  sourceFilter: string;
  setSourceFilter: (value: string) => void;

  currentPage: number;
  limit: number;
  setPagination: ReturnType<typeof usePaginationQueryStates>["setPagination"];
};

const CrmLeadsDataContext = createContext<CrmLeadsDataContextValue | null>(null);

export function CrmLeadsDataProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
  // Only the debounced value reaches the query key, so typing "Jane" fires one
  // request rather than four.
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [stageFilter, setStageFilter] = useQueryState(
    "stage",
    parseAsString.withDefault(""),
  );
  const [practiceAreaFilter, setPracticeAreaFilter] = useQueryState(
    "practice",
    parseAsString.withDefault(""),
  );
  const [sourceFilter, setSourceFilter] = useQueryState(
    "source",
    parseAsString.withDefault(""),
  );

  const { currentPage, limit, setPagination } = usePaginationQueryStates();

  // Any filter change invalidates the current page number — page 4 of the old
  // result set is meaningless against the new one.
  const setSearchQueryAndResetPage = useCallback(
    (value: string) => {
      setSearchQuery(value);
      setPagination({ currentPage: 1 });
    },
    [setSearchQuery, setPagination],
  );
  const setStageFilterAndResetPage = useCallback(
    (value: string) => {
      setStageFilter(value);
      setPagination({ currentPage: 1 });
    },
    [setStageFilter, setPagination],
  );
  const setPracticeAreaFilterAndResetPage = useCallback(
    (value: string) => {
      setPracticeAreaFilter(value);
      setPagination({ currentPage: 1 });
    },
    [setPracticeAreaFilter, setPagination],
  );
  const setSourceFilterAndResetPage = useCallback(
    (value: string) => {
      setSourceFilter(value);
      setPagination({ currentPage: 1 });
    },
    [setSourceFilter, setPagination],
  );

  const params = useMemo<GetLeadsParams>(
    () => ({
      page: currentPage,
      limit,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(stageFilter ? { stage: stageFilter as PipelineStage } : {}),
      ...(practiceAreaFilter ? { practiceAreaId: practiceAreaFilter } : {}),
      ...(sourceFilter ? { source: sourceFilter as LeadSource } : {}),
    }),
    [
      currentPage,
      limit,
      debouncedSearch,
      stageFilter,
      practiceAreaFilter,
      sourceFilter,
    ],
  );

  const { data, isLoading: apiLoading } = useLeads(params);
  const leads = data?.leads ?? [];

  const value: CrmLeadsDataContextValue = {
    leads,
    // Keep the previous rows on screen while a refetch is in flight, so the
    // table doesn't flash a skeleton on every keystroke.
    isLoading: apiLoading && leads.length === 0,
    total: data?.pagination?.total ?? 0,

    searchQuery,
    setSearchQuery: setSearchQueryAndResetPage,
    stageFilter,
    setStageFilter: setStageFilterAndResetPage,
    practiceAreaFilter,
    setPracticeAreaFilter: setPracticeAreaFilterAndResetPage,
    sourceFilter,
    setSourceFilter: setSourceFilterAndResetPage,

    currentPage,
    limit,
    setPagination,
  };

  return (
    <CrmLeadsDataContext.Provider value={value}>
      {children}
    </CrmLeadsDataContext.Provider>
  );
}

/*
  Fast refresh wants components-only modules. The provider and its
  consumer hook are one unit here; hoisting the context into a third
  module to satisfy the rule buys indirection and nothing else. The
  cost is a full reload, not a hot update, when this file is edited.
*/
// eslint-disable-next-line react-refresh/only-export-components
export function useCrmLeadsData() {
  const ctx = useContext(CrmLeadsDataContext);
  if (!ctx)
    throw new Error("useCrmLeadsData must be used within a CrmLeadsDataProvider");
  return ctx;
}
