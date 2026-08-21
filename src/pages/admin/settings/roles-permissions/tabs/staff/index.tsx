import { PaginationControls } from "@/components/ui/pagination-controls";
import { Text } from "@chakra-ui/react";
import { StaffTableSkeleton } from "../../components/rbac-skeletons";
import { StaffRoleTable } from "../../components/staff-role-table";
import { MembersDataProvider, useMembersData } from "./members-data-context";
import { MembersFilters } from "./members-filters";

function MembersContent() {
  const {
    members,
    total,
    isLoading,
    roles,
    groupsByMember,
    currentPage,
    pageLimit,
    setPagination,
  } = useMembersData();

  if (isLoading) {
    return <StaffTableSkeleton />;
  }

  return (
    <>
      <Text fontSize="12px" color="fg.muted" mb="12px">
        Assign one or more roles to each staff member from the "Manage
        roles" action. Staff with multiple roles receive the highest
        access level across all assigned roles.
      </Text>

      <MembersFilters />
      <StaffRoleTable staff={members} roles={roles} staffGroups={groupsByMember} />

      {total > 0 && (
        <PaginationControls
          total={total}
          currentPage={currentPage}
          limit={pageLimit}
          onPageChange={(page) => setPagination({ currentPage: page, limit: pageLimit })}
          onLimitChange={(limit) => setPagination({ currentPage: 1, limit })}
        />
      )}
    </>
  );
}

export default function RbacStaffTab() {
  return (
    <MembersDataProvider>
      <MembersContent />
    </MembersDataProvider>
  );
}
