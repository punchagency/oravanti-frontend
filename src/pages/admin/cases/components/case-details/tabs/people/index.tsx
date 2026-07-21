import {
  Avatar,
  Badge,
  Box,
  Button,
  chakra,
  createListCollection,
  Dialog,
  Flex,
  Grid,
  HStack,
  Portal,
  Select,
  Text,
  VStack,
} from "@chakra-ui/react";
import { RefreshCw, UserPlus, X, Eye } from "lucide-react";
import { useState } from "react";
import { BrandButton } from "@/components/ui/intake-ui";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { useCaseById } from "@/hooks/use-cases";
import { useReassignCaseTeam } from "@/hooks/use-workflows";
import { useTeamsList } from "@/hooks/use-teams-list";
import { TeamDetailsDrawer } from "@/pages/admin/staff-and-users/tabs/teams/components/team-details/drawer";

interface PeopleProps {
  caseId: string;
}

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function People({ caseId }: PeopleProps) {
  const { data: caseDetail, isLoading } = useCaseById(caseId);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [teamDetailsOpen, setTeamDetailsOpen] = useState(false);

  if (isLoading) {
    return (
      <>
        <Flex justify="space-between" align="flex-start" mb={5} gap={4}>
          <Box>
            <ThemeSkeleton h="20px" w="160px" borderRadius="4px" mb={2} />
            <ThemeSkeleton h="13px" w="220px" borderRadius="4px" />
          </Box>
        </Flex>
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
          {Array.from({ length: 3 }, (_, i) => (
            <Box
              key={i}
              border="1px solid"
              borderColor="border.muted"
              borderRadius="lg"
              bg="bg"
              p={5}
            >
              <ThemeSkeleton h="11px" w="80px" borderRadius="4px" mb={3} />
              <HStack gap={3} mb={3}>
                <ThemeSkeleton h="40px" w="40px" borderRadius="full" />
                <VStack gap={1} align="flex-start">
                  <ThemeSkeleton h="15px" w="120px" borderRadius="4px" />
                  <ThemeSkeleton h="16px" w="60px" borderRadius="full" />
                </VStack>
              </HStack>
            </Box>
          ))}
        </Grid>
      </>
    );
  }

  return (
    <>
      <Flex justify="space-between" align="flex-start" mb={5} gap={4} flexWrap="wrap">
        <Box>
          <Text fontSize="16px" fontWeight="500" color="fg" lineHeight="20px">
            Case participants
          </Text>
          <Text fontSize="13px" color="fg.muted" mt={0.5}>
            Everyone connected to this matter
          </Text>
        </Box>
        <Button
          size="xs"
          variant="outline"
          borderColor="border"
          h="36px"
          fontSize="13px"
          fontWeight="400"
          color="fg.muted"
          px={4}
          flexShrink={0}
          onClick={() => setReassignOpen(true)}
        >
          <RefreshCw size={13} />
          Reassign team
        </Button>
      </Flex>

      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
        {/* Client card */}
        {caseDetail?.client && (
          <ParticipantCard
            section="Client"
            name={caseDetail.client.name}
            role="Client"
            roleBg="bg.subtle"
            roleColor="fg"
          />
        )}

        {/* Assigned team card */}
        {caseDetail?.assignedTeam && (
          <ParticipantCard
            section="Assigned team"
            name={caseDetail.assignedTeam.name}
            role="Team"
            roleBg="blue.subtle"
            roleColor="blue.fg"
            actions={[
              { label: "View details", icon: <Eye size={13} />, onClick: () => setTeamDetailsOpen(true) },
              { label: "Reassign", icon: <RefreshCw size={13} />, onClick: () => setReassignOpen(true) },
            ]}
          />
        )}

        {/* No team assigned */}
        {!caseDetail?.assignedTeam && (
          <Box
            border="1px dashed"
            borderColor="border.muted"
            borderRadius="lg"
            bg="bg"
            p={5}
          >
            <Text fontSize="13px" color="fg.muted">
              No team assigned to this case.
            </Text>
            <Button
              size="xs"
              variant="outline"
              borderColor="border"
              h="32px"
              fontSize="12px"
              fontWeight="400"
              color="fg.muted"
              px={3}
              mt={3}
              onClick={() => setReassignOpen(true)}
            >
              <UserPlus size={12} />
              Assign team
            </Button>
          </Box>
        )}
      </Grid>

      <ReassignTeamModal
        caseId={caseId}
        currentTeamId={caseDetail?.assignedTeam?.id}
        open={reassignOpen}
        onOpenChange={setReassignOpen}
      />

      {caseDetail?.assignedTeam && (
        <TeamDetailsDrawer
          team={{ id: caseDetail.assignedTeam.id }}
          open={teamDetailsOpen}
          onOpenChange={({ open }) => setTeamDetailsOpen(open)}
        >
          <span />
        </TeamDetailsDrawer>
      )}
    </>
  );
}

// ─── Participant Card ────────────────────────────────────────────────────────

function ParticipantCard({
  section,
  name,
  role,
  roleBg,
  roleColor,
  actions,
}: {
  section: string;
  name: string;
  role: string;
  roleBg: string;
  roleColor: string;
  actions?: { label: string; icon: React.ReactNode; onClick: () => void }[];
}) {
  return (
    <Box
      border="1px solid"
      borderColor="border.muted"
      borderRadius="lg"
      bg="bg"
      p={5}
    >
      <Text
        color="fg.subtle"
        fontSize="11px"
        fontWeight="500"
        letterSpacing="0.44px"
        textTransform="uppercase"
        mb={2.5}
      >
        {section}
      </Text>

      <HStack gap={3} mb={3}>
        <Avatar.Root
          size="sm"
          w="40px"
          h="40px"
          bg="bg.subtle"
          border="1px solid"
          borderColor="border.muted"
        >
          <Avatar.Fallback fontSize="13px" fontWeight="500" color="fg.muted">
            {getInitials(name)}
          </Avatar.Fallback>
        </Avatar.Root>
        <Box>
          <Text fontSize="15px" fontWeight="500" color="fg" lineHeight="18px">
            {name}
          </Text>
          <Badge
            size="xs"
            borderRadius="full"
            px={2}
            py={0.5}
            bg={roleBg}
            color={roleColor}
            fontWeight="500"
            fontSize="10px"
            textTransform="none"
            mt={1}
          >
            {role}
          </Badge>
        </Box>
      </HStack>

      <Box borderTop="1px solid" borderColor="border.muted" />

      {actions && actions.length > 0 && (
        <Flex gap={2} pt={3.5}>
          {actions.map((action) => (
            <Button
              key={action.label}
              size="xs"
              variant="outline"
              borderColor="border"
              h="36px"
              fontSize="13px"
              fontWeight="400"
              color="fg.muted"
              px={4}
              onClick={action.onClick}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </Flex>
      )}
    </Box>
  );
}

// ─── Reassign Team Modal ────────────────────────────────────────────────────

const fieldStyles = {
  h: "36px",
  px: "12px",
  border: "1px solid",
  borderColor: "border",
  borderRadius: "7px",
  bg: "bg",
  color: "fg",
  fontSize: "13px",
  _placeholder: { color: "fg.muted" },
  _focus: {
    borderColor: "brand.solid",
    boxShadow: "0 0 0 1px var(--chakra-colors-brand-solid)",
  },
};

function ReassignTeamModal({
  caseId,
  currentTeamId,
  open,
  onOpenChange,
}: {
  caseId: string;
  currentTeamId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: teamsData } = useTeamsList({ page: 1, limit: 100 });
  const reassignTeam = useReassignCaseTeam(caseId);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(currentTeamId ?? "");

  const teams = (teamsData?.data ?? []) as { name: string; id: string }[];
  const teamCollection = createListCollection<{ label: string; value: string }>({
    items: teams.map((t) => ({ label: t.name, value: t.id })),
  });

  const handleReassign = () => {
    if (!selectedTeamId) return;
    reassignTeam.mutate(selectedTeamId, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      placement="center"
    >
      <Dialog.Backdrop backdropFilter="blur(1.5px)" />
      <Dialog.Positioner px="16px">
        <Dialog.Content
          w="full"
          maxW="480px"
          border="1px solid"
          borderColor="border"
          borderRadius="14px"
          bg="bg"
          p="0"
          boxShadow="0 24px 70px rgba(0, 0, 0, 0.26)"
        >
          <Dialog.CloseTrigger asChild>
            <chakra.button
              type="button"
              aria-label="Close reassign dialog"
              position="absolute"
              top="22px"
              right="22px"
              display="grid"
              placeItems="center"
              w="32px"
              h="32px"
              border="1px solid"
              borderColor="border"
              borderRadius="8px"
              bg="bg"
              color="fg.muted"
            >
              <X size={16} />
            </chakra.button>
          </Dialog.CloseTrigger>
          <Box p="32px 24px 24px">
            <Dialog.Title
              color="fg"
              fontSize="17px"
              fontWeight="600"
              lineHeight="1.2"
            >
              Reassign team
            </Dialog.Title>
            <Dialog.Description
              mt="10px"
              color="fg.muted"
              fontSize="13px"
              lineHeight="1.35"
            >
              Select a new team for this case.
            </Dialog.Description>
            <VStack align="stretch" gap="12px" mt="18px">
              <Box>
                <Text
                  as="label"
                  display="block"
                  mb="5px"
                  color="fg"
                  fontSize="11px"
                  fontWeight="500"
                >
                  Team
                </Text>
                <Select.Root
                  collection={teamCollection}
                  size="sm"
                  value={[selectedTeamId]}
                  onValueChange={(e) => setSelectedTeamId(e.value[0] ?? "")}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger {...fieldStyles} h="36px">
                      <Select.ValueText placeholder="Select a team" />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {teamCollection.items.map((item) => (
                          <Select.Item item={item} key={item.value}>
                            <Select.ItemText>{item.label}</Select.ItemText>
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Box>
            </VStack>
            <Flex justify="flex-end" gap="12px" mt="18px">
              <BrandButton
                onClick={handleReassign}
                loading={reassignTeam.isPending}
                disabled={!selectedTeamId}
              >
                Reassign
              </BrandButton>
            </Flex>
          </Box>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
