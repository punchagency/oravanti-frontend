import { Stack, Text } from "@chakra-ui/react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { CasesFilters } from "../components/cases-filters";
import { CasesTable } from "../components/cases-table";
import { CasesMobileCard } from "../components/cases-mobile-card";
import { useCasesData } from "../cases-data-context";

export function AllMattersTab() {
  const { paginatedCases, isLoading, currentPage, pageLimit, pagination, setPagination } =
    useCasesData();

  return (
    <>
      <CasesFilters />

      {/* Desktop table */}
      <CasesTable cases={paginatedCases} isLoading={isLoading} />

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
        total={pagination.total}
        currentPage={currentPage}
        limit={pageLimit}
        onPageChange={(page) => setPagination({ currentPage: page })}
        onLimitChange={(newLimit) => {
          setPagination({ currentPage: 1, limit: newLimit });
        }}
      />
    </>
  );
}
