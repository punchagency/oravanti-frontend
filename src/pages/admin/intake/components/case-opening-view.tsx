import { Box, HStack, Stack } from "@chakra-ui/react";
import { Check, FolderOpen } from "lucide-react";
import type { Lead } from "@/api/leads";
import { formatReceivedDate } from "@/api/leads";
import { useLeads, useOpenCase } from "@/hooks/use-leads";
import {
  BrandButton,
  CardTitle,
  IntakeListSkeleton,
  MutedText,
  PracticePill,
  StatusPill,
  SurfaceCard,
} from "../../../../components/ui/intake-ui";

export function CaseOpeningView() {
  const { data, isLoading } = useLeads({ stage: "case_opening" });
  const leads = Array.isArray(data) ? data : (data?.leads ?? []);

  return (
    <Stack gap="16px" pt="24px" aria-label="Case opening queue">
      <HStack justify="space-between" gap="16px" wrap="wrap">
        <MutedText fontSize="14px">
          {isLoading
            ? "Loading…"
            : `${leads.length} ${leads.length === 1 ? "case" : "cases"} ready to open`}
        </MutedText>
        <StatusPill>Retainers confirmed</StatusPill>
      </HStack>

      {isLoading ? (
        <IntakeListSkeleton />
      ) : leads.length === 0 ? (
        <MutedText>No cases ready to open.</MutedText>
      ) : (
        <Stack gap="14px">
          {leads.map((lead) => (
            <CaseOpeningCard key={lead.id} lead={lead} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function CaseOpeningCard({ lead }: { lead: Lead }) {
  const openCase = useOpenCase();

  function handleOpenCase() {
    openCase.mutate({ id: lead.id, data: {} });
  }

  const alreadyConverted = Boolean(lead.convertedCaseId);

  return (
    <SurfaceCard>
      <HStack align="flex-start" justify="space-between" gap="16px">
        <Box>
          <CardTitle>Case initialization: {lead.name}</CardTitle>
          <HStack mt="6px" gap="9px">
            <PracticePill tone="neutral">Lead</PracticePill>
            <MutedText>
              {alreadyConverted
                ? "Received signed retainer contract (100% full authorization)"
                : `Received ${formatReceivedDate(lead.receivedAt)}`}
            </MutedText>
          </HStack>
        </Box>
        <StatusPill icon={<Check size={11} />}>
          {alreadyConverted ? "Case opened" : "Retainer Received"}
        </StatusPill>
      </HStack>

      {lead.situationSummary ? (
        <Box mt="18px" p="12px" borderRadius="7px" bg="bg.muted" color="fg.muted" fontSize="13px">
          Active Situation Summary: {lead.situationSummary}
        </Box>
      ) : null}

      <Box mt="14px" pt="14px" borderTop="1px solid" borderColor="border.subtle">
        {alreadyConverted ? (
          <BrandButton w="100%" disabled>
            <Check size={14} />
            Case already opened
          </BrandButton>
        ) : (
          <BrandButton w="100%" loading={openCase.isPending} onClick={handleOpenCase}>
            <FolderOpen size={14} />
            Open physical case
          </BrandButton>
        )}
      </Box>
    </SurfaceCard>
  );
}
