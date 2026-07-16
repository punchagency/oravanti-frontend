import { useDebounce } from "@uidotdev/usehooks";
import { usePaginationQueryStates } from "@/hooks/usePaginationQueryStates";
import {
  useLeads,
} from "@/hooks/use-leads";
import { useFirmPracticeAreas } from "@/hooks/use-firm-practice-areas";
import {
  sourceValues,
  type Lead,
  type LeadSource,
  type PipelineStage,
} from "@/api/leads";
import { pipelineStageLabels } from "./components/lead-details/constants";
import { parseAsString, useQueryState } from "nuqs";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

const leadSources = [
  "Education flywheel",
  "Referral",
  "Direct",
  "Walk in",
  "Phone enquiry",
  "Client portal",
] as const;

const pipelineStageOptions = [
  "All stages",
  ...Object.keys(pipelineStageLabels),
] as const;

interface Counts {
  new: number;
  reviewed: number;
  archived: number;
  total: number;
}

interface LeadsDataContextValue {
  leads: Lead[];
  isLoading: boolean;
  total: number;
  counts: Counts;
  practiceAreas: { id: string; name: string }[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  source: string;
  setSource: (s: string) => void;
  practiceArea: string;
  setPracticeArea: (p: string) => void;
  stage: string;
  setStage: (s: string) => void;
  currentPage: number;
  pageLimit: number;
  setPagination: ReturnType<typeof usePaginationQueryStates>["setPagination"];
  pipelineStageOptions: readonly string[];
  leadSources: readonly string[];
}

const LeadsDataContext = createContext<LeadsDataContextValue | null>(null);

export function LeadsDataProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [source, setSource] = useQueryState(
    "source",
    parseAsString.withDefault(""),
  );
  const [practiceArea, setPracticeArea] = useQueryState(
    "practiceArea",
    parseAsString.withDefault(""),
  );
  const [stage, setStage] = useQueryState(
    "stage",
    parseAsString.withDefault(""),
  );

  const { currentPage, limit: pageLimit, setPagination } = usePaginationQueryStates();

  const { data: practiceAreas = [] } = useFirmPracticeAreas();

  const setSearchQueryAndResetPage = useCallback(
    (q: string) => { setSearchQuery(q); setPagination({ currentPage: 1 }); },
    [setSearchQuery, setPagination],
  );
  const setSourceAndResetPage = useCallback(
    (s: string) => { setSource(s); setPagination({ currentPage: 1 }); },
    [setSource, setPagination],
  );
  const setPracticeAreaAndResetPage = useCallback(
    (p: string) => { setPracticeArea(p); setPagination({ currentPage: 1 }); },
    [setPracticeArea, setPagination],
  );
  const setStageAndResetPage = useCallback(
    (s: string) => { setStage(s); setPagination({ currentPage: 1 }); },
    [setStage, setPagination],
  );

  const sourceFilter =
    source === ""
      ? undefined
      : (sourceValues[source] as LeadSource | undefined);
  const practiceAreaFilter =
    practiceArea === ""
      ? undefined
      : practiceArea;

  const stageFilter =
    stage === "" ? undefined : (stage as PipelineStage);

  const { data, isLoading } = useLeads({
    source: sourceFilter,
    practiceAreaId: practiceAreaFilter,
    stage: stageFilter,
    search: debouncedSearch || undefined,
    page: currentPage,
    limit: pageLimit,
  });

  const leads = useMemo(() => {
    const list = Array.isArray(data) ? data : (data?.leads ?? []);
    return list;
  }, [data]);

  const total = data?.pagination?.total ?? 0;

  const counts = useMemo(() => {
    const newCount = leads.filter((l) => l.status === "new").length;
    const reviewedCount = leads.filter((l) => l.status === "reviewed").length;
    const archivedCount = leads.filter(
      (l) =>
        l.status === "archived" ||
        l.status === "declined" ||
        l.status === "overridden",
    ).length;
    return {
      new: newCount,
      reviewed: reviewedCount,
      archived: archivedCount,
      total: leads.length,
    };
  }, [leads]);

  return (
    <LeadsDataContext.Provider
      value={{
        leads,
        isLoading,
        total,
        counts,
        practiceAreas,
        searchQuery,
        setSearchQuery: setSearchQueryAndResetPage,
        source,
        setSource: setSourceAndResetPage,
        practiceArea,
        setPracticeArea: setPracticeAreaAndResetPage,
        stage,
        setStage: setStageAndResetPage,
        currentPage,
        pageLimit,
        setPagination,
        pipelineStageOptions,
        leadSources,
      }}
    >
      {children}
    </LeadsDataContext.Provider>
  );
}

export function useLeadsData() {
  const ctx = useContext(LeadsDataContext);
  if (!ctx)
    throw new Error("useLeadsData must be used within LeadsDataProvider");
  return ctx;
}
