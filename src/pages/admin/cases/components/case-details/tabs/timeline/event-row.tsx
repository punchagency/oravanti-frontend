import { Box, HStack, Text, Timeline, VStack } from "@chakra-ui/react";
import type { CaseEvent } from "../../../../../../../api/workflows";
import { formatTime } from "./date-utils";
import { EventIcon } from "./event-icon";
import { eventColor } from "./event-color";

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function getDetailLines(event: CaseEvent): string[] {
  const meta = (event.metadata ?? {}) as Record<string, unknown>;
  const lines: string[] = [];

  switch (event.eventType) {
    case "step_assigned": {
      const staffName = meta.staffName as string | undefined;
      const assignerName = meta.assignerName as string | undefined;
      const moduleName = meta.moduleName as string | undefined;
      const strategy = meta.assignmentStrategy as string | undefined;
      const note = (meta.note ?? meta.overrideRationale) as string | undefined;

      if (staffName) lines.push(`Assigned to ${staffName}`);
      if (assignerName) lines.push(`by ${assignerName}`);
      if (moduleName) lines.push(`Module: ${moduleName}`);
      if (strategy === "workload_balanced") lines.push("Auto-assigned (workload)");
      if (strategy === "manual_override") lines.push("Manual override");
      if (note) lines.push(`Note: ${note}`);
      break;
    }
    case "step_completed": {
      const timeTakenMs = meta.timeTakenMs as number | undefined;
      const completedByName = meta.completedByName as string | undefined;
      const moduleName = meta.moduleName as string | undefined;
      const note = meta.note as string | undefined;

      if (completedByName) lines.push(`by ${completedByName}`);
      if (timeTakenMs != null) lines.push(`Time taken: ${formatDuration(timeTakenMs)}`);
      if (moduleName) lines.push(`Module: ${moduleName}`);
      if (note) lines.push(`Note: ${note}`);
      break;
    }
    case "step_submitted_for_review": {
      const submittedByName = meta.submittedByName as string | undefined;
      const moduleName = meta.moduleName as string | undefined;
      const note = meta.note as string | undefined;

      if (submittedByName) lines.push(`by ${submittedByName}`);
      if (moduleName) lines.push(`Module: ${moduleName}`);
      if (note) lines.push(`Note: ${note}`);
      break;
    }
    case "step_approved": {
      const reviewerName = meta.reviewerName as string | undefined;
      const assigneeName = meta.assigneeName as string | undefined;
      const timeTakenMs = meta.timeTakenMs as number | undefined;
      const moduleName = meta.moduleName as string | undefined;
      const note = meta.note as string | undefined;

      if (reviewerName) lines.push(`by ${reviewerName}`);
      if (assigneeName) lines.push(`Assignee: ${assigneeName}`);
      if (timeTakenMs != null) lines.push(`Time taken: ${formatDuration(timeTakenMs)}`);
      if (moduleName) lines.push(`Module: ${moduleName}`);
      if (note) lines.push(`Note: ${note}`);
      break;
    }
    case "step_rejected": {
      const reviewerName = meta.reviewerName as string | undefined;
      const assigneeName = meta.assigneeName as string | undefined;
      const feedback = meta.feedback as string | undefined;
      const moduleName = meta.moduleName as string | undefined;

      if (reviewerName) lines.push(`by ${reviewerName}`);
      if (assigneeName) lines.push(`Assignee: ${assigneeName}`);
      if (moduleName) lines.push(`Module: ${moduleName}`);
      if (feedback) lines.push(`Feedback: ${feedback}`);
      break;
    }
    case "module_activated": {
      const moduleName = meta.moduleName as string | undefined;
      const activationType = meta.activationType as string | undefined;

      if (moduleName) lines.push(`Module: ${moduleName}`);
      if (activationType) lines.push(`Activation: ${activationType}`);
      break;
    }
    case "workflow_initialized": {
      const stepCount = meta.stepCount as number | undefined;
      const moduleCount = meta.moduleCount as number | undefined;

      if (stepCount != null) lines.push(`${stepCount} steps created`);
      if (moduleCount != null) lines.push(`${moduleCount} modules activated`);
      break;
    }
    case "case_team_reassigned": {
      const prevTeam = meta.previousTeam as { id: string; name: string } | undefined;
      const newTeam = meta.newTeam as { id: string; name: string } | undefined;

      if (prevTeam?.name) lines.push(`From: ${prevTeam.name}`);
      if (newTeam?.name) lines.push(`To: ${newTeam.name}`);
      break;
    }
    case "case_team_assigned": {
      const teamName = meta.teamName as string | undefined;
      if (teamName) lines.push(`Team: ${teamName}`);
      break;
    }
    case "case_note_created":
    case "case_note_updated":
    case "case_note_deleted":
    case "case_note_pinned":
    case "case_note_unpinned": {
      const content = meta.content as string | undefined;
      if (content) {
        const preview = content.length > 80 ? `${content.slice(0, 80)}…` : content;
        lines.push(preview);
      }
      break;
    }
    default:
      break;
  }

  return lines;
}

export function EventRow({ event }: { event: CaseEvent }) {
  const details = getDetailLines(event);

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
              <Text as="span" color="fg.subtle">
                · {formatTime(event.createdAt)}
              </Text>
            </HStack>
            {details.length > 0 && (
              <Box>
                {details.map((line, i) => (
                  <Text key={i} as="span" color="fg.muted" fontSize="10px" display="block">
                    {line}
                  </Text>
                ))}
              </Box>
            )}
          </VStack>
        </Timeline.Description>
      </Timeline.Content>
    </Timeline.Item>
  );
}
