import {
  Badge,
  Box,
  Button,
  CloseButton,
  Drawer,
  HStack,
  Menu,
  Portal,
  Tabs,
  Text,
} from "@chakra-ui/react";
import {
  AlertTriangle,
  Archive,
  ChevronDown,
  Download,
  UserPlus,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { statusBadgeStyle, type CaseData } from "./shared";
import { Overview } from "./tabs/overview";
import { WorkflowTab } from "./tabs/workflow";
import { People } from "./tabs/people";
import { Documents } from "./tabs/documents";
import { TimelineTab } from "./tabs/timeline";
import { Notes } from "./tabs/notes";

interface CaseDetailsDrawerProps {
  children: ReactNode;
  caseData?: CaseData;
  open?: boolean;
  onOpenChange?: (details: { open: boolean }) => void;
}

export function CaseDetailsDrawer({
  children,
  caseData: _caseData,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CaseDetailsDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const onOpenChange =
    controlledOnOpenChange ??
    ((details: { open: boolean }) => setInternalOpen(details.open));

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      size={{ base: "full", md: "xl", lg: "xl" }}
      placement="end"
    >
      <Drawer.Trigger asChild>{children}</Drawer.Trigger>
      <Portal>
        <Drawer.Backdrop backdropFilter="blur(1.5px)" />
        <Drawer.Positioner>
          <Drawer.Content borderLeft="1px solid" borderColor="border" w="full">
            <Drawer.Header
              borderBottom="1px solid"
              borderColor="border"
              px={5}
              py={5}
            >
              <HStack justify="space-between" align="flex-start">
                <Box minW={0} flex={1}>
                  <Text
                    color="fg"
                    fontSize="15px"
                    fontWeight="500"
                    lineHeight="18px"
                    truncate
                  >
                    {_caseData?.caseRef ?? "ORV-2026-0135"}
                  </Text>
                  <Text
                    color="fg.muted"
                    fontSize="11px"
                    mt={0.5}
                  >
                    {_caseData?.clientName ?? "David Kim"}
                  </Text>
                  <HStack gap={1.5} mt={1.5} wrap="wrap">
                    {(() => {
                      const s = _caseData?.status ?? "Filed";
                      const colors =
                        statusBadgeStyle[s as keyof typeof statusBadgeStyle] ??
                        statusBadgeStyle.Filed;
                      return (
                        <Badge
                          size="xs"
                          borderRadius="full"
                          px={2.5}
                          py={0.5}
                          borderWidth="1px"
                          borderColor={colors.borderColor}
                          bg={colors.bg}
                          color={colors.textColor}
                          fontWeight="500"
                          fontSize="11px"
                          textTransform="none"
                          whiteSpace="nowrap"
                        >
                          {s}
                        </Badge>
                      );
                    })()}

                    <Box
                      bg="brand.subtle"
                      borderRadius="10px"
                      px={1.5}
                      py={0.5}
                    >
                      <Text color="brand.fg" fontSize="10px" fontWeight="500" lineHeight="12px">
                        {_caseData?.practiceArea ?? "Immigration"}
                      </Text>
                    </Box>

                    <Menu.Root>
                      <Menu.Trigger asChild>
                        <Button
                          size="xs"
                          variant="outline"
                          borderColor="border"
                          h="22px"
                          fontSize="10px"
                          fontWeight="400"
                          px={2}
                          display={{ base: "none", md: "inline-flex" }}
                        >
                          Actions
                          <ChevronDown size={10} />
                        </Button>
                      </Menu.Trigger>
                      <Portal>
                        <Menu.Positioner>
                          <Menu.Content minW="180px">
                            <Menu.Item value="reassign-team">
                              <UserPlus size={14} />
                              <Box flex="1">Reassign team</Box>
                            </Menu.Item>
                            <Menu.Item value="export">
                              <Download size={14} />
                              <Box flex="1">Export case file</Box>
                            </Menu.Item>
                            <Menu.Item value="close">
                              <Archive size={14} />
                              <Box flex="1">Close case</Box>
                            </Menu.Item>
                            <Menu.Item
                              value="flag"
                              color="fg.error"
                              _hover={{ bg: "bg.error", color: "fg.error" }}
                            >
                              <AlertTriangle size={14} />
                              <Box flex="1">Flag as urgent</Box>
                            </Menu.Item>
                          </Menu.Content>
                        </Menu.Positioner>
                      </Portal>
                    </Menu.Root>
                  </HStack>
                </Box>

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
              </HStack>
            </Drawer.Header>

            <Drawer.Body p={0} display="flex" flexDir="column" overflow="hidden">
              <Tabs.Root
                defaultValue="overview"
                size="sm"
                display="flex"
                flexDir="column"
                maxH="dvh"
                overflow="hidden"
              >
                <Tabs.List
                  borderBottom="1px solid"
                  borderColor="border"
                  px={3}
                  flexShrink={0}
                >
                  {["Overview", "Workflow", "People", "Documents", "Timeline", "Notes"].map((tab) => (
                    <Tabs.Trigger
                      key={tab}
                      value={tab.toLowerCase()}
                      px={3.5}
                      py={2.5}
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
                      {tab}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>

                <Tabs.Content value="overview" px={5} pb={5} flex={1} overflow="auto">
                  <Overview caseData={_caseData} />
                </Tabs.Content>

                <Tabs.Content value="workflow" px={5} pb={5} flex={1} overflow="auto">
                  <WorkflowTab caseId={_caseData?.id ?? ""} />
                </Tabs.Content>

                <Tabs.Content value="people" px={5} pb={5} flex={1} overflow="auto">
                  <People />
                </Tabs.Content>

                <Tabs.Content value="documents" px={5} pb={5} flex={1} overflow="auto">
                  <Documents />
                </Tabs.Content>

                <Tabs.Content value="timeline" px={5} pb={5} flex={1} overflow="auto">
                  <TimelineTab caseId={_caseData?.id} />
                </Tabs.Content>

                <Tabs.Content value="notes" px={5} pb={5} flex={1} overflow="auto">
                  <Notes />
                </Tabs.Content>
              </Tabs.Root>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
