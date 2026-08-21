import type { RoleGroupSummary } from "@/api/role-groups";
import type { RoleSummary } from "@/api/roles-permissions";
import { BrandButton } from "@/components/ui/intake-ui";
import { roleColorValue } from "@/lib/role-colors";
import {
  Badge,
  Box,
  Button,
  Dialog,
  Field,
  Flex,
  IconButton,
  Input,
  Portal,
  ScrollArea,
  Switch,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch, type Control } from "react-hook-form";

export type GroupEditorMode =
  | { type: "create"; duplicateFrom?: RoleGroupSummary }
  | { type: "edit"; group: RoleGroupSummary };

type GroupFormValues = {
  name: string;
  description: string;
  /** Keyed by role name — only selected roles are present (and `true`). */
  roles: Record<string, boolean>;
};

const EMPTY_VALUES: GroupFormValues = { name: "", description: "", roles: {} };

function seedFromGroup(group: RoleGroupSummary, { asCopy }: { asCopy: boolean }): GroupFormValues {
  const roles: Record<string, boolean> = {};
  for (const r of group.roles ?? []) roles[r] = true;
  return {
    name: asCopy ? `${group.name} copy` : group.name,
    description: group.description ?? "",
    roles,
  };
}

function defaultsForMode(mode: GroupEditorMode | null): GroupFormValues {
  if (!mode) return EMPTY_VALUES;
  if (mode.type === "edit") return seedFromGroup(mode.group, { asCopy: false });
  return mode.duplicateFrom ? seedFromGroup(mode.duplicateFrom, { asCopy: true }) : EMPTY_VALUES;
}

/** One row, wired to `roles.{roleName}` via `Controller` so toggling it — or
 * typing in the name/description/search fields — never re-renders the rest
 * of the role list. */
function RoleToggleRow({
  control,
  role,
}: {
  control: Control<GroupFormValues>;
  role: RoleSummary;
}) {
  return (
    <Controller
      control={control}
      name={`roles.${role.name}`}
      render={({ field }) => (
        <Flex
          align="center"
          gap="8px"
          p="4px 6px"
          borderRadius="6px"
          _hover={{ bg: "bg.muted" }}
          cursor="pointer"
          onClick={() => field.onChange(!field.value)}
        >
          <Switch.Root checked={!!field.value} size="sm" pointerEvents="none">
            <Switch.HiddenInput />
            <Switch.Control
              bg={field.value ? "brand.solid" : "bg.muted"}
              _hover={{ bg: field.value ? "brand.solid" : "bg.muted" }}
            >
              <Switch.Thumb bg="white" />
            </Switch.Control>
          </Switch.Root>
          <Box w="8px" h="8px" borderRadius="full" bg={roleColorValue(role.color)} flexShrink={0} />
          <Text fontSize="12px" color="fg" flex="1">
            {role.label}
          </Text>
          {role.name === "owner" && (
            <Badge size="sm" variant="surface" colorPalette="orange" fontSize="9px">
              Super admin
            </Badge>
          )}
        </Flex>
      )}
    />
  );
}

/** Isolates the "selected roles" summary badges to their own re-render scope. */
function SelectedRoleBadges({
  control,
  assignableRoles,
}: {
  control: Control<GroupFormValues>;
  assignableRoles: RoleSummary[];
}) {
  const roles = useWatch({ control, name: "roles" });
  const selected = Object.entries(roles ?? {})
    .filter(([, checked]) => checked)
    .map(([name]) => name);

  if (selected.length === 0) return null;

  return (
    <Flex gap="4px" mt="6px" wrap="wrap">
      {selected.map((r) => (
        <Badge key={r} size="sm" variant="surface" colorPalette="blue" fontSize="10px">
          {assignableRoles.find((ar) => ar.name === r)?.label ?? r.replace(/_/g, " ")}
        </Badge>
      ))}
    </Flex>
  );
}

/** Isolates the name field's live "required" check to just this button. */
function SaveButton({ control, isEdit, saving }: { control: Control<GroupFormValues>; isEdit: boolean; saving: boolean }) {
  const name = useWatch({ control, name: "name" });
  return (
    <BrandButton w="full" type="submit" loading={saving} disabled={!name?.trim()}>
      {isEdit ? "Save changes" : "Create group"}
    </BrandButton>
  );
}

export function GroupEditorDialog({
  open,
  onOpenChange,
  onExitComplete,
  mode,
  roles,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExitComplete: () => void;
  mode: GroupEditorMode | null;
  roles: RoleSummary[];
  onSave: (input: { groupId?: string; name: string; description: string; roles: string[] }) => void;
  saving: boolean;
}) {
  const { control, register, handleSubmit } = useForm<GroupFormValues>({
    defaultValues: defaultsForMode(mode),
  });
  const [roleSearch, setRoleSearch] = useState("");

  const assignableRoles = useMemo(
    () => roles.filter((r) => !["client", "contractor"].includes(r.name)),
    [roles],
  );

  const filteredRoles = roleSearch
    ? assignableRoles.filter(
        (r) =>
          r.label.toLowerCase().includes(roleSearch.toLowerCase()) ||
          r.name.toLowerCase().includes(roleSearch.toLowerCase()),
      )
    : assignableRoles;

  // Always mounted (see index.tsx) so this can run before the dialog has
  // ever been opened — bail after the hooks above, once.
  if (!mode) return null;
  const isEdit = mode.type === "edit";

  const onSubmit = (data: GroupFormValues) => {
    onSave({
      ...(isEdit ? { groupId: mode.group.id } : {}),
      name: data.name.trim(),
      description: data.description,
      roles: Object.entries(data.roles)
        .filter(([, checked]) => checked)
        .map(([name]) => name),
    });
  };

  const title = isEdit ? `Edit "${mode.group.name}"` : "Create role group";

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => onOpenChange(details.open)}
      onExitComplete={onExitComplete}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1.5px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            w="full"
            maxW="520px"
            maxH="80vh"
            border="1px solid"
            borderColor="border"
            borderRadius="14px"
            bg="bg"
            p="0"
            boxShadow="0 24px 70px rgba(0, 0, 0, 0.26)"
            display="flex"
            flexDirection="column"
          >
            <form
              onSubmit={handleSubmit(onSubmit)}
              style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
            >
              <Dialog.CloseTrigger asChild>
                <IconButton
                  type="button"
                  aria-label="Close"
                  position="absolute"
                  top="22px"
                  right="22px"
                  size="xs"
                  variant="outline"
                  borderRadius="8px"
                >
                  <X size={14} />
                </IconButton>
              </Dialog.CloseTrigger>

              <Box p="24px 24px 16px" borderBottom="1px solid" borderColor="border.muted">
                <Dialog.Title fontSize="16px" fontWeight="600" color="fg">
                  {title}
                </Dialog.Title>
                <Dialog.Description mt="6px" fontSize="12px" color="fg.muted">
                  {isEdit
                    ? "Update the group's roles. Members will inherit changes immediately."
                    : "Name the group, pick which roles its members inherit, then add staff to it."}
                </Dialog.Description>
              </Box>

              <ScrollArea.Root flex="1" minH={0}>
                <ScrollArea.Viewport>
                  <ScrollArea.Content>
                    <VStack align="stretch" gap="14px" p="12px 24px 24px">
                      <Field.Root>
                        <Field.Label fontSize="12px">
                          Group name
                          <Field.RequiredIndicator />
                        </Field.Label>
                        <Input size="sm" placeholder="e.g. Litigation Team, Intake Staff" {...register("name")} />
                      </Field.Root>

                      <Field.Root>
                        <Field.Label fontSize="12px">Description</Field.Label>
                        <Textarea
                          size="sm"
                          rows={2}
                          placeholder="What this group is for..."
                          resize="none"
                          {...register("description")}
                        />
                      </Field.Root>

                      <Field.Root>
                        <Field.Label fontSize="12px">Roles inherited by this group</Field.Label>
                        <Box
                          border="1px solid"
                          borderColor="border"
                          borderRadius="8px"
                          p="10px"
                          maxH="240px"
                          overflowY="auto"
                          w="full"
                        >
                          <Flex align="center" gap="2" mb="8px" pb="8px" borderBottom="1px solid" borderColor="border">
                            <Search size={14} color="fg.muted" />
                            <Input
                              size="xs"
                              placeholder="Search roles..."
                              value={roleSearch}
                              onChange={(e) => setRoleSearch(e.target.value)}
                              variant="subtle"
                              flex="1"
                              bg="transparent"
                            />
                            {roleSearch && (
                              <Button
                                type="button"
                                size="xs"
                                variant="ghost"
                                color="fg.muted"
                                onClick={() => setRoleSearch("")}
                                p="0"
                                minW="auto"
                              >
                                <X size={12} />
                              </Button>
                            )}
                          </Flex>
                          <VStack align="stretch" gap="2">
                            {filteredRoles.map((role) => (
                              <RoleToggleRow key={role.name} control={control} role={role} />
                            ))}
                            {filteredRoles.length === 0 && (
                              <Text p={2} fontSize="11px" color="fg.muted" textAlign="center">
                                No roles match
                              </Text>
                            )}
                          </VStack>
                        </Box>
                        <SelectedRoleBadges control={control} assignableRoles={assignableRoles} />
                      </Field.Root>
                    </VStack>
                  </ScrollArea.Content>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar orientation="vertical" />
                <ScrollArea.Corner />
              </ScrollArea.Root>

              <Box p="14px 24px 20px" borderTop="1px solid" borderColor="border">
                <SaveButton control={control} isEdit={isEdit} saving={saving} />
              </Box>
            </form>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
