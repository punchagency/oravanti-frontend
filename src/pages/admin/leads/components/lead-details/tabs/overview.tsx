import { getLeadById } from "@/api/leads";
import { Box, Text, VStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { pipelineStageLabels } from "../../intake-pipeline/shared/constants";
import { FieldRow, SectionLabel } from "../shared";

interface LeadOverviewProps {
  leadId: string;
  isActive: boolean;
}

export function LeadOverview({ leadId, isActive }: LeadOverviewProps) {
  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => getLeadById(leadId),
    enabled: isActive && Boolean(leadId),
  });

  if (isLoading) {
    return (
      <Box py={4}>
        <ThemeSkeleton h="12px" w="120px" borderRadius="4px" mb={4} />
        <VStack align="stretch" gap={3}>
          {Array.from({ length: 5 }, (_, i) => (
            <Box key={i}>
              <ThemeSkeleton h="10px" w="80px" borderRadius="4px" mb={1} />
              <ThemeSkeleton
                h="14px"
                w={`${150 + i * 25}px`}
                borderRadius="4px"
              />
            </Box>
          ))}
        </VStack>
        <Box mt={5}>
          <ThemeSkeleton h="12px" w="110px" borderRadius="4px" mb={4} />
        </Box>
        <VStack align="stretch" gap={3}>
          {Array.from({ length: 3 }, (_, i) => (
            <Box key={i}>
              <ThemeSkeleton h="10px" w="80px" borderRadius="4px" mb={1} />
              <ThemeSkeleton
                h="14px"
                w={`${120 + i * 30}px`}
                borderRadius="4px"
              />
            </Box>
          ))}
        </VStack>
        <Box mt={5}>
          <ThemeSkeleton h="12px" w="70px" borderRadius="4px" mb={4} />
        </Box>
        <ThemeSkeleton h="14px" w="100px" borderRadius="4px" />
      </Box>
    );
  }

  if (!lead) {
    return (
      <Text color="fg.muted" fontSize="13px" py={4}>
        Lead not found
      </Text>
    );
  }

  return (
    <Box py={4}>
      <SectionLabel>Contact Information</SectionLabel>
      <FieldRow label="Full name" value={lead.name} />
      <FieldRow label="Email" value={lead.email} />
      <FieldRow label="Phone" value={lead.phone ?? "—"} />
      <FieldRow
        label="Entity type"
        value={lead.entityType === "company" ? "Company" : "Individual"}
      />

      <Box mt={5}>
        <SectionLabel>Matter Details</SectionLabel>
      </Box>
      <FieldRow
        label="Practice area"
        value={lead.practiceAreaName ?? lead.practiceAreaId ?? "—"}
      />
      <FieldRow label="Case type" value={lead.caseTypeName ?? "—"} />
      <FieldRow label="Source" value={lead.source} />
      <FieldRow
        label="Pipeline stage"
        value={pipelineStageLabels[lead.pipelineStage] ?? lead.pipelineStage}
      />
      <FieldRow label="Status" value={lead.status} />

      {lead.situationSummary ? (
        <>
          <Box mt={5}>
            <SectionLabel>Situation Summary</SectionLabel>
          </Box>
          <Box
            p={3}
            borderRadius="7px"
            bg="bg.subtle"
            color="fg"
            fontSize="13px"
            lineHeight="1.5"
            mt={1}
          >
            {lead.situationSummary}
          </Box>
        </>
      ) : null}

      <Box mt={5}>
        <SectionLabel>Timeline</SectionLabel>
      </Box>
      <FieldRow
        label="Received"
        value={
          lead.receivedAt ? new Date(lead.receivedAt).toLocaleDateString() : "—"
        }
      />
    </Box>
  );
}
