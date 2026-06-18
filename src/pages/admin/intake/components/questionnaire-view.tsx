import {
  Box,
  HStack,
  Stack,
} from "@chakra-ui/react";
import {
  FileText,
  Send,
} from "lucide-react";
import type { Lead } from "@/api/leads";
import { formatReceivedDate } from "@/api/leads";
import { useLeads, useSendQuestionnaire, useGenerateFeeAgreement } from "@/hooks/use-leads";
import {
  BrandButton,
  CardTitle,
  MutedText,
  OutlineButton,
  PracticePill,
  StatusPill,
  SurfaceCard,
} from "../../../../components/ui/intake-ui";

export function QuestionnaireView() {
  const { data, isLoading } = useLeads({ stage: "questionnaire" });
  const leads = Array.isArray(data) ? data : (data?.leads ?? []);

  const totalSent = leads.filter((l) => l.questionnaireSendId).length;

  return (
    <Stack gap="16px" pt="24px" aria-label="Questionnaire queue">
      <HStack justify="space-between" gap="16px" wrap="wrap">
        <MutedText fontSize="14px">
          {isLoading ? "Loading…" : `${totalSent} questionnaire${totalSent === 1 ? "" : "s"} sent`}
        </MutedText>
      </HStack>

      {isLoading ? null : leads.length === 0 ? (
        <MutedText>No leads in questionnaire stage.</MutedText>
      ) : (
        <Stack gap="14px">
          {leads.map((lead) => (
            <QuestionnaireCard key={lead.id} lead={lead} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function QuestionnaireCard({ lead }: { lead: Lead }) {
  const sendQ = useSendQuestionnaire();
  const generateAgreement = useGenerateFeeAgreement();

  const hasSentQuestionnaire = Boolean(lead.questionnaireSendId);

  function handleSendQuestionnaire() {
    sendQ.mutate(lead.id);
  }

  function handleGenerateFeeAgreement() {
    generateAgreement.mutate({
      id: lead.id,
      data: { agreementType: "retainer" },
    });
  }

  return (
    <SurfaceCard>
      <HStack align="flex-start" justify="space-between" gap="16px">
        <Box>
          <CardTitle>
            {hasSentQuestionnaire ? "Questionnaire sent: " : "Questionnaire pending: "}
            {lead.name}
          </CardTitle>
          <HStack mt="6px" gap="9px">
            <PracticePill tone="neutral">Lead</PracticePill>
            <MutedText>Received {formatReceivedDate(lead.receivedAt)}</MutedText>
          </HStack>
        </Box>
        <StatusPill tone={hasSentQuestionnaire ? "success" : "warning"}>
          {hasSentQuestionnaire ? "Sent" : "Not sent"}
        </StatusPill>
      </HStack>

      {lead.situationSummary ? (
        <Box mt="12px" p="10px" borderRadius="7px" bg="bg.muted" color="fg.muted" fontSize="13px">
          {lead.situationSummary}
        </Box>
      ) : null}

      <Box
        display="grid"
        gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }}
        gap="8px"
        mt="14px"
        pt="14px"
        borderTop="1px solid"
        borderColor="border.subtle"
      >
        {!hasSentQuestionnaire ? (
          <OutlineButton loading={sendQ.isPending} onClick={handleSendQuestionnaire}>
            <Send size={14} />
            Send questionnaire
          </OutlineButton>
        ) : (
          <OutlineButton loading={sendQ.isPending} onClick={handleSendQuestionnaire}>
            <Send size={14} />
            Resend questionnaire
          </OutlineButton>
        )}
        <BrandButton loading={generateAgreement.isPending} onClick={handleGenerateFeeAgreement}>
          <FileText size={14} />
          Generate fee agreement
        </BrandButton>
      </Box>
    </SurfaceCard>
  );
}
