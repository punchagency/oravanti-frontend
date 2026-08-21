import type { RoleSummary } from "@/api/roles-permissions";
import { roleColorValue } from "@/lib/role-colors";
import {
  Box,
  Dialog,
  Flex,
  IconButton,
  Portal,
  ScrollArea,
  Text,
  VStack,
  Wrap,
} from "@chakra-ui/react";
import { Check, X } from "lucide-react";
import { useMemo } from "react";
import { RESOURCE_GROUPS } from "./resource-groups";

/** Read-only, focused view of exactly what one role can do — grouped the
 * same way as the full matrix, but scoped to a single role and its grants
 * only, since scanning a whole role × permission grid for one column is
 * needlessly noisy. Purely read-only, including the role's color — no
 * color picker here; that's an edit action and lives in `RoleEditorDialog`. */
export function ViewPermissionsDialog({
  open,
  onOpenChange,
  role,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleSummary | null;
}) {
  const colorValue = roleColorValue(role?.color);

  const groups = useMemo(() => {
    if (!role) return [];
    const out: { group: string; actions: { resource: string; action: string }[] }[] = [];
    for (const [group, resources] of Object.entries(RESOURCE_GROUPS)) {
      const actions: { resource: string; action: string }[] = [];
      for (const resource of resources) {
        for (const action of role.grants[resource] ?? []) {
          actions.push({ resource, action });
        }
      }
      if (actions.length > 0) out.push({ group, actions });
    }
    return out;
  }, [role]);

  const totalGrants = groups.reduce((sum, g) => sum + g.actions.length, 0);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => onOpenChange(details.open)}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1.5px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            w="full"
            maxW="520px"
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
            <Dialog.CloseTrigger asChild>
              <IconButton
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
              <Dialog.Title
                fontSize="16px"
                fontWeight="600"
                color="fg"
                display="flex"
                alignItems="center"
                gap="8px"
                pr="40px"
              >
                <Box w="10px" h="10px" borderRadius="full" bg={colorValue} flexShrink={0} />
                {role?.label ?? "Role"} permissions
              </Dialog.Title>
              <Dialog.Description mt="6px" fontSize="12px" color="fg.muted">
                {totalGrants} permission{totalGrants === 1 ? "" : "s"} granted
                {role ? ` · ${role.staffCount} staff` : ""}
              </Dialog.Description>
            </Box>

            <ScrollArea.Root flex="1" minH={0}>
              <ScrollArea.Viewport>
                <ScrollArea.Content>
                  <VStack align="stretch" gap="16px" p="12px 24px 24px">
                    {groups.length === 0 && (
                      <Text fontSize="12px" color="fg.muted">
                        This role has no permissions granted.
                      </Text>
                    )}
                    {groups.map(({ group, actions }) => (
                      <Box key={group}>
                        <Text
                          fontSize="11px"
                          fontWeight="600"
                          color="fg.muted"
                          textTransform="uppercase"
                          letterSpacing="0.4px"
                          mb="8px"
                        >
                          {group}
                        </Text>
                        <Wrap gap="6px">
                          {actions.map(({ resource, action }) => (
                            <Flex
                              key={`${resource}:${action}`}
                              align="center"
                              gap="6px"
                              border="1px solid"
                              borderColor="border.muted"
                              bg="bg.subtle"
                              borderRadius="8px"
                              px="10px"
                              py="6px"
                              fontSize="12px"
                              color="fg"
                            >
                              <Check size={12} color="var(--chakra-colors-green-solid)" />
                              {resource.replace(/_/g, " ")} — {action.replace(/_/g, " ")}
                            </Flex>
                          ))}
                        </Wrap>
                      </Box>
                    ))}
                  </VStack>
                </ScrollArea.Content>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar orientation="vertical" />
              <ScrollArea.Corner />
            </ScrollArea.Root>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
