import type { LeadAuditLogEntry } from "@/api/lead-workflows";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { useLeadAuditLog } from "@/hooks/use-lead-workflows";
import { iconForAction } from "@/lib/audit";
import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { parseAsInteger, useQueryStates } from "nuqs";
import { SectionLabel } from "../../shared";

/*
  This file used to carry two hand-maintained maps of ~45 UPPERCASE event names
  to an emoji and a label, with a near-identical copy in the case audit tab and
  a third spelling on the backend. All three are gone: the API sends the
  registry action and its label, and the icon is resolved by domain, so a new
  `lead.*` action renders correctly on the day it ships with no change here.
*/

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
                {iconForAction(entry.action)} {entry.label}
              </Text>
            </Box>
            {/*
              Only when it adds something. The summary for most actions is the
              label plus its subject, and repeating "Stage changed" under
              "Stage changed" is noise.
            */}
            {entry.summary && entry.summary !== entry.label && (
              <Text fontSize="10px" color="fg.subtle" mb={0.5}>
                {entry.summary}
              </Text>
            )}
            <Text fontSize="9px" color="fg.muted">
              {/* The stored snapshot. An absent name means the system acted. */}
              {entry.actorName ? `by ${entry.actorName}` : "by System"} ·{" "}
              {new Date(entry.createdAt).toLocaleString()}
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
