import type { PermissionsMatrix, RoleSummary } from "@/api/roles-permissions";
import { BrandButton } from "@/components/ui/intake-ui";
import { DEFAULT_ROLE_COLOR, roleColorValue } from "@/lib/role-colors";
import {
  Box,
  Combobox,
  Dialog,
  Field,
  Grid,
  Input,
  Portal,
  ScrollArea,
  Switch,
  Text,
  Textarea,
  VStack,
  IconButton,
  createListCollection,
} from "@chakra-ui/react";
import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch, type Control } from "react-hook-form";
import { ColorSwatchField } from "./color-swatch-field";
import { RESOURCE_GROUPS } from "./resource-groups";

const slugify = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

export type RoleEditorMode =
  | { type: "create"; extendFrom?: RoleSummary }
  | { type: "edit"; role: RoleSummary };

type RoleFormValues = {
  name: string;
  description: string;
  color: string;
  /** Keyed by `"resource:action"` — only granted permissions are present (and `true`). */
  permissions: Record<string, boolean>;
};

function seedFromRole(role: RoleSummary, { asCopy }: { asCopy: boolean }): RoleFormValues {
  const permissions: Record<string, boolean> = {};
  for (const [resource, actions] of Object.entries(role.grants)) {
    for (const action of actions) permissions[`${resource}:${action}`] = true;
  }
  return {
    name: asCopy ? `${role.label}_copy` : role.label,
    description: role.description ?? "",
    color: roleColorValue(role.color ?? DEFAULT_ROLE_COLOR),
    permissions,
  };
}

const EMPTY_VALUES: RoleFormValues = { name: "", description: "", color: DEFAULT_ROLE_COLOR, permissions: {} };

function defaultsForMode(mode: RoleEditorMode | null): RoleFormValues {
  if (!mode) return EMPTY_VALUES;
  if (mode.type === "edit") return seedFromRole(mode.role, { asCopy: false });
  return mode.extendFrom ? seedFromRole(mode.extendFrom, { asCopy: true }) : EMPTY_VALUES;
}

/**
 * One switch, wired to its own `permissions.{resource}:{action}` field via
 * `Controller`. `Controller` subscribes only to that field path, so toggling
 * one permission — or retyping the name/description above — never re-renders
 * the other ~100 switches in the grid.
 */
function PermissionSwitchField({
  control,
  permKey,
  label,
}: {
  control: Control<RoleFormValues>;
  permKey: string;
  label: string;
}) {
  return (
    <Controller
      control={control}
      name={`permissions.${permKey}`}
      render={({ field }) => (
        <Switch.Root
          size="sm"
          checked={!!field.value}
          onCheckedChange={(e) => field.onChange(e.checked)}
        >
          <Switch.HiddenInput onBlur={field.onBlur} />
          <Switch.Control
            bg={field.value ? "brand.solid" : "bg.muted"}
            _hover={{ bg: field.value ? "brand.solid" : "bg.muted" }}
          >
            <Switch.Thumb bg="white" />
          </Switch.Control>
          <Switch.Label fontSize="12px" color="fg">
            {label}
          </Switch.Label>
        </Switch.Root>
      )}
    />
  );
}

/**
 * Isolates the name field's live "required" check to just this button —
 * `useWatch` re-renders only `SaveButton`, not the whole dialog, on every
 * keystroke in the name input.
 */
function SaveButton({
  control,
  isEdit,
  saving,
}: {
  control: Control<RoleFormValues>;
  isEdit: boolean;
  saving: boolean;
}) {
  const name = useWatch({ control, name: "name" });
  return (
    <BrandButton w="full" type="submit" loading={saving} disabled={!isEdit && !name?.trim()}>
      {isEdit ? "Save changes" : "Add role"}
    </BrandButton>
  );
}

/**
 * Create a new custom role — optionally starting from a search-picked
 * existing role's permissions (including the locked firm-admin role) — or
 * edit an existing non-locked role's permissions in place. A default role
 * can be edited directly too, since the four defaults are real, editable,
 * resettable rows now, not compiled-in statements. Only the locked
 * firm-admin role can never be edited directly (only extended from). The
 * grid is grouped and filtered the same way as the matrix/view dialog
 * (`RESOURCE_GROUPS`), so better-auth's own internal resources
 * (organization/member/invitation/team) never show up as toggles here.
 */
export function RoleEditorDialog({
  open,
  onOpenChange,
  onExitComplete,
  matrix,
  roles,
  mode,
  onSave,
  onUpdate,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExitComplete: () => void;
  matrix: PermissionsMatrix | undefined;
  roles: RoleSummary[];
  mode: RoleEditorMode | null;
  onSave: (input: {
    role: string;
    permission: Record<string, string[]>;
    color: string;
    description: string;
  }) => void;
  onUpdate: (input: {
    roleName: string;
    permission: Record<string, string[]>;
    color: string;
    label?: string;
    description: string;
  }) => void;
  saving: boolean;
}) {
  // `defaultValues` is only read on this initial mount — the parent remounts
  // this dialog (via a `key` on the mode's identity) whenever a *new* role
  // is opened, so this naturally reseeds without needing `reset()`.
  const { control, register, handleSubmit, setValue } = useForm<RoleFormValues>({
    defaultValues: defaultsForMode(mode),
  });

  const [extendFromName, setExtendFromName] = useState<string | null>(
    mode?.type === "create" ? (mode.extendFrom?.name ?? null) : null,
  );
  const [extendSearch, setExtendSearch] = useState("");

  const groupedResources = useMemo(() => {
    if (!matrix) return [];
    const out: { group: string; resources: [string, readonly string[]][] }[] = [];
    for (const [group, resourceNames] of Object.entries(RESOURCE_GROUPS)) {
      const resources: [string, readonly string[]][] = [];
      for (const resource of resourceNames) {
        const actions = matrix.resources[resource];
        if (actions) resources.push([resource, actions]);
      }
      if (resources.length > 0) out.push({ group, resources });
    }
    return out;
  }, [matrix]);

  const extendCollection = useMemo(
    () =>
      createListCollection({
        items: roles.map((r) => ({
          value: r.name,
          label: r.label,
          description: r.description ?? "",
        })),
      }),
    [roles],
  );

  const filteredExtendItems = extendSearch
    ? extendCollection.items.filter(
        (item) =>
          item.label.toLowerCase().includes(extendSearch.toLowerCase()) ||
          item.description.toLowerCase().includes(extendSearch.toLowerCase()),
      )
    : extendCollection.items;

  // Always mounted (see index.tsx) so this can run before the dialog has ever
  // been opened — bail after the hooks above, once, rather than guarding
  // every field access below.
  if (!mode) return null;
  const isEdit = mode.type === "edit";

  // Re-seeds *only* the permission grid from the picked role — name, color,
  // and description the user already typed are left alone (previously this
  // clobbered them, which was the bug: picking "extend from" after already
  // naming the role wiped out what you'd typed).
  const applyExtendFrom = (roleName: string | null) => {
    setExtendFromName(roleName);
    const source = roleName ? (roles.find((r) => r.name === roleName) ?? null) : null;
    setValue("permissions", source ? seedFromRole(source, { asCopy: true }).permissions : {}, {
      shouldDirty: true,
    });
  };

  const onSubmit = (data: RoleFormValues) => {
    const permission: Record<string, string[]> = {};
    for (const [key, checked] of Object.entries(data.permissions)) {
      if (!checked) continue;
      const [resource, action] = key.split(":");
      if (!resource || !action) continue;
      (permission[resource] ??= []).push(action);
    }
    if (isEdit) {
      const label = !mode.role.isDefault && data.name.trim() ? data.name.trim() : undefined;
      onUpdate({ roleName: mode.role.name, permission, color: data.color, label, description: data.description });
    } else {
      onSave({ role: slugify(data.name), permission, color: data.color, description: data.description });
    }
  };

  const title = isEdit ? `Edit "${mode.role.label}" permissions` : "Add custom role";
  const descriptionText = isEdit
    ? "Adjust what this role can do. Changes apply immediately to every staff member holding it."
    : "Name the role, optionally start from an existing role's permissions, then adjust freely.";

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
            maxW="640px"
            maxH="85vh"
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
                  {descriptionText}
                </Dialog.Description>
              </Box>

              <ScrollArea.Root flex="1" minH={0}>
                <ScrollArea.Viewport>
                  <ScrollArea.Content>
                    <VStack align="stretch" gap="14px" p="12px 24px 24px">
                      {/* Color picker — top of form */}
                      <Field.Root>
                        <Field.Label fontSize="12px">Role color</Field.Label>
                        <Controller
                          control={control}
                          name="color"
                          render={({ field }) => (
                            <ColorSwatchField value={field.value} onChange={field.onChange} triggerSize="22px" />
                          )}
                        />
                      </Field.Root>

                      {/* Role name */}
                      {isEdit ? (
                        <Field.Root>
                          <Field.Label fontSize="12px">
                            Role name
                            {!mode.role.isDefault && <Field.RequiredIndicator />}
                          </Field.Label>
                          <Input
                            size="sm"
                            {...register("name")}
                            readOnly={mode.role.isDefault}
                            disabled={mode.role.isDefault}
                          />
                        </Field.Root>
                      ) : (
                        <Field.Root>
                          <Field.Label fontSize="12px">
                            Role name
                            <Field.RequiredIndicator />
                          </Field.Label>
                          <Input size="sm" placeholder="e.g. billing_coordinator" {...register("name")} />
                        </Field.Root>
                      )}

                      {/* Description */}
                      <Field.Root>
                        <Field.Label fontSize="12px">Description</Field.Label>
                        <Textarea
                          size="sm"
                          rows={2}
                          placeholder="Brief summary of what this role does..."
                          resize="none"
                          {...register("description")}
                        />
                      </Field.Root>

                      {/* Extend from — create mode only */}
                      {!isEdit && (
                        <Field.Root>
                          <Field.Label fontSize="12px">Extend from (optional)</Field.Label>
                          <Combobox.Root
                            collection={extendCollection}
                            size="sm"
                            value={extendFromName ? [extendFromName] : []}
                            inputValue={extendSearch}
                            onInputValueChange={(e) => setExtendSearch(e.inputValue)}
                            onValueChange={(e) => {
                              applyExtendFrom(e.value[0] ?? null);
                              setExtendSearch("");
                            }}
                            positioning={{ sameWidth: true }}
                            openOnClick
                          >
                            <Combobox.Control>
                              <Combobox.Input placeholder="Search roles by name or description..." fontSize="13px" />
                              <Combobox.IndicatorGroup>
                                {extendFromName && <Combobox.ClearTrigger />}
                                <Combobox.Trigger />
                              </Combobox.IndicatorGroup>
                            </Combobox.Control>
                            <Portal>
                              <Combobox.Positioner>
                                <Combobox.Content>
                                  {filteredExtendItems.length === 0 ? (
                                    <Text p={3} fontSize="sm" color="fg.muted">
                                      No roles match your search
                                    </Text>
                                  ) : (
                                    filteredExtendItems.map((item) => (
                                      <Combobox.Item key={item.value} item={item} py={1.5}>
                                        <VStack align="start" gap="1px">
                                          <Combobox.ItemText>{item.label}</Combobox.ItemText>
                                          {item.description && (
                                            <Text fontSize="10px" color="fg.muted" lineClamp={1}>
                                              {item.description}
                                            </Text>
                                          )}
                                        </VStack>
                                        <Combobox.ItemIndicator />
                                      </Combobox.Item>
                                    ))
                                  )}
                                </Combobox.Content>
                              </Combobox.Positioner>
                            </Portal>
                          </Combobox.Root>
                          <Text fontSize="10.5px" color="fg.muted" mt="4px">
                            Pre-fills the permissions below — adjust freely from there.
                          </Text>
                        </Field.Root>
                      )}

                      {/* Permission grid */}
                      <VStack align="stretch" gap="18px">
                        {groupedResources.map(({ group, resources }) => (
                          <Box key={group}>
                            <Text fontSize="11px" fontWeight="700" color="fg" mb="8px">
                              {group}
                            </Text>
                            <VStack align="stretch" gap="10px">
                              {resources.map(([resource, actions]) => (
                                <Box key={resource}>
                                  <Text fontSize="10px" fontWeight="600" color="fg.muted" textTransform="uppercase" mb="6px">
                                    {resource.replace(/_/g, " ")}
                                  </Text>
                                  <Grid templateColumns="repeat(auto-fill, minmax(160px, 1fr))" gap="8px">
                                    {actions.map((action) => {
                                      const key = `${resource}:${action}`;
                                      return (
                                        <PermissionSwitchField
                                          key={key}
                                          control={control}
                                          permKey={key}
                                          label={action.replace(/_/g, " ")}
                                        />
                                      );
                                    })}
                                  </Grid>
                                </Box>
                              ))}
                            </VStack>
                          </Box>
                        ))}
                      </VStack>
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
