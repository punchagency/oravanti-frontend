import { useDebounce } from "@uidotdev/usehooks";
import { usePaginationQueryStates } from "@/hooks/usePaginationQueryStates";
import { useConvertedClients } from "@/hooks/use-converted-clients";
import { useFirmPracticeAreas } from "@/hooks/use-firm-practice-areas";
import type { ConvertedClient } from "@/api/converted-clients";
import { parseAsString, useQueryState } from "nuqs";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

interface ConvertedClientsDataContextValue {
  clients: ConvertedClient[];
  isLoading: boolean;
  total: number;
  practiceAreas: { id: string; name: string }[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  practiceArea: string;
  setPracticeArea: (p: string) => void;
  portalStatus: string;
  setPortalStatus: (s: string) => void;
  currentPage: number;
  pageLimit: number;
  setPagination: ReturnType<typeof usePaginationQueryStates>["setPagination"];
}

const ConvertedClientsDataContext = createContext<ConvertedClientsDataContextValue | null>(null);

export function ConvertedClientsDataProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [practiceArea, setPracticeArea] = useQueryState(
    "practiceArea",
    parseAsString.withDefault(""),
  );
  const [portalStatus, setPortalStatus] = useQueryState(
    "portalStatus",
    parseAsString.withDefault(""),
  );

  const { currentPage, limit: pageLimit, setPagination } = usePaginationQueryStates();
  const { data: practiceAreas = [] } = useFirmPracticeAreas();

  const setSearchQueryAndResetPage = useCallback(
    (q: string) => { setSearchQuery(q); setPagination({ currentPage: 1 }); },
    [setSearchQuery, setPagination],
  );
  const setPracticeAreaAndResetPage = useCallback(
    (p: string) => { setPracticeArea(p); setPagination({ currentPage: 1 }); },
    [setPracticeArea, setPagination],
  );
  const setPortalStatusAndResetPage = useCallback(
    (s: string) => { setPortalStatus(s); setPagination({ currentPage: 1 }); },
    [setPortalStatus, setPagination],
  );

  const { data, isLoading } = useConvertedClients({
    search: debouncedSearch || undefined,
    practiceAreaId: practiceArea || undefined,
    portalStatus: portalStatus || undefined,
    page: currentPage,
    limit: pageLimit,
  });

  const clients = useMemo(() => {
    return data?.data ?? [];
  }, [data]);

  const total = data?.pagination?.total ?? 0;

  return (
    <ConvertedClientsDataContext.Provider
      value={{
        clients,
        isLoading,
        total,
        practiceAreas,
        searchQuery,
        setSearchQuery: setSearchQueryAndResetPage,
        practiceArea,
        setPracticeArea: setPracticeAreaAndResetPage,
        portalStatus,
        setPortalStatus: setPortalStatusAndResetPage,
        currentPage,
        pageLimit,
        setPagination,
      }}
    >
      {children}
    </ConvertedClientsDataContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConvertedClientsData() {
  const ctx = useContext(ConvertedClientsDataContext);
  if (!ctx)
    throw new Error("useConvertedClientsData must be used within ConvertedClientsDataProvider");
  return ctx;
}
