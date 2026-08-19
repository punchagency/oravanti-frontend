import { HStack, Text, Timeline, VStack } from "@chakra-ui/react";
import type { LeadTimelineEvent } from "@/api/lead-workflows";
import { formatTime } from "./date-utils";
import { EventIcon } from "./event-icon";
import { eventColor } from "./event-color";

function actorLine(event: LeadTimelineEvent): string | null {
  // `metadata.actorName` first: some events name a third party (the person a
  // task was assigned to, the reviewer) rather than whoever made the request.
  // `actorName` is the row's own snapshot of the actor and is the fallback.
  const actorName =
    (event.metadata?.actorName as string | undefined) ?? event.actorName ?? undefined;
  const assigneeName = event.metadata?.assigneeName as string | undefined;
  const note = (event.metadata?.note as string | undefined) ?? (event.metadata?.feedback as string | undefined);

  switch (event.action) {
    case "lead.task_assigned": {
      const assignee = assigneeName ?? (event.metadata?.assigneeName as string | undefined);
      if (!assignee) return null;
      const parts = [`Assigned to ${assignee}`];
      if (actorName) parts.push(`by ${actorName}`);
      return parts.join(" ");
    }
    case "lead.task_submitted_for_review": {
      if (!actorName && !note) return null;
      const parts: string[] = [];
      if (actorName) parts.push(`Submitted by ${actorName}`);
      if (note) parts.push(`— "${note}"`);
      return parts.join(" ");
    }
    case "lead.task_approved": {
      if (!actorName) return null;
      const parts = [`Approved by ${actorName}`];
      if (note) parts.push(`— "${note}"`);
      return parts.join(" ");
    }
    case "lead.task_rejected": {
      if (!actorName) return null;
      const parts = [`Rejected by ${actorName}`];
      if (note) parts.push(`— "${note}"`);
      return parts.join(" ");
    }
    case "lead.task_completed": {
      if (!actorName) return null;
      return `Completed by ${actorName}`;
    }
    case "lead.stage_changed": {
      const from = event.metadata?.from as string | undefined;
      const to = event.metadata?.to as string | undefined;
      if (from && to) return `From ${from} to ${to}`;
      return null;
    }
    case "lead.task_status_changed": {
      const from = event.metadata?.from as string | undefined;
      const to = event.metadata?.to as string | undefined;
      if (from && to) return `From ${from} to ${to}`;
      return null;
    }
    case "lead.payment_received": {
      const amount = event.metadata?.amount as number | undefined;
      const instant = event.metadata?.instant as boolean | undefined;
      const parts: string[] = [];
      if (amount) parts.push(`$${amount}`);
      if (instant) parts.push("(instant consultation)");
      return parts.length > 0 ? parts.join(" ") : null;
    }
    case "lead.consultation_slot_selected": {
      const slot = event.metadata?.slot as string | undefined;
      if (!slot) return null;
      return `Slot: ${formatTime(slot)}`;
    }
    case "lead.questionnaire_file_uploaded": {
      const filename = event.metadata?.filename as string | undefined;
      return filename ? `Uploaded: ${filename}` : null;
    }
    case "lead.missing_documents_requested": {
      const missing = event.metadata?.missing as string[] | undefined;
      if (!missing || missing.length === 0) return null;
      return `Requested ${missing.length} document(s)`;
    }
    case "lead.adverse_party_added": {
      const name = event.metadata?.name as string | undefined;
      const rel = event.metadata?.relationship as string | undefined;
      if (!name) return null;
      return rel ? `${name} (${rel})` : name;
    }
    case "lead.adverse_party_updated": {
      const changes = event.metadata?.changes as Record<string, unknown> | undefined;
      if (!changes) return null;
      return `Updated: ${Object.keys(changes).join(", ")}`;
    }
    case "lead.adverse_party_deleted":
      return "Party removed from case";
    case "lead.pipeline_initialized": {
      const count = event.metadata?.taskCount as number | undefined;
      return count ? `Created ${count} tasks` : null;
    }
    case "lead.case_workflow_step_updated": {
      const changes = event.metadata?.changes as Record<string, unknown> | undefined;
      if (!changes) return null;
      return `Updated: ${Object.keys(changes).join(", ")}`;
    }
    case "lead.fee_agreement_voided": {
      const reason = event.metadata?.reason as string | undefined;
      return reason ? `Reason: ${reason}` : "Agreement voided";
    }
    default:
      return null;
  }
}

export function EventRow({ event }: { event: LeadTimelineEvent }) {
  const actorInfo = actorLine(event);

  return (
    <Timeline.Item key={event.id}>
      <Timeline.Connector>
        <Timeline.Separator />
        <Timeline.Indicator color={eventColor(event.action)}>
          <EventIcon action={event.action} />
        </Timeline.Indicator>
      </Timeline.Connector>
      <Timeline.Content>
        <Timeline.Title
          fontSize="11px"
          fontWeight="500"
          color="fg"
          lineHeight="140%"
        >
          {event.label}
        </Timeline.Title>
        <Timeline.Description fontSize="10px" color="fg.subtle" mt={0.5}>
          <VStack gap={0.5} align="start">
            <HStack gap={1} flexWrap="wrap">
              <Text as="span" color="fg.subtle">
                {formatTime(event.createdAt)}
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
