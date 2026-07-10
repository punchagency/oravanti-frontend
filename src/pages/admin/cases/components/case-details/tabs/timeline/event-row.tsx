import { HStack, Text, Timeline, VStack } from "@chakra-ui/react";
import type { TimelineEvent } from "../workflow/types";
import { formatTime } from "./date-utils";
import { EventIcon, eventColor } from "./event-icon";

function formatDuration(ms: number | null | undefined): string | null {
  if (ms == null) return null;
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes}m ${totalSeconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function actorLine(event: TimelineEvent): string | null {
  const actorName = (event.metadata?.actorName as string | undefined) ?? event.createdBy?.name;
  const assigneeName = event.metadata?.assigneeName as string | undefined;
  const note = (event.metadata?.note as string | undefined) ?? event.description;
  const timeTakenMs = event.metadata?.timeTakenMs as number | null | undefined;

  switch (event.eventType) {
    case "step_assigned":
    case "step_assigned_override": {
      const role = event.metadata?.staffRole as string | undefined;
      const due = event.metadata?.dueDate as string | undefined;
      const assignee = assigneeName ?? (event.metadata?.staffName as string | undefined);
      if (!assignee) return null;
      const parts = [`Assigned to ${assignee}`];
      if (role) parts.push(`(${role})`);
      if (actorName) parts.push(`by ${actorName}`);
      if (due) parts.push(`due ${new Date(due).toLocaleDateString()}`);
      return parts.join(" ");
    }
    case "step_reassigned": {
      const prev = event.metadata?.previousStaffName as string | undefined;
      const next = event.metadata?.newStaffName as string | undefined;
      if (!prev || !next) return null;
      const parts = [`Reassigned from ${prev} to ${next}`];
      if (actorName) parts.push(`by ${actorName}`);
      return parts.join(" ");
    }
    case "step_submitted_for_review": {
      if (!actorName && !note) return null;
      const parts: string[] = [];
      if (actorName) parts.push(`Submitted by ${actorName}`);
      if (note) parts.push(`— "${note}"`);
      return parts.join(" ");
    }
    case "step_approved": {
      if (!actorName && !assigneeName) return null;
      const parts: string[] = [];
      if (actorName) parts.push(`Approved by ${actorName}`);
      if (assigneeName) parts.push(`(was assigned to ${assigneeName})`);
      if (note) parts.push(`— "${note}"`);
      const dur = formatDuration(timeTakenMs);
      if (dur) parts.push(`— took ${dur}`);
      return parts.join(" ");
    }
    case "step_rejected": {
      if (!actorName) return null;
      const parts = [`Rejected by ${actorName}`];
      if (assigneeName) parts.push(`(was assigned to ${assigneeName})`);
      if (note) parts.push(`— "${note}"`);
      return parts.join(" ");
    }
    case "step_completed": {
      const name =
        actorName ??
        (event.metadata?.completedByName as string | undefined);
      if (!name) return null;
      const parts = [`Completed by ${name}`];
      if (assigneeName) parts.push(`(was assigned to ${assigneeName})`);
      const dur = formatDuration(timeTakenMs);
      if (dur) parts.push(`— took ${dur}`);
      if (note) parts.push(`— "${note}"`);
      return parts.join(" ");
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
