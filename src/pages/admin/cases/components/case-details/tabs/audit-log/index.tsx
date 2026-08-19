import { useCaseEvents } from "@/hooks/use-workflows";
import { iconForAction } from "@/lib/audit";
import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { parseAsInteger, useQueryStates } from "nuqs";
import { ThemeSkeleton } from "../../../../../../../components/ui/theme-skeleton";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { SectionLabel } from "../../shared";
import type { CaseEvent } from "@/api/workflows";

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

/**
 * The extra lines a workflow event carries in its metadata.
 *
 * This is not a label map — the label comes from the registry. It is the
 * per-action reading of `metadata`, which is the one thing the registry
 * genuinely cannot supply, because its shape differs per action. Actions with
 * nothing extra to say fall through and render label plus summary alone.
 */
function getAuditDetails(event: CaseEvent): string[] {
  const meta = (event.metadata ?? {}) as Record<string, unknown>;
  const lines: string[] = [];
  const timeTakenMs = meta.timeTakenMs as number | undefined;

  switch (event.action) {
    case "case.step_assigned": {
      const staffName = meta.staffName as string | undefined;
      const assignerName = meta.assignerName as string | undefined;
      const moduleName = meta.moduleName as string | undefined;
      const note = (meta.note ?? meta.overrideRationale) as string | undefined;
      if (staffName) lines.push(`Assigned to ${staffName}`);
      if (assignerName) lines.push(`by ${assignerName}`);
      if (moduleName) lines.push(`Module: ${moduleName}`);
      if (note) lines.push(`Note: ${note}`);
      break;
    }
    case "case.step_completed": {
      const completedByName = meta.completedByName as string | undefined;
      const moduleName = meta.moduleName as string | undefined;
      const note = meta.note as string | undefined;
      if (completedByName) lines.push(`by ${completedByName}`);
      if (timeTakenMs != null) lines.push(`Time taken: ${formatDuration(timeTakenMs)}`);
      if (moduleName) lines.push(`Module: ${moduleName}`);
      if (note) lines.push(`Note: ${note}`);
      break;
    }
    case "case.step_submitted_for_review": {
      const submittedByName = meta.submittedByName as string | undefined;
      const moduleName = meta.moduleName as string | undefined;
      if (submittedByName) lines.push(`by ${submittedByName}`);
      if (timeTakenMs != null) lines.push(`Time taken: ${formatDuration(timeTakenMs)}`);
      if (moduleName) lines.push(`Module: ${moduleName}`);
      break;
    }
    case "case.step_approved": {
      const reviewerName = meta.reviewerName as string | undefined;
      const assigneeName = meta.assigneeName as string | undefined;
      const moduleName = meta.moduleName as string | undefined;
      if (reviewerName) lines.push(`by ${reviewerName}`);
      if (assigneeName) lines.push(`Assignee: ${assigneeName}`);
      if (timeTakenMs != null) lines.push(`Time taken: ${formatDuration(timeTakenMs)}`);
      if (moduleName) lines.push(`Module: ${moduleName}`);
      break;
    }
    case "case.step_rejected": {
      const reviewerName = meta.reviewerName as string | undefined;
      const assigneeName = meta.assigneeName as string | undefined;
      const feedback = meta.feedback as string | undefined;
      const moduleName = meta.moduleName as string | undefined;
      if (reviewerName) lines.push(`by ${reviewerName}`);
      if (assigneeName) lines.push(`Assignee: ${assigneeName}`);
      if (moduleName) lines.push(`Module: ${moduleName}`);
      if (feedback) lines.push(`Feedback: ${feedback}`);
      if (timeTakenMs != null) lines.push(`Time taken: ${formatDuration(timeTakenMs)}`);
      break;
    }
    case "case.team_reassigned": {
      const prevTeam = meta.previousTeam as { id: string; name: string } | undefined;
      const newTeam = meta.newTeam as { id: string; name: string } | undefined;
      if (prevTeam?.name) lines.push(`From: ${prevTeam.name}`);
      if (newTeam?.name) lines.push(`To: ${newTeam.name}`);
      break;
    }
    default:
      break;
  }

  return lines;
}

interface AuditLogTabProps {
  caseId?: string;
}

export function AuditLogTab({ caseId }: AuditLogTabProps) {
  const [{ page, limit }, setPagination] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(10),
  });
  const { data: eventsResult, isLoading } = useCaseEvents(
    caseId ?? "",
    page,
    limit,
  );

  const events = eventsResult?.data ?? [];
  const pagination = eventsResult?.pagination;

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

  return (
    <Box>
      <SectionLabel>Audit Log</SectionLabel>
      {!events || events.length === 0 ? (
        <Box py={8} textAlign="center">
          <Text fontSize="12px" color="fg.muted">
            No audit log entries yet.
          </Text>
        </Box>
      ) : (
        <>
          <VStack gap={2} align="stretch">
            {events.map((entry) => {
              const details = getAuditDetails(entry);
              return (
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
                      {iconForAction(entry.action)} {entry.label}
                    </Text>
                  </Box>
                  {/*
                    Only when it adds something — the summary for most actions
                    is the label plus its subject, and repeating "Step approved"
                    under "Step approved" is noise.
                  */}
                  {entry.summary && entry.summary !== entry.label && (
                    <Text fontSize="10px" color="fg.subtle" mb={0.5}>
                      {entry.summary}
                    </Text>
                  )}
                  {details.length > 0 && (
                    <Box mb={0.5}>
                      {details.map((line, i) => (
                        <Text key={i} fontSize="10px" color="fg.muted" display="block">
                          {line}
                        </Text>
                      ))}
                    </Box>
                  )}
                  <Text fontSize="9px" color="fg.muted">
                    {entry.actorName
                      ? `by ${entry.actorName}`
                      : "by System"}{" "}
                    · {new Date(entry.createdAt).toLocaleString()}
                    {entry.ipAddress && <> · {entry.ipAddress}</>}
                  </Text>
                </Box>
              );
            })}
          </VStack>
          {pagination && (
            <PaginationControls
              currentPage={page}
              limit={limit}
              total={pagination.total}
              onPageChange={(p: number) => setPagination({ page: p })}
              onLimitChange={(l: number) => setPagination({ limit: l, page: 1 })}
              pageSizeOptions={[10, 20, 50]}
            />
          )}
        </>
      )}
    </Box>
  );
}
