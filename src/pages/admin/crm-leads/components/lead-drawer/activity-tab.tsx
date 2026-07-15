import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import type { LeadEvent, LeadEventType } from "@/api/leads";
import { IntakeListSkeleton, MutedText } from "@/components/ui/intake-ui";
import { useLeadActivity } from "@/hooks/use-leads";
import { formatReceivedDateDetail } from "@/api/leads";
import { stageLabel } from "../../data";
import type { PipelineStage } from "@/api/leads";

/**
 * Read-only. The trail is append-only on the server — there is no update or
 * delete endpoint — so this view deliberately offers no way to edit or remove
 * an entry.
 */

const EVENT_TITLES: Record<LeadEventType, string> = {
  lead_received: "Lead received",
  lead_updated: "Lead details updated",
  stage_changed: "Stage changed",
  lead_assigned: "Lead assigned",
  lead_archived: "Lead archived",
  lead_restored: "Lead restored",
  note_added: "Note added",
  conflict_check_run: "Conflict check run",
  conflict_check_approved: "Conflict check approved",
  conflict_check_declined: "Lead declined for conflict",
  conflict_overridden: "Conflict overridden",
  questionnaire_sent: "Questionnaire sent",
  questionnaire_response_received: "Questionnaire response received",
  consultation_scheduled: "Consultation scheduled",
  consultation_rescheduled: "Consultation rescheduled",
  consultation_cancelled: "Consultation cancelled",
  consultation_completed: "Consultation completed",
  fee_agreement_generated: "Fee agreement generated",
  fee_agreement_sent: "Fee agreement sent for signature",
  fee_agreement_signed: "Fee agreement signed",
  payment_received: "Payment received",
  case_opened: "Case opened",
};

const EVENT_TONES: Partial<Record<LeadEventType, string>> = {
  lead_received: "#6b6252",
  conflict_check_declined: "#b00020",
  conflict_overridden: "#8a641d",
  lead_archived: "#b00020",
  case_opened: "#00785a",
  fee_agreement_signed: "#00785a",
  payment_received: "#00785a",
};

const FIELD_LABELS: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  phone: "Phone",
  source: "Source",
  situationSummary: "Summary",
  entityType: "Entity",
  language: "Language",
  practiceArea: "Practice area",
  caseType: "Matter type",
  intakeAdversePartyName: "Adverse party",
  intakeAdversePartyEmail: "Adverse party email",
};

/** Extra context worth a line of its own, drawn only from what was recorded. */
function eventDetail(event: LeadEvent): string | null {
  const meta = event.metadata ?? {};

  switch (event.type) {
    case "stage_changed": {
      const from = meta.from as PipelineStage | undefined;
      const to = meta.to as PipelineStage | undefined;
      if (!from || !to) return null;
      return `${stageLabel[from] ?? from} → ${stageLabel[to] ?? to}`;
    }
    case "conflict_check_run": {
      const status = meta.status as string | undefined;
      const matches = meta.matchCount as number | undefined;
      if (!status) return null;
      const label = status.replace(/_/g, " ");
      return matches
        ? `${label} — ${matches} potential ${matches === 1 ? "match" : "matches"}`
        : label;
    }
    case "conflict_check_approved":
    case "conflict_check_declined":
    case "conflict_overridden":
      return (meta.reviewNotes as string | undefined) ?? null;
    case "consultation_scheduled": {
      const parts: string[] = [];
      if (meta.isInstant) parts.push("Instant");
      else if (meta.isUrgent) parts.push("Urgent");
      if (meta.isFollowUp) parts.push("Follow-up");
      if (meta.mode) parts.push(String(meta.mode).replace(/_/g, " "));

      // Who the consultation is *with* — the attorney assigned to it, plus any
      // additional attendees.
      const attorney = meta.leadAttorneyName as string | undefined;
      if (attorney) parts.push(`with ${attorney}`);

      const others = (meta.participantNames as string[] | undefined) ?? [];
      if (others.length) parts.push(`+ ${others.join(", ")}`);

      return parts.length ? parts.join(" · ") : null;
    }
    case "lead_updated": {
      const changes = meta.changes as
        | Record<string, { from: unknown; to: unknown }>
        | undefined;
      if (!changes) return null;

      const show = (v: unknown) =>
        v === null || v === "" ? "empty" : String(v);

      return Object.entries(changes)
        .map(
          ([field, { from, to }]) =>
            `${FIELD_LABELS[field] ?? field}: ${show(from)} → ${show(to)}`,
        )
        .join(" · ");
    }
    case "consultation_cancelled":
      return (meta.reason as string | undefined) ?? null;
    case "consultation_completed":
      return meta.outcome
        ? `Outcome: ${String(meta.outcome).replace(/_/g, " ")}`
        : null;
    case "payment_received":
      return meta.kind === "consultation_fee"
        ? "Consultation fee"
        : "Fee agreement";
    case "lead_archived":
      return (meta.reason as string | undefined) ?? null;
    case "case_opened":
      return (meta.caseNumber as string | undefined) ?? null;
    case "note_added":
      return meta.noteType
        ? String(meta.noteType).replace(/_/g, " ")
        : null;
    default:
      return null;
  }
}

function ActivityRow({ event }: { event: LeadEvent }) {
  const detail = eventDetail(event);
  // Reconstructed by the backfill from rows that predate the trail, rather than
  // recorded as it happened. Worth flagging so nobody reads it as gospel.
  const derived = event.metadata?.derived === true;

  return (
    <HStack align="flex-start" gap="12px" py="12px">
      <Box
        mt="5px"
        w="8px"
        h="8px"
        flexShrink={0}
        borderRadius="999px"
        bg={EVENT_TONES[event.type] ?? "border"}
      />

      <Box flex="1" minW="0">
        <HStack gap="8px" wrap="wrap">
          <Text m="0" color="fg" fontSize="13px" fontWeight="500">
            {EVENT_TITLES[event.type] ?? event.type}
          </Text>
          {derived && (
            <Text
              m="0"
              px="6px"
              py="1px"
              borderRadius="999px"
              bg="bg.subtle"
              color="fg.muted"
              fontSize="10px"
              title="Reconstructed from existing records — this event predates activity tracking"
            >
              reconstructed
            </Text>
          )}
        </HStack>

        {detail && (
          <Text m="2px 0 0" color="fg.muted" fontSize="12px">
            {detail}
          </Text>
        )}

        <Text m="3px 0 0" color="fg.subtle" fontSize="11px">
          {/* An unknown actor is shown as unknown. The server leaves actorId
              null for lead-driven and system events, and for backfilled events
              whose actor was never recorded — so there is nobody to name. */}
          {event.actorName ?? "Actor not recorded"}
          {" · "}
          {formatReceivedDateDetail(event.createdAt)}
        </Text>
      </Box>
    </HStack>
  );
}

export function ActivityTab({
  leadId,
  isActive,
}: {
  leadId: string;
  isActive: boolean;
}) {
  const { data: events, isLoading } = useLeadActivity(leadId, isActive);

  if (isLoading) return <IntakeListSkeleton rows={4} />;

  if (!events?.length) {
    return (
      <Box py="32px" textAlign="center">
        <MutedText>No activity recorded for this lead yet.</MutedText>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap="0" separator={<Box borderTop="1px solid" borderColor="border.subtle" />}>
      {events.map((event) => (
        <ActivityRow key={event.id} event={event} />
      ))}
    </VStack>
  );
}
