import { Box, Skeleton, Text, VStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { getLeadById } from "@/api/leads";
import { FieldRow, SectionLabel } from "../shared";
import { pipelineStageLabels } from "../constants";

interface LeadOverviewProps {
  leadId: string;
  isActive: boolean;
}

export function LeadOverview({ leadId, isActive }: LeadOverviewProps) {
  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => getLeadById(leadId),
    enabled: isActive && Boolean(leadId),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <VStack align="stretch" gap={3} py={4}>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} h="32px" borderRadius="6px" />
        ))}
      </VStack>
    );
  }

  if (!lead) {
    return <Text color="fg.muted" fontSize="13px" py={4}>Lead not found</Text>;
  }

  return (
    <Box py={4}>
      <SectionLabel>Contact Information</SectionLabel>
      <FieldRow label="Full name" value={lead.name} />
      <FieldRow label="Email" value={lead.email} />
      <FieldRow label="Phone" value={lead.phone ?? "—"} />
      <FieldRow label="Entity type" value={lead.entityType === "company" ? "Company" : "Individual"} />

      <Box mt={5}>
        <SectionLabel>Matter Details</SectionLabel>
      </Box>
      <FieldRow label="Practice area" value={lead.practiceAreaId ?? "—"} />
      <FieldRow label="Case type" value={lead.caseTypeName ?? "—"} />
      <FieldRow label="Source" value={lead.source} />
      <FieldRow label="Pipeline stage" value={pipelineStageLabels[lead.pipelineStage] ?? lead.pipelineStage} />
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
      <FieldRow label="Received" value={lead.receivedAt ? new Date(lead.receivedAt).toLocaleDateString() : "—"} />
      <FieldRow label="Created" value={lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "—"} />
      <FieldRow label="Updated" value={lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : "—"} />
    </Box>
  );
}
