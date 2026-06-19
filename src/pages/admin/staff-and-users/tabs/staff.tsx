import { PaginationControls } from "../components/pagination-controls";
import { StaffFilters } from "../components/staff-filters";
import { StaffMobileSkeleton } from "../components/staff-mobile-skeleton";
import { StaffStatusSummary } from "../components/staff-status-summary";
import { StaffTable } from "../components/staff-table";
import { StaffTableSkeleton } from "../components/staff-table-skeleton";
import { StaffDataProvider, useStaffData } from "../staff-data-context";
import { StaffMobileList } from "../components/staff-mobile-list";

function StaffContent() {
  const { isLoading, pagination, currentPage, pageLimit, setPagination } =
    useStaffData();

  if (isLoading) {
    return (
      <>
        <StaffStatusSummary />
        <StaffFilters />
        <StaffTableSkeleton />
        <StaffMobileSkeleton />
      </>
    );
  }

  return (
    <>
      <StaffStatusSummary />
      <StaffFilters />
      <StaffTable />
      <StaffMobileList />
      {pagination.total > 0 && (
        <PaginationControls
          total={pagination.total}
          page={currentPage}
          limit={pageLimit}
          onPageChange={(page) => setPagination({ currentPage: page, limit: pageLimit })}
          onLimitChange={(limit) => setPagination({ currentPage: 1, limit })}
        />
      )}
    </>
  );
}

export default function Staff() {
  return (
    <StaffDataProvider>
      <StaffContent />
    </StaffDataProvider>
  );
}
