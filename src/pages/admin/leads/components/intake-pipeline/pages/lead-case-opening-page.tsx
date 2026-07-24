import { useParams } from "react-router";
import type { LeadLayout } from "@/api/leads";
import { useLeadLayout } from "@/hooks/use-leads";
import { useOpenCase } from "@/hooks/use-leads";
import {
  BrandButton,
  CardTitle,
  MutedText,
  PracticePill,
  StatusPill,
  SurfaceCard,
} from "@/components/ui/intake-ui";
import { Check, FolderOpen } from "lucide-react";
import { useState } from "react";
import { Box, HStack } from "@chakra-ui/react";
import { formatReceivedDate } from "@/api/leads";
import { TeamSelectionModal } from "../dialogs/team-selection-modal";
import { PipelineLayout, CaseOpeningSkeleton } from "./pipeline-layout";

export function CaseOpeningPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const { data: lead, isLoading } = useLeadLayout(leadId!);

  if (isLoading || !lead) {
    return <CaseOpeningSkeleton />;
  }

  return (
    <PipelineLayout lead={lead} activeStep="case_opening">
      <CaseOpeningSection lead={lead} />
    </PipelineLayout>
  );
}

function CaseOpeningSection({ lead }: { lead: LeadLayout }) {
  const [modalOpen, setModalOpen] = useState(false);
  const openCase = useOpenCase();
  const alreadyConverted = Boolean(lead.convertedCaseId);

  function handleTeamSelect(teamId: string | undefined) {
    setModalOpen(false);
    openCase.mutate({ id: lead.id, data: { assignedTeamId: teamId } });
  }

  return (
    <>
      <HStack justify="space-between" gap="16px" wrap="wrap">
        <MutedText fontSize="14px">
          {alreadyConverted ? "Case opened" : "Ready to open"}
        </MutedText>
        <StatusPill>Retainers confirmed</StatusPill>
      </HStack>

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
            <BrandButton
              w="100%"
              loading={openCase.isPending}
              onClick={() => setModalOpen(true)}
            >
              <FolderOpen size={14} />
              Open physical case
            </BrandButton>
          )}
        </Box>
      </SurfaceCard>

      <TeamSelectionModal
        leadId={lead.id}
        open={modalOpen}
        onOpenChange={({ open }) => setModalOpen(open)}
        onSelect={handleTeamSelect}
      />
    </>
  );
}
