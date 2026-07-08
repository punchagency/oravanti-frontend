import { Box, Text, VStack } from "@chakra-ui/react";
import { useWorkflowLogs } from "@/hooks/use-workflows";
import { SectionLabel } from "../../shared";

interface AuditLogTabProps {
  caseId?: string;
}

const eventIcons: Record<string, string> = {
  WORKFLOW_INITIALIZED: "⚙️",
  MODULE_ACTIVATED: "▶️",
  STEP_ASSIGNED: "👤",
  STEP_COMPLETED: "✅",
  STEP_SUBMITTED_FOR_REVIEW: "🔍",
  STEP_APPROVED: "✔️",
  STEP_REJECTED: "↩️",
};

const eventLabels: Record<string, string> = {
  WORKFLOW_INITIALIZED: "Workflow initialized",
  MODULE_ACTIVATED: "Module activated",
  STEP_ASSIGNED: "Step assigned",
  STEP_COMPLETED: "Step completed",
  STEP_SUBMITTED_FOR_REVIEW: "Submitted for review",
  STEP_APPROVED: "Step approved",
  STEP_REJECTED: "Step rejected",
};

export function AuditLogTab({ caseId }: AuditLogTabProps) {
  const { data: logs, isLoading } = useWorkflowLogs(caseId ?? "");

  if (isLoading) {
    return (
      <Box py={8} textAlign="center">
        <Text fontSize="12px" color="fg.muted">
          Loading audit log...
        </Text>
      </Box>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Box py={8} textAlign="center">
        <Text fontSize="12px" color="fg.muted">
          No audit log entries yet.
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <SectionLabel>Audit Log</SectionLabel>
      <VStack gap={2} align="stretch">
        {logs.map((entry) => (
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
              {entry.performedBy
                ? `by ${entry.performedBy.name}`
                : "by System"}{" "}
              · {new Date(entry.createdAt).toLocaleString()}
            </Text>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}
