import { useDeleteTeam } from "@/hooks/use-delete-team";
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
  Stack,
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
import type { TeamListDTO } from "@/hooks/use-teams-list";
import { AddMemberDialog } from "./team-details/add-member-dialog";
import { TeamDetailsDrawer } from "./team-details/dialog";
import { EditTeamDialog } from "./team-details/edit-team-dialog";
import { TransferLeadDialog } from "./team-details/transfer-lead-dialog";

interface TeamsMobileCardProps {
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

export function TeamsMobileCard({ team }: TeamsMobileCardProps) {
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
      p={4}
      border="1px solid"
      borderColor="border"
      borderRadius="lg"
      bg="bg"
      _hover={{ borderColor: "brand.solid" }}
      transition="border-color 0.2s"
    >
      <Flex justify="space-between" align="flex-start" mb={3}>
        <Box minW={0}>
          <HStack gap={2} mb={0.5}>
            <Text fontWeight="600" color="fg" truncate>
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
              flexShrink={0}
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
                size="xs"
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

      <Flex align="center" gap={3} mb={2}>
        <Text fontWeight="bold" fontSize="lg" color="#BA7517">
          {team.activeCases} / {team.maxCaseload}
        </Text>
        <Text textStyle="body-sm" color="fg.subtle">
          active cases
        </Text>
        <Text textStyle="body-sm" color="fg.muted">
          {team.workloadPercentage}%
        </Text>
      </Flex>

      <Progress.Root
        value={team.workloadPercentage}
        size="xs"
        mb={3}
      >
        <Progress.Track bg="border.muted">
          <Progress.Range bg="#BA7517" />
        </Progress.Track>
      </Progress.Root>

      <Stack gap={2} textStyle="body-sm" pt={2} borderTop="1px solid" borderColor="border.muted">
        {team.leadName && (
          <Flex justify="space-between" align="center">
            <Text color="fg.subtle">Team lead:</Text>
            <HStack gap={1.5}>
              <Avatar.Root boxSize="20px" flexShrink={0}>
                <Avatar.Fallback
                  name={team.leadName}
                  bg="#E1F5EE"
                  color="#085041"
                  fontSize="9px"
                  fontWeight="500"
                />
              </Avatar.Root>
              <Text color="fg" fontWeight="500">
                {team.leadName}
              </Text>
            </HStack>
          </Flex>
        )}

        <Flex justify="space-between" align="center">
          <Text color="fg.subtle">Members:</Text>
          <Text color="fg" fontWeight="500">
            {team.memberCount} staff
          </Text>
        </Flex>
      </Stack>

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
