import { HStack, Text, Timeline, VStack } from "@chakra-ui/react";
import type { TimelineEvent } from "../workflow/types";
import { formatTime } from "./date-utils";
import { EventIcon, eventColor } from "./event-icon";

function actorLine(event: TimelineEvent): string | null {
  switch (event.eventType) {
    case "step_assigned":
    case "step_assigned_override": {
      const assignee = event.metadata?.staffName as string | undefined;
      const role = event.metadata?.staffRole as string | undefined;
      const actor = event.createdBy?.name;
      const due = event.metadata?.dueDate as string | undefined;
      if (!assignee) return null;
      const parts = [`Assigned to ${assignee}`];
      if (role) parts.push(`(${role})`);
      if (actor) parts.push(`by ${actor}`);
      if (due) parts.push(`due ${new Date(due).toLocaleDateString()}`);
      return parts.join(" ");
    }
    case "step_reassigned": {
      const prev = event.metadata?.previousStaffName as string | undefined;
      const next = event.metadata?.newStaffName as string | undefined;
      const actor = event.createdBy?.name;
      if (!prev || !next) return null;
      const parts = [`Reassigned from ${prev} to ${next}`];
      if (actor) parts.push(`by ${actor}`);
      return parts.join(" ");
    }
    case "step_completed": {
      const name = event.metadata?.completedByName as string | undefined;
      const note = event.metadata?.notes as string | undefined;
      const timeLabel = event.metadata?.timeTakenLabel as string | undefined;
      if (!name) return null;
      let text = `Completed by ${name}`;
      if (timeLabel) text += ` — took ${timeLabel}`;
      if (note) text += ` — "${note}"`;
      return text;
    }
    default:
      return null;
  }
}

export function EventRow({ event }: { event: TimelineEvent }) {
  const moduleName = event.metadata?.moduleName as string | undefined;
  const stepTitle = event.metadata?.stepTitle as string | undefined;
  const actorInfo = actorLine(event);

  return (
    <Timeline.Item key={event.id}>
      <Timeline.Connector>
        <Timeline.Separator />
        <Timeline.Indicator color={eventColor(event.eventType)}>
          <EventIcon eventType={event.eventType} />
        </Timeline.Indicator>
      </Timeline.Connector>
      <Timeline.Content>
        <Timeline.Title
          fontSize="11px"
          fontWeight="500"
          color="fg"
          lineHeight="140%"
        >
          {event.title}
        </Timeline.Title>
        <Timeline.Description fontSize="10px" color="fg.subtle" mt={0.5}>
          <VStack gap={0.5} align="start">
            <HStack gap={1} flexWrap="wrap">
              {moduleName && (
                <Text as="span" color="fg.muted">
                  {moduleName}
                </Text>
              )}
              {stepTitle && (
                <Text as="span" color="fg.muted" truncate maxW="200px">
                  · {stepTitle}
                </Text>
              )}
              <Text as="span" color="fg.subtle">
                · {formatTime(event.createdAt)}
              </Text>
            </HStack>
            {actorInfo && (
              <Text as="span" color="fg.muted" fontSize="10px">
                {actorInfo}
              </Text>
            )}
          </VStack>
        </Timeline.Description>
      </Timeline.Content>
    </Timeline.Item>
  );
}
