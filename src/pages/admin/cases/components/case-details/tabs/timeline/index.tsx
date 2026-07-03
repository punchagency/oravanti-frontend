import {
  Box,
  Separator,
  Text,
  Timeline,
  VStack,
} from "@chakra-ui/react";
import {
  Clock,
  FileText,
} from "lucide-react";
import { SectionLabel } from "../../shared";
import { useCaseTimeline } from "../workflow/hooks";
import type { TimelineEvent } from "../workflow/types";
import { dateLabel } from "./date-utils";
import { DateGroup } from "./date-group";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TimelineTabProps {
  caseId?: string;
}

// ---------------------------------------------------------------------------
// Static case entries (pre-existing, shown as a fallback)
// ---------------------------------------------------------------------------

const staticEntries: { event: string; date: string }[] = [
  { event: "Case opened", date: "Mar 28, 2026" },
  { event: "Initial consultation", date: "Apr 2, 2026" },
  { event: "Documents filed", date: "Apr 15, 2026" },
];

// ---------------------------------------------------------------------------
// Main TimelineTab
// ---------------------------------------------------------------------------

export function TimelineTab({ caseId }: TimelineTabProps) {
  const { data: timelineEvents, isLoading } = useCaseTimeline(caseId ?? "");

  // Group workflow events by date
  const grouped = (timelineEvents ?? []).reduce<
    Record<string, TimelineEvent[]>
  >((acc, event) => {
    const label = dateLabel(event.createdAt, event.createdAt);
    if (!acc[label]) acc[label] = [];
    acc[label].push(event);
    return acc;
  }, {});

  const dateOrder = Object.keys(grouped).sort((a, b) => {
    // "Today" and "Yesterday" should be first
    if (a === "Today") return -1;
    if (b === "Today") return 1;
    if (a === "Yesterday") return -1;
    if (b === "Yesterday") return 1;
    return new Date(b).getTime() - new Date(a).getTime();
  });

  const hasWorkflowEvents = (timelineEvents ?? []).length > 0;

  if (isLoading) {
    return (
      <Box py={8} textAlign="center">
        <Text fontSize="12px" color="fg.muted">
          Loading timeline...
        </Text>
      </Box>
    );
  }

  return (
    <>
      <SectionLabel>Timeline</SectionLabel>

      {!hasWorkflowEvents && (
        <VStack
          align="center"
          py={6}
          gap={2}
          border="1px dashed"
          borderColor="border.muted"
          borderRadius="lg"
          mb={4}
        >
          <Box color="fg.subtle">
            <Clock size={24} />
          </Box>
          <Text fontSize="12px" fontWeight="500" color="fg.muted">
            No workflow events yet
          </Text>
          <Text fontSize="12px" color="fg.subtle">
            Events will appear as steps are assigned and completed.
          </Text>
        </VStack>
      )}

      {/* Workflow events grouped by date */}
      {dateOrder.map((label) => (
        <DateGroup key={label} label={label} events={grouped[label]} />
      ))}

      {/* Separator before static case events */}
      {hasWorkflowEvents && (
        <Separator borderColor="border.muted" my={3} />
      )}

      {/* Static case events (always shown) */}
      <Box mb={4}>
        <Text
          fontSize="10px"
          fontWeight="600"
          color="fg.subtle"
          textTransform="uppercase"
          letterSpacing="0.8px"
          mb={2}
        >
          Case events
        </Text>
        <Timeline.Root
          size="sm"
          variant="plain"
          colorPalette="green"
        >
          {staticEntries.map((entry) => (
            <Timeline.Item key={entry.event}>
              <Timeline.Connector>
                <Timeline.Separator />
                <Timeline.Indicator color="fg.subtle">
                  <FileText size={13} />
                </Timeline.Indicator>
              </Timeline.Connector>
              <Timeline.Content>
                <Timeline.Title
                  fontSize="11px"
                  fontWeight="500"
                  color="fg"
                >
                  {entry.event}
                </Timeline.Title>
                <Timeline.Description
                  fontSize="10px"
                  color="fg.subtle"
                  mt={0.5}
                >
                  {entry.date}
                </Timeline.Description>
              </Timeline.Content>
            </Timeline.Item>
          ))}
        </Timeline.Root>
      </Box>
    </>
  );
}
