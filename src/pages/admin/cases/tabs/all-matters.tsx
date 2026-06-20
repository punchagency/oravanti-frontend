import { Box } from "@chakra-ui/react";
import { CasesFilters } from "../components/cases-filters";
import { CasesTable, mockCases } from "../components/cases-table";
import { useMemo, useState } from "react";
import { getPracticeAreaByValue } from "@/utils/practice-areas";
import { PaginationControls } from "../components/pagination-controls";

export function AllMattersTab() {
  const [filters, setFilters] = useState({
    search: "",
    practiceArea: "all",
    filingType: "all",
    stage: "all",
    staff: "all",
  });
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const filteredAndSortedCases = useMemo(() => {
    let result = [...mockCases];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.clientName.toLowerCase().includes(searchLower) ||
          c.caseRef.toLowerCase().includes(searchLower) ||
          c.filingType.toLowerCase().includes(searchLower)
      );
    }

    // Apply practice area filter
    if (filters.practiceArea !== "all") {
      const practiceArea = getPracticeAreaByValue(filters.practiceArea);
      if (practiceArea) {
        result = result.filter((c) => c.specialty === practiceArea.specialty);
      }
    }

    // Apply filing type filter
    if (filters.filingType !== "all") {
      result = result.filter((c) =>
        c.filingType.toLowerCase().includes(filters.filingType.toLowerCase())
      );
    }

    // Apply stage filter
    if (filters.stage !== "all") {
      result = result.filter((c) =>
        c.stage.toLowerCase().includes(filters.stage.toLowerCase())
      );
    }

    // Apply staff filter
    if (filters.staff !== "all") {
      result = result.filter((c) =>
        c.assignedTo.toLowerCase().includes(filters.staff.toLowerCase())
      );
    }

    // Apply sorting by client name
    result.sort((a, b) => {
      const comparison = a.clientName.localeCompare(b.clientName);
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [filters, sortDirection]);

  const paginatedCases = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredAndSortedCases.slice(startIndex, startIndex + limit);
  }, [filteredAndSortedCases, page, limit]);

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  return (
    <Box>
      <CasesFilters
        casesCount={filteredAndSortedCases.length}
        sortDirection={sortDirection}
        onSortToggle={toggleSortDirection}
        onSearchChange={(value) =>
          setFilters({ ...filters, search: value })
        }
        onPracticeAreaChange={(value) =>
          setFilters({ ...filters, practiceArea: value })
        }
        onFilingTypeChange={(value) =>
          setFilters({ ...filters, filingType: value })
        }
        onStageChange={(value) =>
          setFilters({ ...filters, stage: value })
        }
        onStaffChange={(value) =>
          setFilters({ ...filters, staff: value })
        }
      />
      <CasesTable cases={paginatedCases} />
      <PaginationControls
        total={filteredAndSortedCases.length}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
      />
    </Box>
  );
}
