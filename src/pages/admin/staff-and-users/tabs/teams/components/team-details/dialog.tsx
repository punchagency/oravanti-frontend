import { useStaffList } from "@/hooks/use-staff-list";
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
import { ThemeSkeleton } from "../../../../components/theme-skeleton";
import { StepActivity } from "./step-activity";
import { StepMembers } from "./step-members";
import { StepOverview } from "./step-overview";

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
  const { data: staffResponse } = useStaffList({ limit: 200 });

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
            <Drawer.Header
              borderBottom="1px solid"
              borderColor="border"
              pt={6}
              pb={4}
            >
              <Flex justify="space-between" align="start">
                <Stack gap={2} flex={1}>
                  {isLoading ? (
                    <>
                      <ThemeSkeleton h="24px" w="200px" />
                      <ThemeSkeleton h="14px" w="300px" />
                    </>
                  ) : fullTeam ? (
                    <>
                      <Heading textStyle="heading">{fullTeam.name}</Heading>
                      {fullTeam.description && (
                        <Text fontSize="13px" color="fg.muted" lineClamp={2}>
                          {fullTeam.description}
                        </Text>
                      )}
                    </>
                  ) : null}
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

            {isLoading ? (
              <>
                <Flex
                  gap={1}
                  px={6}
                  py={3}
                  borderBottom="1px solid"
                  borderColor="border"
                  align="center"
                >
                  <ThemeSkeleton h="12px" w="60px" />
                  <ThemeSkeleton h="12px" w="70px" mx={4} />
                  <ThemeSkeleton h="12px" w="50px" />
                </Flex>

                <Flex direction="column" gap={5} px={6} py={6}>
                  <Flex gap={4} wrap="wrap">
                    <ThemeSkeleton
                      h="88px"
                      flex="1"
                      minW="160px"
                      borderRadius="md"
                    />
                    <ThemeSkeleton
                      h="88px"
                      flex="1"
                      minW="160px"
                      borderRadius="md"
                    />
                  </Flex>
                  <Flex gap={4} wrap="wrap">
                    <ThemeSkeleton
                      h="88px"
                      flex="1"
                      minW="160px"
                      borderRadius="md"
                    />
                    <ThemeSkeleton
                      h="88px"
                      flex="1"
                      minW="160px"
                      borderRadius="md"
                    />
                  </Flex>

                  <Stack gap={2} pt={1}>
                    <ThemeSkeleton h="11px" w="110px" />
                    <ThemeSkeleton h="8px" borderRadius="full" />
                  </Stack>

                  <ThemeSkeleton h="1px" />

                  <Stack gap={2}>
                    <ThemeSkeleton h="11px" w="70px" />
                    <Flex
                      bg="bg.subtle"
                      p={4}
                      borderRadius="xl"
                      align="center"
                      gap={3}
                    >
                      <ThemeSkeleton
                        boxSize="40px"
                        borderRadius="full"
                        flexShrink={0}
                      />
                      <Stack gap={1.5} flex={1}>
                        <ThemeSkeleton h="14px" w="140px" />
                        <ThemeSkeleton h="12px" w="90px" />
                      </Stack>
                      <ThemeSkeleton
                        h="20px"
                        w="44px"
                        borderRadius="md"
                        flexShrink={0}
                      />
                    </Flex>
                  </Stack>

                  <ThemeSkeleton h="1px" />

                  <Stack gap={2}>
                    <ThemeSkeleton h="11px" w="100px" />
                    <Flex gap={2} wrap="wrap">
                      <ThemeSkeleton h="26px" w="80px" borderRadius="sm" />
                      <ThemeSkeleton h="26px" w="110px" borderRadius="sm" />
                      <ThemeSkeleton h="26px" w="70px" borderRadius="sm" />
                      <ThemeSkeleton h="26px" w="95px" borderRadius="sm" />
                    </Flex>
                  </Stack>

                  <ThemeSkeleton h="1px" />

                  <Stack gap={3} pt={1}>
                    <ThemeSkeleton h="40px" borderRadius="md" />
                    <ThemeSkeleton h="40px" borderRadius="md" />
                    <ThemeSkeleton h="40px" borderRadius="md" />
                  </Stack>
                </Flex>
              </>
            ) : fullTeam ? (
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
                    <StepOverview team={fullTeam} />
                  </Tabs.Content>

                  <Tabs.Content value="members">
                    {staffResponse ? (
                      <StepMembers
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
                    <StepActivity team={fullTeam} />
                  </Tabs.Content>
                </Drawer.Body>
              </Tabs.Root>
            ) : null}
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
