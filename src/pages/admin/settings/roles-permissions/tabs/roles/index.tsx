import type { RoleSummary } from "@/api/roles-permissions";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useHasPermission } from "@/hooks/use-has-permission";
import { usePermissionsMatrix } from "@/hooks/use-permissions-matrix";
import {
  useCreateRole,
  useDeleteRole,
  useResetRole,
  useSetRoleColor,
  useUpdateRole,
} from "@/hooks/use-role-mutations";
import { Box, Grid, Text } from "@chakra-ui/react";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { confirmAndRun } from "../../confirm-and-run";
import { RolesGridSkeleton } from "../../components/rbac-skeletons";
import { RoleCard } from "../../components/role-card";
import { RoleEditorDialog, type RoleEditorMode } from "../../components/role-editor-dialog";
import { ViewPermissionsDialog } from "../../components/view-permissions-dialog";
import { RolesDataProvider, useRolesData } from "./roles-data-context";
import { RolesFilters } from "./roles-filters";

/**
 * Every role except the locked firm-admin role — default or custom — can be
 * edited in place. Custom (firm-created) roles can also be deleted; the
 * four seeded defaults can instead be reset back to their factory
 * baseline, since a default role must always exist for staff to hold. Every
 * role, including super admin, can be duplicated via "Duplicate & customize",
 * which opens the same "Add custom role" dialog with its permissions
 * pre-filled — that same "extend from" picker is also available when
 * starting a brand-new role from scratch.
 */

function editorModeKey(mode: RoleEditorMode | null): string {
  if (!mode) return "empty";
  return mode.type === "create" ? `create:${mode.extendFrom?.name ?? ""}` : `edit:${mode.role.name}`;
}

function RolesContent() {
  const canManageRoles = useHasPermission("ac", "create");
  const { showConfirm } = useConfirmDialog();

  const {
    roles,
    allRoles,
    total,
    isLoading,
    currentPage,
    pageLimit,
    setPagination,
  } = useRolesData();
  const matrixQuery = usePermissionsMatrix();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const resetRole = useResetRole();
  const setRoleColor = useSetRoleColor();

  // Dialog visibility (`open`) is tracked separately from what it's showing
  // (`editorMode`); see `role-editor-dialog.tsx` for why.
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<RoleEditorMode | null>(null);
  const [viewingRoleName, setViewingRoleName] = useState<string | null>(null);

  const openCreate = useCallback(() => {
    setEditorMode({ type: "create" });
    setEditorOpen(true);
  }, []);
  const openDuplicate = useCallback((role: RoleSummary) => {
    setEditorMode({ type: "create", extendFrom: role });
    setEditorOpen(true);
  }, []);
  const openEdit = useCallback((role: RoleSummary) => {
    setEditorMode({ type: "edit", role });
    setEditorOpen(true);
  }, []);
  const onViewPermissions = useCallback((role: RoleSummary) => {
    setViewingRoleName(role.name);
  }, []);

  const handleDelete = useCallback(
    (role: RoleSummary) =>
      confirmAndRun(showConfirm, deleteRole.mutateAsync, role.name, {
        title: "Delete role",
        description:
          role.staffCount > 0
            ? `"${role.label}" still has ${role.staffCount} staff member(s) assigned — reassign them before deleting.`
            : `Are you sure you want to delete "${role.label}"? This action cannot be undone.`,
        confirmLabel: "Delete",
      }),
    [showConfirm, deleteRole.mutateAsync],
  );

  const handleReset = useCallback(
    (role: RoleSummary) =>
      confirmAndRun(showConfirm, resetRole.mutateAsync, role.name, {
        title: "Reset to default",
        description: `Restore "${role.label}" to its factory-default permissions? Any customizations will be lost.`,
        confirmLabel: "Reset",
      }),
    [showConfirm, resetRole.mutateAsync],
  );

  if (isLoading || matrixQuery.isLoading) {
    return <RolesGridSkeleton />;
  }

  const viewingRole = allRoles.find((r) => r.name === viewingRoleName) ?? null;

  return (
    <>
      <Text fontSize="12px" color="fg.muted" mb="12px" maxW="640px">
        Changes to permissions take effect immediately for all staff
        holding that role. Staff with multiple roles get the highest
        access level across all their assigned roles. Super admin
        permissions cannot be restricted.
      </Text>

      <RolesFilters />

      <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={{ base: "10px", md: "12px" }}>
        {roles.map((role) => (
          <RoleCard
            key={role.name}
            role={role}
            canManage={canManageRoles}
            onViewPermissions={onViewPermissions}
            onDuplicate={openDuplicate}
            onEdit={openEdit}
            onDelete={handleDelete}
            onReset={handleReset}
          />
        ))}
        {canManageRoles && (
          <Box
            as="button"
            onClick={openCreate}
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
              Add custom role
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

      <ViewPermissionsDialog
        open={viewingRoleName !== null}
        onOpenChange={(open) => {
          if (!open) setViewingRoleName(null);
        }}
        role={viewingRole}
      />

      <RoleEditorDialog
        key={editorModeKey(editorMode)}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onExitComplete={() => setEditorMode(null)}
        matrix={matrixQuery.data}
        roles={allRoles}
        mode={editorMode}
        saving={createRole.isPending || updateRole.isPending}
        onSave={({ role, permission, color, description }) => {
          createRole.mutate(
            { role, permission, color, description },
            { onSuccess: () => setEditorOpen(false) },
          );
        }}
        onUpdate={({ roleName, permission, color, label, description }) => {
          updateRole.mutate(
            { roleName, permission, label, description },
            {
              onSuccess: () => {
                setRoleColor.mutate({ roleName, color });
                setEditorOpen(false);
              },
            },
          );
        }}
      />
    </>
  );
}

export default function RbacRolesTab() {
  return (
    <RolesDataProvider>
      <RolesContent />
    </RolesDataProvider>
  );
}
