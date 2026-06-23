import { Box, HStack, Stack } from "@chakra-ui/react";
import { Check, Clock, Eye, Send } from "lucide-react";
import { useState } from "react";
import type { Lead } from "@/api/leads";
import { formatReceivedDate } from "@/api/leads";
import { useLeads } from "@/hooks/use-leads";
import { useLeadQuestionnaire } from "@/hooks/use-questionnaires";
import {
  BrandButton,
  CardTitle,
  MutedText,
  OutlineButton,
  PracticePill,
  StatusPill,
  SurfaceCard,
} from "../../../../components/ui/intake-ui";
import { QuestionnaireResponseDialog } from "./questionnaire-response-dialog";
import { SendQuestionnaireDialog } from "./send-questionnaire-dialog";

export function QuestionnaireView() {
  const { data, isLoading } = useLeads({ stage: "questionnaire" });
  const leads = Array.isArray(data) ? data : (data?.leads ?? []);
  const totalSent = leads.filter((l) => l.questionnaireSendId).length;
  const [openResponseId, setOpenResponseId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [presetLeadId, setPresetLeadId] = useState<string | null>(null);

  function openWizard(leadId: string | null) {
    setPresetLeadId(leadId);
    setWizardOpen(true);
  }

  return (
    <Stack gap="16px" pt="24px" aria-label="Questionnaire queue">
      <HStack justify="space-between" gap="16px" wrap="wrap">
        <MutedText fontSize="14px">
          {isLoading
            ? "Loading…"
            : `${totalSent} questionnaire${totalSent === 1 ? "" : "s"} sent`}
        </MutedText>
        <OutlineButton onClick={() => openWizard(null)}>
          <Send size={14} />
          Send new questionnaire
        </OutlineButton>
      </HStack>

      {isLoading ? null : leads.length === 0 ? (
        <MutedText>No leads in questionnaire stage.</MutedText>
      ) : (
        <Stack gap="14px">
          {leads.map((lead) => (
            <QuestionnaireCard
              key={lead.id}
              lead={lead}
              onSendQuestionnaire={() => openWizard(lead.id)}
              onView={setOpenResponseId}
            />
          ))}
        </Stack>
      )}

      <QuestionnaireResponseDialog
        responseId={openResponseId}
        onClose={() => setOpenResponseId(null)}
      />
      <SendQuestionnaireDialog
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        presetLeadId={presetLeadId}
      />
    </Stack>
  );
}

function QuestionnaireCard({
  lead,
  onSendQuestionnaire,
  onView,
}: {
  lead: Lead;
  onSendQuestionnaire: () => void;
  onView: (responseId: string) => void;
}) {
  const hasSent = Boolean(lead.questionnaireSendId);
  const { data: state } = useLeadQuestionnaire(hasSent ? lead.id : "");
  const response = state?.response ?? null;
  const isSubmitted = response?.status === "submitted";

  return (
    <SurfaceCard>
      <HStack align="flex-start" justify="space-between" gap="16px">
        <Box>
          <CardTitle>Questionnaire: {lead.name}</CardTitle>
          <HStack mt="6px" gap="9px">
            <PracticePill tone="neutral">Lead</PracticePill>
            <MutedText>
              Received {formatReceivedDate(lead.receivedAt)}
            </MutedText>
          </HStack>
        </Box>
        {isSubmitted ? (
          <StatusPill tone="success" icon={<Check size={11} />}>
            Completed &amp; Received
          </StatusPill>
        ) : hasSent ? (
          <StatusPill tone="warning" icon={<Clock size={11} />}>
            Awaiting response
          </StatusPill>
        ) : (
          <StatusPill tone="warning">Not sent</StatusPill>
        )}
      </HStack>

      {lead.situationSummary ? (
        <Box
          mt="12px"
          p="10px"
          borderRadius="7px"
          bg="bg.muted"
          color="fg.muted"
          fontSize="13px"
        >
          {lead.situationSummary}
        </Box>
      ) : null}

      <Box mt="14px" pt="14px" borderTop="1px solid" borderColor="border.subtle">
        {!hasSent ? (
          <OutlineButton w="100%" onClick={onSendQuestionnaire}>
            <Send size={14} />
            Send questionnaire
          </OutlineButton>
        ) : isSubmitted && response ? (
          <BrandButton w="100%" onClick={() => onView(response.id)}>
            <Eye size={14} />
            View response
          </BrandButton>
        ) : (
          <OutlineButton w="100%" disabled>
            <Clock size={14} />
            Awaiting client response
          </OutlineButton>
        )}
      </Box>
    </SurfaceCard>
  );
}
