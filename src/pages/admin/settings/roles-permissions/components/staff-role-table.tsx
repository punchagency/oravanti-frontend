import type { RoleSummary } from "@/api/roles-permissions";
import type { StaffMemberDTO } from "@/hooks/use-staff-list";
import { roleColorValue } from "@/lib/role-colors";
import {
  Badge,
  Box,
  Button,
  Flex,
  Menu,
  Portal,
  Table,
  Text,
  Tooltip,
  Wrap,
} from "@chakra-ui/react";
import { EllipsisVertical, UserCog, Users } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { ManageStaffRolesDialog } from "./manage-staff-roles-dialog";

const MAX_VISIBLE = 2;

function effectiveGrantCount(roleNames: string[], rolesByName: Map<string, RoleSummary>): number {
  const grants = new Set<string>();
  for (const name of roleNames) {
    const role = rolesByName.get(name);
    if (!role) continue;
    for (const [resource, actions] of Object.entries(role.grants)) {
      for (const action of actions) grants.add(`${resource}:${action}`);
    }
  }
  return grants.size;
}

function OverflowBadge({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <Tooltip.Root positioning={{ placement: "top" }}>
      <Tooltip.Trigger asChild>
        <Badge size="sm" variant="subtle" colorPalette="gray" cursor="default">
          +{items.length}
        </Badge>
      </Tooltip.Trigger>
      <Portal>
        <Tooltip.Positioner>
          <Tooltip.Content>{items.join(", ")}</Tooltip.Content>
        </Tooltip.Positioner>
      </Portal>
    </Tooltip.Root>
  );
}

function RoleBadges({ roleNames, rolesByName }: { roleNames: string[]; rolesByName: Map<string, RoleSummary> }) {
  const roleFor = (name: string) => rolesByName.get(name);
  const visible = roleNames.slice(0, MAX_VISIBLE);
  const overflow = roleNames.slice(MAX_VISIBLE);

  if (roleNames.length === 0) {
    return (
      <Text fontSize="11px" color="fg.muted">
        No role assigned
      </Text>
    );
  }

  return (
    <Wrap gap={1}>
      {visible.map((name) => {
        const role = roleFor(name);
        return (
          <Badge key={name} size="sm" variant="subtle" colorPalette="gray">
            <Flex align="center" gap="5px">
              <Box
                w="7px"
                h="7px"
                borderRadius="full"
                bg={roleColorValue(role?.color)}
                flexShrink={0}
              />
              {role?.label ?? name}
            </Flex>
          </Badge>
        );
      })}
      <OverflowBadge items={overflow.map((n) => roleFor(n)?.label ?? n)} />
    </Wrap>
  );
}

function GroupBadges({ groupNames }: { groupNames: string[] }) {
  const visible = groupNames.slice(0, MAX_VISIBLE);
  const overflow = groupNames.slice(MAX_VISIBLE);

  if (groupNames.length === 0) {
    return (
      <Text fontSize="11px" color="fg.muted">
        None
      </Text>
    );
  }

  return (
    <Wrap gap={1}>
      {visible.map((name) => (
        <Badge key={name} size="sm" variant="subtle" colorPalette="blue">
          <Flex align="center" gap="5px">
            <Users size={10} />
            {name}
          </Flex>
        </Badge>
      ))}
      <OverflowBadge items={overflow} />
    </Wrap>
  );
}

/**
 * Memoized: `staff`/`roles`/`staffGroups` come from query data that's
 * referentially stable across renders, so without this the whole staff
 * table re-rendered every time any dialog on the page opened or closed.
 */
export const StaffRoleTable = memo(function StaffRoleTable({
  staff,
  roles,
  staffGroups,
}: {
  staff: StaffMemberDTO[];
  roles: RoleSummary[];
  staffGroups?: Record<string, string[]>;
}) {
  const [manageOpen, setManageOpen] = useState(false);
  const [activeMember, setActiveMember] = useState<StaffMemberDTO | null>(null);
  const rolesByName = useMemo(() => new Map(roles.map((r) => [r.name, r])), [roles]);

  return (
    <Box overflowX="auto" border="1px solid" borderColor="border" borderRadius="10px">
      <Table.Root size="sm" variant="line">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader fontSize="10px" color="fg.muted">STAFF MEMBER</Table.ColumnHeader>
            <Table.ColumnHeader fontSize="10px" color="fg.muted">ROLES</Table.ColumnHeader>
            <Table.ColumnHeader fontSize="10px" color="fg.muted">GROUPS</Table.ColumnHeader>
            <Table.ColumnHeader fontSize="10px" color="fg.muted">EFFECTIVE ACCESS</Table.ColumnHeader>
            <Table.ColumnHeader fontSize="10px" color="fg.muted" textAlign="right">
              ACTIONS
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {staff.map((member) => {
            const currentRoles = (member.role ?? "").split(",").map((r) => r.trim()).filter(Boolean);
            const groups = staffGroups?.[member.memberId ?? ""] ?? [];

            return (
              <Table.Row key={member.id}>
                <Table.Cell>
                  <Text fontSize="12px" fontWeight="500" color="fg">
                    {member.firstName} {member.lastName}
                  </Text>
                  <Text fontSize="11px" color="fg.muted">
                    {member.email}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <RoleBadges roleNames={currentRoles} rolesByName={rolesByName} />
                </Table.Cell>
                <Table.Cell>
                  <GroupBadges groupNames={groups} />
                </Table.Cell>
                <Table.Cell>
                  <Text fontSize="11px" color="fg.muted">
                    {effectiveGrantCount(currentRoles, rolesByName)} permissions
                  </Text>
                </Table.Cell>
                <Table.Cell textAlign="right">
                  <Menu.Root>
                    <Menu.Trigger asChild>
                      <Button
                        size="xs"
                        variant="ghost"
                        color="fg.muted"
                        p="4px"
                        disabled={!member.memberId}
                        _hover={{ color: "fg", bg: "bg.muted" }}
                      >
                        <EllipsisVertical size={14} />
                      </Button>
                    </Menu.Trigger>
                    <Portal>
                      <Menu.Positioner>
                        <Menu.Content>
                          <Menu.Item
                            value="manage-roles"
                            onClick={() => {
                              setActiveMember(member);
                              setManageOpen(true);
                            }}
                          >
                            <UserCog size={12} />
                            Manage roles
                          </Menu.Item>
                        </Menu.Content>
                      </Menu.Positioner>
                    </Portal>
                  </Menu.Root>
                </Table.Cell>
              </Table.Row>
            );
          })}
          {staff.length === 0 && (
            <Table.Row>
              <Table.Cell colSpan={5} textAlign="center" py={8}>
                <Text fontSize="12px" color="fg.muted">No staff to show.</Text>
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table.Root>

      <ManageStaffRolesDialog
        key={activeMember?.id ?? "empty"}
        open={manageOpen}
        onOpenChange={setManageOpen}
        onExitComplete={() => setActiveMember(null)}
        member={activeMember}
        roles={roles}
      />
    </Box>
  );
});
