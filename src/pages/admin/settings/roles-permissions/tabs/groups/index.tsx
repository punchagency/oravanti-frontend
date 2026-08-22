import type { RoleGroupSummary } from "@/api/role-groups";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useHasPermission } from "@/hooks/use-has-permission";
import {
  useAddGroupMember,
  useCreateRoleGroup,
  useDeleteRoleGroup,
  useRemoveGroupMember,
  useUpdateRoleGroup,
} from "@/hooks/use-role-groups";
import { useRoles } from "@/hooks/use-roles";
import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { confirmAndRun } from "../../confirm-and-run";
import { GroupsGridSkeleton } from "../../components/rbac-skeletons";
import { RoleGroupCard } from "../../components/role-group-card";
import { GroupEditorDialog, type GroupEditorMode } from "../../components/group-editor-dialog";
import { MemberManagementDialog } from "../../components/member-management-dialog";
import { RbacSearchInput } from "../../components/rbac-search-input";
import { GroupsDataProvider, useGroupsData } from "./groups-data-context";

function groupEditorModeKey(mode: GroupEditorMode | null): string {
  if (!mode) return "empty";
  return mode.type === "create" ? `create:${mode.duplicateFrom?.id ?? ""}` : `edit:${mode.group.id}`;
}

function GroupsContent() {
  const canManageRoles = useHasPermission("ac", "create");
  const { showConfirm } = useConfirmDialog();

  const {
    groups,
    total,
    isLoading,
    searchQuery,
    setSearchQuery,
    currentPage,
    pageLimit,
    setPagination,
  } = useGroupsData();
  const rolesQuery = useRoles();
  const createGroup = useCreateRoleGroup();
  const updateGroup = useUpdateRoleGroup();
  const deleteGroup = useDeleteRoleGroup();
  const addGroupMember = useAddGroupMember();
  const removeGroupMember = useRemoveGroupMember();

  const [groupEditorOpen, setGroupEditorOpen] = useState(false);
  const [groupEditorMode, setGroupEditorMode] = useState<GroupEditorMode | null>(null);
  const [managingGroupId, setManagingGroupId] = useState<string | null>(null);

  const openCreateGroup = useCallback(() => {
    setGroupEditorMode({ type: "create" });
    setGroupEditorOpen(true);
  }, []);
  const openEditGroup = useCallback((group: RoleGroupSummary) => {
    setGroupEditorMode({ type: "edit", group });
    setGroupEditorOpen(true);
  }, []);
  const openDuplicateGroup = useCallback((group: RoleGroupSummary) => {
    setGroupEditorMode({ type: "create", duplicateFrom: group });
    setGroupEditorOpen(true);
  }, []);

  const handleGroupDelete = useCallback(
    (group: RoleGroupSummary) =>
      confirmAndRun(showConfirm, deleteGroup.mutateAsync, group.id, {
        title: "Delete role group",
        description:
          group.memberCount > 0
            ? `"${group.name}" still has ${group.memberCount} member(s) — remove them first.`
            : `Are you sure you want to delete "${group.name}"? This action cannot be undone.`,
        confirmLabel: "Delete",
      }),
    [showConfirm, deleteGroup.mutateAsync],
  );

  if (isLoading || rolesQuery.isLoading) {
    return <GroupsGridSkeleton />;
  }

  return (
    <>
      <Text fontSize="12px" color="fg.muted" mb="12px" maxW="640px">
        Bundle roles into named groups. Add a staff member to a group and
        they inherit all of its roles instantly — no need to assign each
        role individually.
      </Text>

      <Flex direction={{ base: "column", lg: "row" }} gap={3} mb={4} justify="space-between" align={{ lg: "center" }}>
        <RbacSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name or role…"
        />
        <Text
          textStyle="body-sm"
          color="fg.muted"
          whiteSpace="nowrap"
          mt={{ base: 1, lg: 0 }}
          display={{ base: "none", md: "block" }}
        >
          {total} group{total !== 1 ? "s" : ""}
        </Text>
      </Flex>

      <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={{ base: "10px", md: "12px" }}>
        {groups.map((group) => (
          <RoleGroupCard
            key={group.id}
            group={group}
            canManage={canManageRoles}
            onEdit={openEditGroup}
            onDelete={handleGroupDelete}
            onDuplicate={openDuplicateGroup}
            onManageMembers={(group) => setManagingGroupId(group.id)}
          />
        ))}
        {canManageRoles && (
          <Box
            as="button"
            onClick={openCreateGroup}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap="6px"
            border="1px dashed"
            borderColor="border.emphasized"
            borderRadius="10px"
            p="16px"
            color="fg.muted"
            _hover={{ borderColor: "brand.solid", color: "brand.solid" }}
            minH="120px"
          >
            <Plus size={18} />
            <Text fontSize="12px" fontWeight="500">
              Add role group
            </Text>
          </Box>
        )}
      </Grid>

      {total > 0 && (
        <PaginationControls
          total={total}
          currentPage={currentPage}
          limit={pageLimit}
          onPageChange={(page) => setPagination({ currentPage: page, limit: pageLimit })}
          onLimitChange={(limit) => setPagination({ currentPage: 1, limit })}
        />
      )}

      <GroupEditorDialog
        key={groupEditorModeKey(groupEditorMode)}
        open={groupEditorOpen}
        onOpenChange={setGroupEditorOpen}
        onExitComplete={() => setGroupEditorMode(null)}
        mode={groupEditorMode}
        roles={rolesQuery.data?.roles ?? []}
        saving={createGroup.isPending || updateGroup.isPending}
        onSave={(data) => {
          if (data.groupId) {
            updateGroup.mutate(
              { groupId: data.groupId, name: data.name, description: data.description, roles: data.roles },
              { onSuccess: () => setGroupEditorOpen(false) },
            );
          } else {
            createGroup.mutate(
              { name: data.name, description: data.description, roles: data.roles },
              { onSuccess: () => setGroupEditorOpen(false) },
            );
          }
        }}
      />

      <MemberManagementDialog
        groupId={managingGroupId}
        open={managingGroupId !== null}
        onOpenChange={(open) => {
          if (!open) setManagingGroupId(null);
        }}
        onAdd={(memberId) => {
          if (managingGroupId) addGroupMember.mutate({ groupId: managingGroupId, memberId });
        }}
        onRemove={(memberId) => {
          if (managingGroupId) removeGroupMember.mutate({ groupId: managingGroupId, memberId });
        }}
      />
    </>
  );
}

export default function RbacGroupsTab() {
  return (
    <GroupsDataProvider>
      <GroupsContent />
    </GroupsDataProvider>
  );
}
