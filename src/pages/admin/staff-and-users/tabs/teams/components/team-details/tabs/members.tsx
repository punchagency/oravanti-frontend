import type { TeamDTO } from "@/api/organization";
import { BrandButton } from "@/components/ui/intake-ui";
import { useRemoveTeamMember } from "@/hooks/use-remove-team-member";
import type { StaffMemberDTO } from "@/hooks/use-staff-list";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import {
  getStatusBadgeStyles,
  getStatusLabel,
} from "@/pages/admin/staff-and-users/data";
import { useConfirmStore } from "@/store/confirm-store";
import {
  Box,
  Flex,
  IconButton,
  Menu,
  Portal,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Ellipsis, Eye, UserPlus, UserX } from "lucide-react";
import { useState } from "react";
import { StaffDetailsDrawer } from "../../../../staff/components/staff-details/drawer";
import { AddMemberDialog } from "../add-member-dialog";

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function MemberRow({
  initials,
  name,
  role,
  workload,
  status,
  isLead,
  isLast,
  teamId,
  memberId,
}: {
  initials: string;
  name: string;
  role: string;
  workload: string;
  status: string;
  isLead?: boolean;
  isLast: boolean;
  teamId: string;
  memberId: string;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { showConfirm } = useConfirmDialog();
  const removeMember = useRemoveTeamMember();

  const handleRemove = () => {
    showConfirm({
      title: "Remove team member",
      description: `Are you sure you want to remove ${name} from this team?`,
      confirmLabel: "Remove",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        useConfirmStore.getState().setLoading(true);
        try {
          await removeMember.mutateAsync({ teamId, memberId });
          useConfirmStore.getState().close();
        } catch {
          useConfirmStore.getState().setLoading(false);
          useConfirmStore.getState().close();
        }
      },
    });
  };

  return (
    <>
      <Flex justify="space-between" align="center" py={3.5}>
        <Flex gap={3} align="center" minW={0}>
          <Flex
            w="40px"
            h="40px"
            borderRadius="full"
            bg="bg.subtle"
            border="1px solid"
            borderColor="border"
            align="center"
            justify="center"
            fontWeight="600"
            fontSize="13px"
            flexShrink={0}
          >
            {initials}
          </Flex>
          <Stack gap={0.5} minW={0}>
            <Text fontWeight="600" fontSize="14px" truncate>
              {name}
            </Text>
            <Text fontSize="12px" color="fg.subtle" truncate>
              {role}
            </Text>
          </Stack>
        </Flex>

        <Flex gap={3} align="start" flexShrink={0}>
          <Stack gap={1} align="end">
            <Text fontSize="12px" fontWeight="500" color="fg.muted">
              {workload}
            </Text>
            <Flex gap={1.5} justify="end">
              {isLead && (
                <Box
                  bg={getStatusBadgeStyles("lead").bg}
                  color={getStatusBadgeStyles("lead").color}
                  px="8px"
                  py="1px"
                  borderRadius="md"
                  fontSize="11px"
                  fontWeight="500"
                >
                  Lead
                </Box>
              )}
              <Box
                bg={getStatusBadgeStyles(status).bg}
                color={getStatusBadgeStyles(status).color}
                px="8px"
                py="1px"
                borderRadius="full"
                fontSize="11px"
                fontWeight="500"
              >
                {getStatusLabel(status)}
              </Box>
            </Flex>
          </Stack>

          <StaffDetailsDrawer
            staffId={memberId}
            open={drawerOpen}
            onOpenChange={({ open }) => setDrawerOpen(open)}
          >
            <Menu.Root>
              <Menu.Trigger asChild>
                <IconButton
                  variant="ghost"
                  size="sm"
                  color="fg.muted"
                  _hover={{ color: "fg", bg: "bg.muted" }}
                >
                  <Ellipsis size={16} />
                </IconButton>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content minW="160px">
                    <Menu.Item value="view" onClick={() => setDrawerOpen(true)}>
                      <Eye size={14} />
                      <Box flex="1">View details</Box>
                    </Menu.Item>
                    <Menu.Item
                      value="remove"
                      color="fg.error"
                      _hover={{ bg: "bg.error", color: "fg.error" }}
                      onClick={handleRemove}
                    >
                      <UserX size={14} />
                      <Box flex="1">Remove from team</Box>
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          </StaffDetailsDrawer>
        </Flex>
      </Flex>
      {!isLast && <Separator borderColor="border.muted" />}
    </>
  );
}

interface StepMembersProps {
  team: TeamDTO;
  staffData: StaffMemberDTO[];
}

export function Members({ team, staffData }: StepMembersProps) {
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const lead = team.members.find((m) => m.id === team.leadId);
  const nonLeadMembers = team.members.filter((m) => m.id !== team.leadId);

  const memberCaseload = (memberId: string) => {
    const dto = staffData.find((s) => s.id === memberId);
    const max = dto?.maxCaseload ?? 0;
    return max ? `0 / ${max} cases` : "—";
  };

  return (
    <Stack gap={0}>
      <Flex justify="flex-end" pb={3}>
        <BrandButton onClick={() => setAddMemberOpen(true)}>
          <UserPlus size={14} /> Add member
        </BrandButton>
      </Flex>
      <AddMemberDialog
        team={team}
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
      />
      {lead && (
        <MemberRow
          initials={getInitials(lead.firstName, lead.lastName)}
          name={`${lead.firstName} ${lead.lastName}`}
          role={lead.role ?? "—"}
          workload={memberCaseload(lead.id)}
          status={lead.status}
          isLead
          teamId={team.id}
          memberId={lead.id}
          isLast={nonLeadMembers.length === 0}
        />
      )}
      {nonLeadMembers.length > 0 ? (
        nonLeadMembers.map((member, idx) => (
          <MemberRow
            key={member.id}
            initials={getInitials(member.firstName, member.lastName)}
            name={`${member.firstName} ${member.lastName}`}
            role={member.role ?? "—"}
            workload={memberCaseload(member.id)}
            status={member.status}
            teamId={team.id}
            memberId={member.id}
            isLast={idx === nonLeadMembers.length - 1}
          />
        ))
      ) : (
        <Text fontSize="13px" color="fg.muted" textAlign="center" py={8}>
          No members assigned
        </Text>
      )}
    </Stack>
  );
}
