import { Badge, Box, Button, CloseButton, Drawer, HStack, Menu, Portal, Tabs, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Download, UserPlus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { getLeadById } from "@/api/leads";
import { pipelineStageColors, pipelineStageLabels, taskStatusColors } from "./constants";
import { IntakePipelineTab } from "./tabs/intake-pipeline";
import { LeadOverview } from "./tabs/overview";

interface LeadDetailsDrawerProps {
  children: ReactNode;
  leadId: string;
  open?: boolean;
  onOpenChange?: (details: { open: boolean }) => void;
}

export function LeadDetailsDrawer({
  children,
  leadId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: LeadDetailsDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const onOpenChange =
    controlledOnOpenChange ??
    ((details: { open: boolean }) => setInternalOpen(details.open));

  const [tab, setTab] = useState("overview");

  const { data: lead } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => getLeadById(leadId),
    enabled: open && Boolean(leadId),
    staleTime: 60_000,
  });

  const colors =
    taskStatusColors[lead?.status as keyof typeof taskStatusColors] ??
    taskStatusColors.pending;

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
                    {lead?.name ?? "N/A"}
                  </Text>
                  <Text color="fg.muted" fontSize="11px" mt={0.5}>
                    {lead?.email ?? "N/A"}
                  </Text>
                  <HStack gap={1.5} mt={1.5} wrap="wrap">
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
                      {lead?.status ?? "—"}
                    </Badge>

                    {lead?.pipelineStage ? (
                      <Box
                        bg="bg.subtle"
                        borderRadius="10px"
                        px={1.5}
                        py={0.5}
                        border="1px solid"
                        borderColor={pipelineStageColors[lead.pipelineStage] ?? "border"}
                      >
                        <Text
                          color="fg"
                          fontSize="10px"
                          fontWeight="500"
                          lineHeight="12px"
                        >
                          {pipelineStageLabels[lead.pipelineStage] ?? lead.pipelineStage}
                        </Text>
                      </Box>
                    ) : null}

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
                            <Menu.Item value="assign">
                              <UserPlus size={14} />
                              <Box flex="1">Assign staff</Box>
                            </Menu.Item>
                            <Menu.Item value="export">
                              <Download size={14} />
                              <Box flex="1">Export lead data</Box>
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

            <Drawer.Body
              p={0}
              display="flex"
              flexDir="column"
              overflow="hidden"
            >
              <Tabs.Root
                value={tab}
                onValueChange={(e) => setTab(e.value)}
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
                  {[
                    "Overview",
                    "Intake Pipeline",
                    "Documents",
                    "Timeline",
                    "Notes",
                  ].map((t) => (
                    <Tabs.Trigger
                      key={t}
                      value={t.toLowerCase().replace(/\s+/g, "-")}
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
                      {t}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>

                <Tabs.Content
                  value="overview"
                  px={5}
                  pb={5}
                  flex={1}
                  overflow="auto"
                >
                  <LeadOverview leadId={leadId} isActive={tab === "overview"} />
                </Tabs.Content>

                <Tabs.Content
                  value="intake-pipeline"
                  px={5}
                  pb={5}
                  flex={1}
                  overflow="auto"
                >
                  <IntakePipelineTab leadId={leadId} isActive={tab === "intake-pipeline"} />
                </Tabs.Content>

                <Tabs.Content
                  value="documents"
                  px={5}
                  pb={5}
                  flex={1}
                  overflow="auto"
                >
                  <Box color="fg.muted" fontSize="13px" py={4}>
                    Documents tab — coming soon
                  </Box>
                </Tabs.Content>

                <Tabs.Content
                  value="timeline"
                  px={5}
                  pb={5}
                  flex={1}
                  overflow="auto"
                >
                  <Box color="fg.muted" fontSize="13px" py={4}>
                    Timeline tab — coming soon
                  </Box>
                </Tabs.Content>

                <Tabs.Content
                  value="notes"
                  px={5}
                  pb={5}
                  flex={1}
                  overflow="auto"
                >
                  <Box color="fg.muted" fontSize="13px" py={4}>
                    Notes tab — coming soon
                  </Box>
                </Tabs.Content>
              </Tabs.Root>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
