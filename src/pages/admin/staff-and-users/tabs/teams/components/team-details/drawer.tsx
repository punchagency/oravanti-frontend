import { useStaffsList } from "@/hooks/use-staff-list";
import { useTeamDetails } from "@/hooks/use-team-details";
import {
  CloseButton,
  Drawer,
  Flex,
  Heading,
  Portal,
  Spinner,
  Stack,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { useState, type ReactNode } from "react";
import { PracticeAreas } from "../../../../components/practice-areas";
import { TeamDetailsSkeleton } from "./skeleton";
import { Activity } from "./tabs/activity";
import { Members } from "./tabs/members";
import { Overview } from "./tabs/overview";

interface TeamDetailsDrawerProps {
  team: { id: string };
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (details: { open: boolean }) => void;
}

export function TeamDetailsDrawer({
  team: { id },
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: TeamDetailsDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const onOpenChange =
    controlledOnOpenChange ??
    (({ open }: { open: boolean }) => setInternalOpen(open));
  const { data: fullTeam, isLoading } = useTeamDetails(open ? id : null);
  const { data: staffResponse } = useStaffsList({ limit: 200 });

  return (
    <Drawer.Root
      placement="end"
      size="md"
      open={open}
      onOpenChange={onOpenChange}
    >
      <Drawer.Trigger asChild>{children}</Drawer.Trigger>
      <Portal>
        <Drawer.Backdrop backdropFilter="blur(1.5px)" />
        <Drawer.Positioner>
          <Drawer.Content bg="bg" borderColor="border" overflow="hidden">
            {isLoading ? (
              <TeamDetailsSkeleton />
            ) : fullTeam ? (
              <>
                <Drawer.Header
                  borderBottom="1px solid"
                  borderColor="border"
                  pt={6}
                  pb={4}
                >
                  <Flex justify="space-between" align="start">
                    <Stack gap={2} flex={1}>
                      <Heading textStyle="heading">{fullTeam.name}</Heading>
                      {fullTeam.description && (
                        <Text fontSize="13px" color="fg.muted" lineClamp={2}>
                          {fullTeam.description}
                        </Text>
                      )}
                    </Stack>
                    <Drawer.CloseTrigger asChild>
                      <CloseButton
                        size="sm"
                        border="1px solid"
                        borderColor="border.emphasized"
                        borderRadius="50%"
                        w="32px"
                        h="32px"
                        color="fg.muted"
                      />
                    </Drawer.CloseTrigger>
                  </Flex>
                </Drawer.Header>

                <Tabs.Root defaultValue="overview" variant="line" px={6}>
                  <Tabs.List
                    borderBottom="1px solid"
                    borderColor="border"
                    mb={3.5}
                  >
                    <Tabs.Trigger
                      value="overview"
                      px={4}
                      py={3}
                      color="fg.muted"
                      fontSize="12px"
                      borderBottom="1px solid"
                      borderColor="transparent"
                      _selected={{
                        color: "fg",
                        borderColor: "brand.solid",
                        fontWeight: "500",
                      }}
                    >
                      Overview
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="practice-areas"
                      px={4}
                      py={3}
                      color="fg.muted"
                      fontSize="12px"
                      borderBottom="1px solid"
                      borderColor="transparent"
                      _selected={{
                        color: "fg",
                        borderColor: "brand.solid",
                        fontWeight: "500",
                      }}
                    >
                      Practice Areas
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="members"
                      px={4}
                      py={3}
                      color="fg.muted"
                      fontSize="12px"
                      borderBottom="1px solid"
                      borderColor="transparent"
                      _selected={{
                        color: "fg",
                        borderColor: "brand.solid",
                        fontWeight: "500",
                      }}
                    >
                      Members ({fullTeam.memberCount})
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="activity"
                      px={4}
                      py={3}
                      color="fg.muted"
                      fontSize="12px"
                      borderBottom="1px solid"
                      borderColor="transparent"
                      _selected={{
                        color: "fg",
                        borderColor: "brand.solid",
                        fontWeight: "500",
                      }}
                    >
                      Activity
                    </Tabs.Trigger>
                  </Tabs.List>

                  <Drawer.Body px={0} py={0} overflow="auto">
                    <Tabs.Content value="overview">
                      <Overview team={fullTeam} />
                    </Tabs.Content>

                    <Tabs.Content value="practice-areas">
                      <PracticeAreas assignee={fullTeam} />
                    </Tabs.Content>

                    <Tabs.Content value="members">
                      {staffResponse ? (
                        <Members
                          team={fullTeam}
                          staffData={staffResponse.data}
                        />
                      ) : (
                        <Flex justify="center" py={8}>
                          <Spinner size="sm" />
                        </Flex>
                      )}
                    </Tabs.Content>

                    <Tabs.Content value="activity">
                      <Activity team={fullTeam} />
                    </Tabs.Content>
                  </Drawer.Body>
                </Tabs.Root>
              </>
            ) : null}
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
