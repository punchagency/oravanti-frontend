import {
  Box,
  CloseButton,
  Drawer,
  HStack,
  Portal,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { IntakeListSkeleton, PracticePill } from "@/components/ui/intake-ui";
import { useLeadById } from "@/hooks/use-leads";
import { usePublicPracticeAreas } from "@/hooks/use-public-practice-areas";
import { buildPracticeAreaMap, practiceAreaName, stageLabel, stageTone } from "../../data";
import { ActivityTab } from "./activity-tab";
import { NotesTab } from "./notes-tab";
import { OverviewTab } from "./overview-tab";

type DrawerTab = "overview" | "activity" | "notes";

const TABS: { value: DrawerTab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "activity", label: "Activity" },
  { value: "notes", label: "Notes" },
];

/**
 * Lead detail drawer.
 *
 * Drawer.Root stays mounted and is driven by `open` — it is never conditionally
 * unmounted on the open state, which breaks Chakra's focus trap. lazyMount +
 * unmountOnExit keep the body from rendering until it is needed and reset it on
 * close.
 */
export function LeadDrawer({
  leadId,
  open,
  onOpenChange,
}: {
  leadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [tab, setTab] = useState<DrawerTab>("overview");

  const { data: lead, isLoading } = useLeadById(open && leadId ? leadId : "");
  const { data: practiceAreas } = usePublicPracticeAreas();

  const areaName = useMemo(() => {
    if (!lead) return null;
    return practiceAreaName(
      buildPracticeAreaMap(practiceAreas ?? []),
      lead.practiceAreaId,
    );
  }, [lead, practiceAreas]);

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(e) => {
        onOpenChange(e.open);
        // Reset to overview on close so the next lead doesn't open on whichever
        // tab the last one was left on.
        if (!e.open) setTab("overview");
      }}
      size={{ base: "full", md: "xl", lg: "xl" }}
      placement="end"
      lazyMount
      unmountOnExit
    >
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
              <HStack justify="space-between" align="flex-start" gap="12px">
                <Box minW={0} flex={1}>
                  <Text
                    m="0"
                    color="fg"
                    fontSize="17px"
                    fontWeight="600"
                    lineHeight="1.2"
                    truncate
                  >
                    {lead?.name ?? "Lead"}
                  </Text>
                  <HStack mt="6px" gap="8px" wrap="wrap">
                    {lead && (
                      <>
                        <PracticePill tone={stageTone[lead.pipelineStage]}>
                          {stageLabel[lead.pipelineStage]}
                        </PracticePill>
                        {areaName && (
                          <PracticePill tone="neutral">{areaName}</PracticePill>
                        )}
                      </>
                    )}
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
                value={tab}
                onValueChange={(e) => setTab(e.value as DrawerTab)}
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
                  {TABS.map((t) => (
                    <Tabs.Trigger
                      key={t.value}
                      value={t.value}
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
                      {t.label}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>

                {isLoading || !lead ? (
                  <Box px={5} py={5} flex={1} overflow="auto">
                    <IntakeListSkeleton rows={4} />
                  </Box>
                ) : (
                  <>
                    <Tabs.Content
                      value="overview"
                      px={5}
                      py={5}
                      flex={1}
                      overflow="auto"
                    >
                      <OverviewTab lead={lead} practiceAreaName={areaName} />
                    </Tabs.Content>

                    <Tabs.Content
                      value="activity"
                      px={5}
                      py={5}
                      flex={1}
                      overflow="auto"
                    >
                      <ActivityTab
                        leadId={lead.id}
                        isActive={tab === "activity"}
                      />
                    </Tabs.Content>

                    <Tabs.Content
                      value="notes"
                      px={5}
                      py={5}
                      flex={1}
                      overflow="auto"
                    >
                      <NotesTab leadId={lead.id} isActive={tab === "notes"} />
                    </Tabs.Content>
                  </>
                )}
              </Tabs.Root>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
