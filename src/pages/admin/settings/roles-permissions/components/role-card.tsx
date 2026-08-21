import type { RoleSummary } from "@/api/roles-permissions";
import { Badge, Box, Button, Flex, Menu, Portal, Text } from "@chakra-ui/react";
import { Copy, EllipsisVertical, Lock, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { memo } from "react";
import { roleColorValue } from "@/lib/role-colors";

export const RoleCard = memo(function RoleCard({
  role,
  canManage,
  onViewPermissions,
  onDuplicate,
  onEdit,
  onDelete,
  onReset,
}: {
  role: RoleSummary;
  canManage: boolean;
  onViewPermissions: (role: RoleSummary) => void;
  onDuplicate: (role: RoleSummary) => void;
  onEdit: (role: RoleSummary) => void;
  onDelete: (role: RoleSummary) => void;
  onReset: (role: RoleSummary) => void;
}) {
  const isEditable = !role.locked;
  const isCustom = !role.isDefault;

  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      p="16px"
      bg="bg"
      minW={0}
    >
      <Flex justify="space-between" align="start" gap={2}>
        <Flex align="center" gap={2} wrap="wrap" minW={0} flex="1">
          <Box w="10px" h="10px" borderRadius="full" bg={roleColorValue(role.color)} flexShrink={0} />
          <Text fontSize="13px" fontWeight="600" color="fg" wordBreak="break-word">
            {role.label}
          </Text>
          {role.isDefault && (
            <Badge size="sm" variant="surface" colorPalette="gray">
              Default
            </Badge>
          )}
          {role.locked && (
            <Badge size="sm" variant="surface" colorPalette="orange">
              <Lock size={10} /> Locked
            </Badge>
          )}
        </Flex>
        <Flex align="center" gap={2} flexShrink={0}>
          <Text fontSize="11px" color="fg.muted" whiteSpace="nowrap">
            {role.staffCount} staff
          </Text>
          <Menu.Root positioning={{placement: "bottom-end"}}>
            <Menu.Trigger asChild>
              <Button size="xs" variant="ghost" color="fg.muted" p="2px" _hover={{ bg: "bg.muted" }}>
                <EllipsisVertical size={14} />
              </Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item value="view-permissions" onClick={() => onViewPermissions(role)}>
                    View permissions
                  </Menu.Item>
                  {canManage && (
                    <Menu.Item value="duplicate" onClick={() => onDuplicate(role)}>
                      <Copy size={12} />
                      Duplicate &amp; customize
                    </Menu.Item>
                  )}
                  {isEditable && canManage && (
                    <Menu.Item value="edit" onClick={() => onEdit(role)}>
                      <Pencil size={12} />
                      Edit
                    </Menu.Item>
                  )}
                  {isEditable && !isCustom && canManage && (
                    <Menu.Item value="reset" onClick={() => onReset(role)}>
                      <RotateCcw size={12} />
                      Reset to default
                    </Menu.Item>
                  )}
                  {isEditable && isCustom && canManage && (
                    <Menu.Item
                      value="delete"
                      color="red.fg"
                      _hover={{ bg: "red.subtle" }}
                      onClick={() => onDelete(role)}
                    >
                      <Trash2 size={12} />
                      Delete
                    </Menu.Item>
                  )}
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </Flex>
      </Flex>

      <Text fontSize="12px" color="fg.muted" mt="8px" lineHeight="1.4">
        {role.description || "No description."}
      </Text>
    </Box>
  );
});
