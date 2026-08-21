import type { RoleSummary } from "@/api/roles-permissions";
import type { StaffMemberDTO } from "@/hooks/use-staff-list";
import { useUpdateStaffRoles } from "@/hooks/use-update-staff-roles";
import { roleColorValue } from "@/lib/role-colors";
import { BrandButton } from "@/components/ui/intake-ui";
import {
  Box,
  Dialog,
  Flex,
  IconButton,
  Portal,
  ScrollArea,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import { X } from "lucide-react";
import { Controller, useForm, useWatch, type Control } from "react-hook-form";

type ManageRolesFormValues = {
  /** Keyed by role name — only assigned roles are present (and `true`). */
  roles: Record<string, boolean>;
};

function defaultsForMember(member: StaffMemberDTO | null): ManageRolesFormValues {
  const roles: Record<string, boolean> = {};
  for (const r of (member?.role ?? "").split(",").map((r) => r.trim()).filter(Boolean)) {
    roles[r] = true;
  }
  return { roles };
}

/** One row, wired to `roles.{role.name}` via `Controller` so toggling it
 * never re-renders the rest of the list. */
function RoleToggleRow({ control, role }: { control: Control<ManageRolesFormValues>; role: RoleSummary }) {
  return (
    <Controller
      control={control}
      name={`roles.${role.name}`}
      render={({ field }) => (
        <Flex
          justify="space-between"
          align="center"
          gap={3}
          py="8px"
          px="10px"
          borderRadius="8px"
          _hover={{ bg: "bg.subtle" }}
        >
          <Flex align="center" gap="8px" minW={0}>
            <Box w="9px" h="9px" borderRadius="full" bg={roleColorValue(role.color)} flexShrink={0} />
            <Box minW={0}>
              <Text fontSize="12.5px" fontWeight="500" color="fg">
                {role.label}
              </Text>
              {role.description && (
                <Text fontSize="11px" color="fg.muted" lineHeight="1.4">
                  {role.description}
                </Text>
              )}
            </Box>
          </Flex>
          <Switch.Root
            checked={!!field.value}
            onCheckedChange={(e) => field.onChange(e.checked)}
            size="sm"
            flexShrink={0}
          >
            <Switch.HiddenInput onBlur={field.onBlur} />
            <Switch.Control
              bg={field.value ? "brand.solid" : "bg.muted"}
              _hover={{ bg: field.value ? "brand.solid" : "bg.muted" }}
            >
              <Switch.Thumb bg="white" />
            </Switch.Control>
          </Switch.Root>
        </Flex>
      )}
    />
  );
}

/** Isolates the "at least one role" check + submit button to their own re-render scope. */
function SaveFooter({ control, saving }: { control: Control<ManageRolesFormValues>; saving: boolean }) {
  const roles = useWatch({ control, name: "roles" });
  const count = Object.values(roles ?? {}).filter(Boolean).length;

  return (
    <>
      {count === 0 && (
        <Text fontSize="11px" color="red.fg" mb="8px">
          At least one role must be assigned.
        </Text>
      )}
      <BrandButton w="full" type="submit" loading={saving} disabled={count === 0}>
        Save roles
      </BrandButton>
    </>
  );
}

/**
 * The only place roles are assigned to a staff member — the roles column in
 * the table below is display-only so a stray click can't silently change
 * someone's access. Selection is staged locally and only committed on Save.
 */
export function ManageStaffRolesDialog({
  open,
  onOpenChange,
  onExitComplete,
  member,
  roles,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExitComplete: () => void;
  member: StaffMemberDTO | null;
  roles: RoleSummary[];
}) {
  const updateRoles = useUpdateStaffRoles();
  const { control, handleSubmit } = useForm<ManageRolesFormValues>({
    defaultValues: defaultsForMember(member),
  });

  const onSubmit = (data: ManageRolesFormValues) => {
    if (!member) return;
    const selected = Object.entries(data.roles)
      .filter(([, checked]) => checked)
      .map(([name]) => name);
    if (selected.length === 0) return;
    updateRoles.mutate(
      { staffId: member.id, roles: selected },
      { onSuccess: () => onOpenChange(false) },
    );
  };

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
            maxW="440px"
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
                  Manage roles
                </Dialog.Title>
                <Dialog.Description mt="6px" fontSize="12px" color="fg.muted">
                  {member
                    ? `${member.firstName} ${member.lastName} — select one or more roles.`
                    : "Select one or more roles."}
                </Dialog.Description>
              </Box>

              <ScrollArea.Root flex="1" minH={0}>
                <ScrollArea.Viewport>
                  <ScrollArea.Content>
                    <VStack align="stretch" gap="4px" p="12px 24px 24px">
                      {roles.map((role) => (
                        <RoleToggleRow key={role.name} control={control} role={role} />
                      ))}
                      {roles.length === 0 && (
                        <Text fontSize="12px" color="fg.muted" textAlign="center" py={4}>
                          No roles available.
                        </Text>
                      )}
                    </VStack>
                  </ScrollArea.Content>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar orientation="vertical" />
                <ScrollArea.Corner />
              </ScrollArea.Root>

              <Box p="14px 24px 20px" borderTop="1px solid" borderColor="border">
                <SaveFooter control={control} saving={updateRoles.isPending} />
              </Box>
            </form>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
