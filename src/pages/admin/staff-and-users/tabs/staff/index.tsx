import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PageTitle } from "@/components/layout/shared/nav-context";
import { useCanCreateStaff } from "@/hooks/use-can-create-staff";
import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import { Download, UserPlus } from "lucide-react";
import { InviteStaffDialog } from "../../invite-staff/dialog";
import { StaffFilters } from "./components/staff-filters";
import { StaffMobileList } from "./components/staff-mobile-list";
import { StaffMobileSkeleton } from "./components/staff-mobile-skeleton";
import { StaffStatusSummary } from "./components/staff-status-summary";
import { StaffTable } from "./components/staff-table";
import { StaffTableSkeleton } from "./components/staff-table-skeleton";
import { StaffDataProvider, useStaffData } from "./staff-data-context";

function StaffContent() {
  const { isLoading, pagination, currentPage, pageLimit, setPagination } =
    useStaffData();
  const canCreateStaff = useCanCreateStaff();

  return (
    <>
      <Flex
        as="header"
        direction={{ base: "column", md: "row" }}
        align={{ base: "stretch", md: "flex-start" }}
        justify="space-between"
        gap="16px"
        pb="16px"
      >
        <Box>
          <PageTitle>
            <Text
              as="h1"
              m="0"
              color="fg"
              fontSize="22px"
              fontWeight="500"
              lineHeight="1.2"
            >
              Staff
            </Text>
          </PageTitle>
          <Text m="6px 0 0" color="fg.muted" fontSize="13px">
            Manage staff accounts and view team members
          </Text>
        </Box>
        <HStack gap="8px" w={{ base: "full", md: "auto" }}>
          <OutlineButton flex={{ base: 1, md: "initial" }}>
            <Download size={14} />
            Export
          </OutlineButton>
          {canCreateStaff && (
            <InviteStaffDialog>
              <BrandButton flex={{ base: 1, md: "initial" }}>
                <UserPlus size={15} />
                Invite staff
              </BrandButton>
            </InviteStaffDialog>
          )}
        </HStack>
      </Flex>

      {isLoading ? (
        <>
          <StaffStatusSummary />
          <StaffFilters />
          <StaffTableSkeleton />
          <StaffMobileSkeleton />
        </>
      ) : (
        <>
          <StaffStatusSummary />
          <StaffFilters />
          <StaffTable />
          <StaffMobileList />
          {pagination.total > 0 && (
            <PaginationControls
              total={pagination.total}
              currentPage={currentPage}
              limit={pageLimit}
              onPageChange={(page) =>
                setPagination({ currentPage: page, limit: pageLimit })
              }
              onLimitChange={(limit) =>
                setPagination({ currentPage: 1, limit })
              }
            />
          )}
        </>
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
