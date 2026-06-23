import type { TeamDTO } from "@/api/organization";
import {
  Box,
  Button,
  Flex,
  Progress,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ArrowLeftRight, Edit3, UserPlus } from "lucide-react";
import { useState } from "react";
import { AddMemberDialog } from "./add-member-dialog";
import { EditTeamDialog } from "./edit-team-dialog";
import { TransferLeadDialog } from "./transfer-lead-dialog";

function MetricCard({
  label,
  value,
  color = "fg",
  ...props
}: {
  label: string;
  value: string;
  color?: string;
} & React.ComponentProps<typeof Box>) {
  return (
    <Box
      bg="bg.subtle"
      p={4}
      borderRadius="md"
      border="1px solid"
      borderColor="border"
      {...props}
    >
      <Text
        fontSize="11px"
        fontWeight="500"
        color="fg.subtle"
        letterSpacing="0.55px"
        textTransform="uppercase"
        mb={1}
      >
        {label}
      </Text>
      <Text fontSize="24px" fontWeight="600" color={color}>
        {value}
      </Text>
    </Box>
  );
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function StepOverview({ team }: { team: TeamDTO }) {
  const [transferOpen, setTransferOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const capacityPercent = Math.round(
    (team.activeCases / team.maxCaseload) * 100,
  );
  const lead = team.members.find((m) => m.id === team.leadId);

  return (
    <Stack gap={5}>
      <Flex gap={4} wrap="wrap">
        <MetricCard
          label="ACTIVE CASES"
          value={String(team.activeCases)}
          flex="1"
          minW="140px"
        />
        <MetricCard
          label="TEAM CAP"
          value={String(team.maxCaseload)}
          flex="1"
          minW="140px"
        />
      </Flex>
      <Flex gap={4} wrap="wrap">
        <MetricCard
          label="MEMBERS"
          value={String(team.memberCount)}
          flex="1"
          minW="140px"
        />
        <MetricCard
          label="CAPACITY"
          value={`${capacityPercent}%`}
          color={capacityPercent >= 75 ? "#BA7517" : "fg"}
          flex="1"
          minW="140px"
        />
      </Flex>

      <Stack gap={2} pt={2}>
        <Text
          fontSize="11px"
          fontWeight="500"
          color="fg.subtle"
          letterSpacing="0.55px"
          textTransform="uppercase"
        >
          Caseload progress
        </Text>
        <Progress.Root value={capacityPercent} size="sm" borderRadius="full">
          <Progress.Track bg="border.muted">
            <Progress.Range
              bg={capacityPercent >= 75 ? "#BA7517" : "brand.solid"}
            />
          </Progress.Track>
        </Progress.Root>
      </Stack>

      <Separator borderColor="border" my={1} />

      <Stack gap={2}>
        <Text
          fontSize="11px"
          fontWeight="500"
          color="fg.subtle"
          letterSpacing="0.55px"
          textTransform="uppercase"
        >
          Team lead
        </Text>
        {lead ? (
          <Flex
            bg="bg.subtle"
            p={4}
            borderRadius="md"
            justify="space-between"
            align="center"
          >
            <Flex gap={3} align="center">
              <Flex
                w="40px"
                h="40px"
                borderRadius="full"
                bg="bg"
                border="1px solid"
                borderColor="border"
                align="center"
                justify="center"
                fontWeight="600"
                fontSize="14px"
              >
                {getInitials(lead.firstName, lead.lastName)}
              </Flex>
              <Stack gap={0.5}>
                <Text fontWeight="600" fontSize="14px">
                  {lead.firstName} {lead.lastName}
                </Text>
                <Text fontSize="12px" color="fg.subtle">
                  {lead.role ?? "—"}
                </Text>
              </Stack>
            </Flex>
            <Box
              bg="rgba(60, 52, 137, 0.1)"
              color="#3C3489"
              px="8px"
              py="2px"
              borderRadius="md"
              fontSize="11px"
              fontWeight="500"
            >
              Lead
            </Box>
          </Flex>
        ) : (
          <Text fontSize="13px" color="fg.muted">
            No lead assigned
          </Text>
        )}
      </Stack>

      <Separator borderColor="border" my={1} />

      <Stack gap={2}>
        <Text
          fontSize="11px"
          fontWeight="500"
          color="fg.subtle"
          letterSpacing="0.55px"
          textTransform="uppercase"
        >
          Practice areas
        </Text>
        <Flex gap={2} wrap="wrap">
          {team.practiceAreas.length > 0 ? (
            team.practiceAreas.map((area) => (
              <Box
                key={area.id}
                w="fit-content"
                bg="rgba(29, 158, 117, 0.1)"
                color="#1D9E75"
                px="10px"
                py="4px"
                borderRadius="sm"
                fontSize="13px"
                fontWeight="500"
              >
                {area.name}
              </Box>
            ))
          ) : (
            <Text fontSize="13px" color="fg.muted">
              None
            </Text>
          )}
        </Flex>
      </Stack>

      <Separator borderColor="border" my={1} />

      <Stack gap={3} pt={2} pb={4}>
        <Button
          variant="outline"
          borderColor="border"
          color="fg"
          _hover={{ bg: "bg.muted" }}
          w="100%"
          h="40px"
          gap={2}
          onClick={() => setTransferOpen(true)}
        >
          <ArrowLeftRight size={16} /> Transfer lead
        </Button>
        <Button
          variant="outline"
          borderColor="border"
          color="fg"
          _hover={{ bg: "bg.muted" }}
          w="100%"
          h="40px"
          gap={2}
          onClick={() => setEditOpen(true)}
        >
          <Edit3 size={16} /> Edit team
        </Button>
        <Button
          layerStyle={"brand-button"}
          onClick={() => setAddMemberOpen(true)}
        >
          <UserPlus size={16} /> Add member
        </Button>
      </Stack>
      <TransferLeadDialog
        team={team}
        open={transferOpen}
        onOpenChange={setTransferOpen}
      />
      <EditTeamDialog team={team} open={editOpen} onOpenChange={setEditOpen} />
      <AddMemberDialog
        team={team}
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
      />
    </Stack>
  );
}
