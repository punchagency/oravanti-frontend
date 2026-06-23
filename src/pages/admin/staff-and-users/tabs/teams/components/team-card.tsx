import { useDeleteTeam } from "@/hooks/use-delete-team";
import type { TeamListDTO } from "@/hooks/use-teams-list";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useConfirmStore } from "@/store/confirm-store";
import {
  Avatar,
  Badge,
  Box,
  Flex,
  HStack,
  IconButton,
  Menu,
  Portal,
  Progress,
  Text,
} from "@chakra-ui/react";
import {
  ArrowLeftRight,
  Edit3,
  Ellipsis,
  Eye,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { AddMemberDialog } from "./team-details/add-member-dialog";
import { TeamDetailsDrawer } from "./team-details/dialog";
import { EditTeamDialog } from "./team-details/edit-team-dialog";
import { TransferLeadDialog } from "./team-details/transfer-lead-dialog";

interface TeamCardProps {
  team: TeamListDTO;
}

function getStatusColor(status: string) {
  switch (status) {
    case "available":
      return "#1D9E75";
    case "full":
      return "#BA7517";
    case "overloaded":
      return "#D85A30";
    default:
      return "#888780";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "available":
      return "Available";
    case "full":
      return "Full";
    case "overloaded":
      return "Overloaded";
    default:
      return status;
  }
}

export function TeamCard({ team }: TeamCardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<
    "edit" | "transfer" | "add" | null
  >(null);
  const { showConfirm } = useConfirmDialog();
  const deleteTeam = useDeleteTeam();

  const handleDelete = () => {
    showConfirm({
      title: "Delete team",
      description: `Are you sure you want to delete ${team.name}? This action cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        useConfirmStore.getState().setLoading(true);
        try {
          await deleteTeam.mutateAsync(team.id);
          useConfirmStore.getState().close();
        } catch {
          useConfirmStore.getState().setLoading(false);
          useConfirmStore.getState().close();
        }
      },
    });
  };

  return (
    <Box
      borderRadius="md"
      border="1px solid"
      borderColor="border"
      bg="bg"
      px={6}
      py={5}
      _hover={{ borderColor: "border.emphasized" }}
      transition="border-color 0.2s"
    >
      <Flex justify="space-between" align="flex-start">
        <Box>
          <HStack gap={2} mb={1}>
            <Text
              fontFamily="DM Sans"
              fontSize="16px"
              fontWeight="500"
              lineHeight="20px"
              color="fg"
            >
              {team.name}
            </Text>
            <Badge
              size="sm"
              variant="subtle"
              textTransform="none"
              color={getStatusColor(team.status)}
              bg={`${getStatusColor(team.status)}14`}
              fontSize="10px"
              fontWeight="500"
            >
              {getStatusLabel(team.status)}
            </Badge>
          </HStack>
        </Box>

        <TeamDetailsDrawer
          team={team}
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
                <Menu.Content minW="170px">
                  <Menu.Item value="view" onClick={() => setDrawerOpen(true)}>
                    <Eye size={14} />
                    <Box flex="1">View details</Box>
                  </Menu.Item>
                  <Menu.Item
                    value="transfer"
                    onClick={() => setActiveDialog("transfer")}
                  >
                    <ArrowLeftRight size={14} />
                    <Box flex="1">Transfer lead</Box>
                  </Menu.Item>
                  <Menu.Item
                    value="edit"
                    onClick={() => setActiveDialog("edit")}
                  >
                    <Edit3 size={14} />
                    <Box flex="1">Edit team</Box>
                  </Menu.Item>
                  <Menu.Item value="add" onClick={() => setActiveDialog("add")}>
                    <UserPlus size={14} />
                    <Box flex="1">Add member</Box>
                  </Menu.Item>
                  <Menu.Item
                    value="delete"
                    color="fg.error"
                    _hover={{ bg: "bg.error", color: "fg.error" }}
                    onClick={handleDelete}
                  >
                    <Trash2 size={14} />
                    <Box flex="1">Remove team</Box>
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </TeamDetailsDrawer>
      </Flex>

      <Flex align="baseline" gap={4} mt={4}>
        <Text
          fontFamily="DM Sans"
          fontSize="24px"
          fontWeight="500"
          lineHeight="30px"
          color="#BA7517"
        >
          {team.activeCases} / {team.maxCaseload}
        </Text>
        <Text
          fontFamily="DM Sans"
          fontSize="11px"
          fontWeight="400"
          lineHeight="14px"
          color="fg.subtle"
        >
          active cases
        </Text>
        <Box flex={1} maxW="200px">
          <Progress.Root
            value={team.workloadPercentage}
            size="sm"
            css={{ "--track-color": "rgba(0,0,0,0.08)" }}
          >
            <Progress.Track h="8px" borderRadius="full" bg="border.muted">
              <Progress.Range borderRadius="full" bg="#BA7517" />
            </Progress.Track>
          </Progress.Root>
        </Box>
        <Text
          fontFamily="DM Sans"
          fontSize="11px"
          fontWeight="400"
          lineHeight="14px"
          color="fg.subtle"
        >
          {team.workloadPercentage}%
        </Text>
      </Flex>

      <Box h="0.5px" bg="border.muted" my={3.5} />

      {team.leadName && (
        <>
          <Flex align="center" gap={3}>
            <Text
              fontFamily="DM Sans"
              fontSize="11px"
              fontWeight="500"
              letterSpacing="0.55px"
              textTransform="uppercase"
              color="fg.subtle"
            >
              Team lead
            </Text>
            <Avatar.Root size="xs" flexShrink={0}>
              <Avatar.Fallback
                name={team.leadName}
                bg="#E1F5EE"
                color="#085041"
                fontSize="11px"
                fontWeight="500"
              />
            </Avatar.Root>
            <Text
              fontFamily="DM Sans"
              fontSize="13px"
              fontWeight="500"
              color="fg"
            >
              {team.leadName}
            </Text>
            {team.leadRole && (
              <Badge
                size="sm"
                variant="subtle"
                textTransform="none"
                colorPalette="green"
                fontSize="10px"
                fontWeight="500"
              >
                {team.leadRole}
              </Badge>
            )}
            <Badge
              size="sm"
              variant="subtle"
              textTransform="none"
              color="#3C3489"
              bg="rgba(60, 52, 137, 0.1)"
              fontSize="10px"
              fontWeight="500"
            >
              Lead
            </Badge>
          </Flex>

          <Box h="0.5px" bg="border.muted" my={3.5} />
        </>
      )}

      <Flex justify="space-between" align="center">
        <Text
          fontFamily="DM Sans"
          fontSize="11px"
          fontWeight="500"
          textTransform="uppercase"
          color="fg.subtle"
        >
          Members
        </Text>
        <Text
          fontFamily="DM Sans"
          fontSize="11px"
          fontWeight="400"
          color="fg.subtle"
        >
          {team.memberCount} staff
        </Text>
      </Flex>

      <TransferLeadDialog
        key="transfer"
        team={team}
        open={activeDialog === "transfer"}
        onOpenChange={(open) => { if (!open) setActiveDialog(null); }}
      />
      <EditTeamDialog
        key="edit"
        team={team}
        open={activeDialog === "edit"}
        onOpenChange={(open) => { if (!open) setActiveDialog(null); }}
      />
      <AddMemberDialog
        key="add"
        team={team}
        open={activeDialog === "add"}
        onOpenChange={(open) => { if (!open) setActiveDialog(null); }}
      />
    </Box>
  );
}
