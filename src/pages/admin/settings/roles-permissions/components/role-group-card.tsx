import type { RoleGroupSummary } from "@/api/role-groups";
import { Badge, Box, Button, Flex, Menu, Portal, Text, Wrap, WrapItem } from "@chakra-ui/react";
import { Copy, EllipsisVertical, Pencil, Trash2, Users } from "lucide-react";
import { memo } from "react";

export const RoleGroupCard = memo(function RoleGroupCard({
  group,
  canManage,
  onEdit,
  onDelete,
  onDuplicate,
  onManageMembers,
}: {
  group: RoleGroupSummary;
  canManage: boolean;
  onEdit: (group: RoleGroupSummary) => void;
  onDelete: (group: RoleGroupSummary) => void;
  onDuplicate: (group: RoleGroupSummary) => void;
  onManageMembers: (group: RoleGroupSummary) => void;
}) {
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
          <Box w="10px" h="10px" borderRadius="6px" bg="brand.solid" flexShrink={0} />
          <Text fontSize="13px" fontWeight="600" color="fg" wordBreak="break-word">
            {group.name}
          </Text>
          <Badge size="sm" variant="surface" colorPalette="blue">
            <Users size={10} />
            {group.memberCount}
          </Badge>
        </Flex>
        {canManage && (
          <Menu.Root positioning={{ placement: "bottom-end" }}>
            <Menu.Trigger asChild>
              <Button size="xs" variant="ghost" color="fg.muted" p="2px" _hover={{ bg: "bg.muted" }}>
                <EllipsisVertical size={14} />
              </Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item value="manage-members" onClick={() => onManageMembers(group)}>
                    <Users size={12} />
                    Manage members
                  </Menu.Item>
                  <Menu.Item value="duplicate" onClick={() => onDuplicate(group)}>
                    <Copy size={12} />
                    Duplicate
                  </Menu.Item>
                  <Menu.Item value="edit" onClick={() => onEdit(group)}>
                    <Pencil size={12} />
                    Edit
                  </Menu.Item>
                  <Menu.Item
                    value="delete"
                    color="red.fg"
                    _hover={{ bg: "red.subtle" }}
                    onClick={() => onDelete(group)}
                  >
                    <Trash2 size={12} />
                    Delete
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        )}
      </Flex>

      {group.description && (
        <Text fontSize="12px" color="fg.muted" mt="8px" lineHeight="1.4">
          {group.description}
        </Text>
      )}

      <Wrap gap="4px" mt="10px">
        {group.roles.map((role) => (
          <WrapItem key={role}>
            <Badge size="sm" variant="outline" colorPalette="gray" fontSize="10px">
              {role.replace(/_/g, " ")}
            </Badge>
          </WrapItem>
        ))}
        {group.roles.length === 0 && (
          <Text fontSize="11px" color="fg.muted" fontStyle="italic">
            No roles assigned
          </Text>
        )}
      </Wrap>
    </Box>
  );
});
