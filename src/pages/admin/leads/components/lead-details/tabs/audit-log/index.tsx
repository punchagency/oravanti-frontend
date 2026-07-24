import type { LeadAuditLogEntry } from "@/api/lead-workflows";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { useLeadAuditLog } from "@/hooks/use-lead-workflows";
import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { parseAsInteger, useQueryStates } from "nuqs";
import { SectionLabel } from "../../shared";

const eventIcons: Record<string, string> = {
  LEAD_RECEIVED: "📥",
  LEAD_UPDATED: "✏️",
  LEAD_VIEWED: "👁️",
  STAGE_CHANGED: "➡️",
  LEAD_ASSIGNED: "👤",
  LEAD_ARCHIVED: "📦",
  LEAD_RESTORED: "♻️",
  CONFLICT_CHECK_RUN: "🔍",
  CONFLICT_CHECK_APPROVED: "✔️",
  CONFLICT_CHECK_DECLINED: "❌",
  CONFLICT_OVERRIDDEN: "✔️",
  QUESTIONNAIRE_SENT: "📤",
  QUESTIONNAIRE_RESPONSE_RECEIVED: "📥",
  QUESTIONNAIRE_OPENED: "📖",
  QUESTIONNAIRE_DRAFT_SAVED: "💾",
  QUESTIONNAIRE_FILE_UPLOADED: "📎",
  CONSULTATION_SCHEDULED: "📅",
  CONSULTATION_COMPLETED: "✅",
  CONSULTATION_CANCELLED: "❌",
  CONSULTATION_RESCHEDULED: "📅",
  CONSULTATION_BOOKING_OPENED: "📖",
  CONSULTATION_SLOT_SELECTED: "📅",
  FEE_AGREEMENT_GENERATED: "📄",
  FEE_AGREEMENT_SENT: "📤",
  FEE_AGREEMENT_SIGNED: "✍️",
  FEE_AGREEMENT_VOIDED: "❌",
  CASE_OPENED: "💼",
  PIPELINE_INITIALIZED: "⚙️",
  TASK_ASSIGNED: "👤",
  TASK_COMPLETED: "✅",
  TASK_SUBMITTED_FOR_REVIEW: "📤",
  TASK_APPROVED: "✔️",
  TASK_REJECTED: "↩️",
  DOCUMENT_LINKED: "📎",
  DOCUMENT_UNLINKED: "🗂️",
  NUDGE_SENT: "🔔",
  MISSING_DOCUMENTS_REQUESTED: "📋",
  REMINDER_SENT: "⏰",
  ADVERSE_PARTY_ADDED: "👥",
  ADVERSE_PARTY_UPDATED: "👥",
  ADVERSE_PARTY_DELETED: "👥",
  CASE_WORKFLOW_STEP_UPDATED: "⚙️",
};

const eventLabels: Record<string, string> = {
  LEAD_RECEIVED: "Lead received",
  LEAD_UPDATED: "Lead updated",
  LEAD_VIEWED: "Lead viewed",
  STAGE_CHANGED: "Stage changed",
  LEAD_ASSIGNED: "Lead assigned",
  LEAD_ARCHIVED: "Lead archived",
  LEAD_RESTORED: "Lead restored",
  CONFLICT_CHECK_RUN: "Conflict check run",
  CONFLICT_CHECK_APPROVED: "Conflict check approved",
  CONFLICT_CHECK_DECLINED: "Conflict check declined",
  CONFLICT_OVERRIDDEN: "Conflict overridden",
  QUESTIONNAIRE_SENT: "Questionnaire sent",
  QUESTIONNAIRE_RESPONSE_RECEIVED: "Questionnaire submitted",
  QUESTIONNAIRE_OPENED: "Questionnaire opened",
  QUESTIONNAIRE_DRAFT_SAVED: "Questionnaire draft saved",
  QUESTIONNAIRE_FILE_UPLOADED: "File uploaded",
  CONSULTATION_SCHEDULED: "Consultation scheduled",
  CONSULTATION_COMPLETED: "Consultation completed",
  CONSULTATION_CANCELLED: "Consultation cancelled",
  CONSULTATION_RESCHEDULED: "Consultation rescheduled",
  CONSULTATION_BOOKING_OPENED: "Booking page opened",
  CONSULTATION_SLOT_SELECTED: "Time slot selected",
  FEE_AGREEMENT_GENERATED: "Fee agreement generated",
  FEE_AGREEMENT_SENT: "Fee agreement sent",
  FEE_AGREEMENT_SIGNED: "Fee agreement signed",
  FEE_AGREEMENT_VOIDED: "Fee agreement voided",
  CASE_OPENED: "Case opened",
  PIPELINE_INITIALIZED: "Pipeline initialized",
  TASK_ASSIGNED: "Task assigned",
  TASK_COMPLETED: "Task completed",
  TASK_SUBMITTED_FOR_REVIEW: "Task submitted for review",
  TASK_APPROVED: "Task approved",
  TASK_REJECTED: "Task rejected",
  DOCUMENT_LINKED: "Document linked",
  DOCUMENT_UNLINKED: "Document unlinked",
  NUDGE_SENT: "Nudge sent",
  MISSING_DOCUMENTS_REQUESTED: "Missing documents requested",
  REMINDER_SENT: "Reminder sent",
  ADVERSE_PARTY_ADDED: "Adverse party added",
  ADVERSE_PARTY_UPDATED: "Adverse party updated",
  ADVERSE_PARTY_DELETED: "Adverse party deleted",
  CASE_WORKFLOW_STEP_UPDATED: "Workflow step updated",
};

interface LeadAuditLogTabProps {
  leadId?: string;
  isActive?: boolean;
}

export function LeadAuditLogTab({
  leadId,
  isActive = true,
}: LeadAuditLogTabProps) {
  const [{ page, limit }, setPagination] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(10),
  });

  const { data, isLoading } = useLeadAuditLog(
    leadId ?? "",
    isActive,
    page,
    limit,
  );

  const logs = data?.data ?? [];
  const pagination = data?.pagination ?? {
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 10,
  };

  if (isLoading) {
    return (
      <VStack align="stretch" gap={3} py={4}>
        <SectionLabel>Audit Log</SectionLabel>
        {Array.from({ length: 4 }, (_, i) => (
          <Box
            key={i}
            p={3}
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="6px"
          >
            <HStack gap={2} mb={2}>
              <ThemeSkeleton h="24px" w="24px" borderRadius="full" />
              <Box>
                <ThemeSkeleton
                  h="12px"
                  w={`${100 + i * 20}px`}
                  borderRadius="4px"
                  mb={1}
                />
                <ThemeSkeleton h="10px" w="80px" borderRadius="4px" />
              </Box>
            </HStack>
            <ThemeSkeleton
              h="10px"
              w={`${180 + i * 15}px`}
              borderRadius="4px"
            />
          </Box>
        ))}
      </VStack>
    );
  }

  if (logs.length === 0) {
    return (
      <>
        <SectionLabel>Audit Log</SectionLabel>
        <Box py={8} textAlign="center">
          <Text fontSize="12px" color="fg.muted">
            No audit log entries yet.
          </Text>
        </Box>
      </>
    );
  }

  return (
    <>
      <SectionLabel>Audit Log</SectionLabel>
      <VStack gap={2} align="stretch">
        {logs.map((entry: LeadAuditLogEntry) => (
          <Box
            key={entry.id}
            border="1px solid"
            borderColor="border.muted"
            borderRadius="md"
            px={3}
            py={2.5}
          >
            <Box display="flex" alignItems="center" gap={2} mb={0.5}>
              <Text fontSize="11px" fontWeight="500" color="fg">
                {eventIcons[entry.eventType] ?? "📋"}{" "}
                {eventLabels[entry.eventType] ?? entry.title}
              </Text>
            </Box>
            {entry.description && (
              <Text fontSize="10px" color="fg.subtle" mb={0.5}>
                {entry.description}
              </Text>
            )}
            <Text fontSize="9px" color="fg.muted">
              {entry.performedBy ? `by ${entry.performedBy.name}` : "by System"}{" "}
              · {new Date(entry.createdAt).toLocaleString()}
            </Text>
          </Box>
        ))}
      </VStack>

      {pagination.total > limit && (
        <PaginationControls
          total={pagination.total}
          currentPage={pagination.page}
          limit={pagination.limit}
          onPageChange={(p) => setPagination({ page: p })}
          onLimitChange={(l) => setPagination({ page: 1, limit: l })}
        />
      )}
    </>
  );
}
