import { Stack, Text } from "@chakra-ui/react";
import { CasesFilters } from "../components/cases-filters";
import { CasesTable } from "../components/cases-table";
import { CasesMobileCard } from "../components/cases-mobile-card";
import { PaginationControls } from "../components/pagination-controls";
import { useCasesData } from "../cases-data-context";

export function AllMattersTab() {
  const { filteredCases, paginatedCases, currentPage, pageLimit, setPagination } =
    useCasesData();

  return (
    <>
      <CasesFilters />

      {/* Desktop table */}
      <CasesTable cases={paginatedCases} />

      {/* Mobile cards */}
      <Stack gap={3} display={{ base: "flex", lg: "none" }}>
        {paginatedCases.length === 0 ? (
          <Stack py={16} gap={2} textAlign="center" align="center">
            <Text color="fg.muted" fontSize="lg" fontWeight="600">
              No cases found
            </Text>
            <Text color="fg.subtle" textStyle="body-sm">
              Try adjusting your filters or search terms.
            </Text>
          </Stack>
        ) : (
          paginatedCases.map((caseItem) => (
            <CasesMobileCard key={caseItem.id} caseItem={caseItem} />
          ))
        )}
      </Stack>

      <PaginationControls
        total={filteredCases.length}
        page={currentPage}
        limit={pageLimit}
        onPageChange={(page) => setPagination({ currentPage: page })}
        onLimitChange={(newLimit) => {
          setPagination({ currentPage: 1, limit: newLimit });
        }}
      />
    </>
  );
}
