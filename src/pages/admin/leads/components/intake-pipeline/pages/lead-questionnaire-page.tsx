import { useParams } from "react-router";
import type { LeadLayout } from "@/api/leads";
import { formatReceivedDate } from "@/api/leads";
import { useLeadLayout } from "@/hooks/use-leads";
import { useLeadQuestionnaire } from "@/hooks/use-questionnaires";
import {
  CardTitle,
  MutedText,
  OutlineButton,
  PracticePill,
  StatusPill,
  SurfaceCard,
} from "@/components/ui/intake-ui";
import { Check, Clock, Eye, Send } from "lucide-react";
import { useState } from "react";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { SendQuestionnaireDialog } from "../dialogs/send-questionnaire-dialog";
import { QuestionnaireResponseDialog } from "../dialogs/questionnaire-response-dialog";
import { PipelineLayout, QuestionnaireSkeleton } from "./pipeline-layout";

export function QuestionnairePage() {
  const { leadId } = useParams<{ leadId: string }>();
  const { data: lead, isLoading } = useLeadLayout(leadId!);

  if (isLoading || !lead) {
    return <QuestionnaireSkeleton />;
  }

  return (
    <PipelineLayout lead={lead} activeStep="questionnaire">
      <QuestionnaireSection lead={lead} />
    </PipelineLayout>
  );
}

function QuestionnaireSection({ lead }: { lead: LeadLayout }) {
  const { data: state, isLoading } = useLeadQuestionnaire(lead.id);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [openResponseId, setOpenResponseId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <>
        <HStack justify="space-between" gap="16px">
          <ThemeSkeleton h="12px" w="140px" borderRadius="4px" />
          <ThemeSkeleton h="28px" w="130px" borderRadius="6px" />
        </HStack>
        <SurfaceCard>
          <HStack align="flex-start" justify="space-between" gap="16px">
            <Box flex={1}>
              <ThemeSkeleton h="14px" w="50%" borderRadius="4px" mb={2} />
              <HStack gap={2}>
                <ThemeSkeleton h="16px" w="32px" borderRadius="full" />
                <ThemeSkeleton h="10px" w="80px" borderRadius="4px" />
              </HStack>
            </Box>
            <ThemeSkeleton h="18px" w="80px" borderRadius="full" />
          </HStack>
          <ThemeSkeleton h="10px" w="70%" borderRadius="4px" mt={3} />
          <Box mt="14px" pt="14px" borderTop="1px solid" borderColor="border.subtle">
            <ThemeSkeleton h="32px" w="100%" borderRadius="6px" />
          </Box>
        </SurfaceCard>
      </>
    );
  }

  const hasSent = Boolean(state);
  const response = state?.response ?? null;
  const isSubmitted = response?.status === "submitted";

  return (
    <>
      <HStack justify="space-between" gap="16px" wrap="wrap">
        <MutedText fontSize="14px">
          {hasSent ? "Questionnaire sent" : "Questionnaire not sent yet"}
        </MutedText>
        {!hasSent ? (
          <OutlineButton onClick={() => setWizardOpen(true)}>
            <Send size={14} />
            Send new questionnaire
          </OutlineButton>
        ) : !isSubmitted ? (
          <OutlineButton onClick={() => setWizardOpen(true)}>
            <Send size={14} />
            Resend questionnaire
          </OutlineButton>
        ) : isSubmitted ? (
          <OutlineButton onClick={() => response && setOpenResponseId(response.id)}>
            <Eye size={14} />
            View response
          </OutlineButton>
        ) : null}
      </HStack>

      <SurfaceCard>
        <HStack align="flex-start" justify="space-between" gap="16px">
          <Box>
            <CardTitle>Questionnaire: {lead.name}</CardTitle>
            <HStack mt="6px" gap="9px">
              <PracticePill tone="neutral">Lead</PracticePill>
              <MutedText>Received {formatReceivedDate(lead.receivedAt)}</MutedText>
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
          <Box mt="12px" p="10px" borderRadius="7px" bg="bg.muted" color="fg.muted" fontSize="13px">
            {lead.situationSummary}
          </Box>
        ) : null}

        <Box mt="14px" pt="14px" borderTop="1px solid" borderColor="border.subtle">
          {!hasSent ? (
            <OutlineButton w="100%" onClick={() => setWizardOpen(true)}>
              <Send size={14} />
              Send questionnaire
            </OutlineButton>
          ) : isSubmitted && response ? (
            <Stack gap="6px" align="center">
              <HStack gap="6px" color="#00785a" justify="center">
                <Check size={14} />
                <Text m="0" fontSize="13px" fontWeight="500">
                  Questionnaire completed
                </Text>
              </HStack>
              <OutlineButton onClick={() => setOpenResponseId(response.id)}>
                <Eye size={14} />
                View response
              </OutlineButton>
            </Stack>
          ) : (
            <Stack gap="8px">
              <OutlineButton w="100%" disabled>
                <Clock size={14} />
                Awaiting client response
              </OutlineButton>
              <OutlineButton w="100%" onClick={() => setWizardOpen(true)}>
                <Send size={14} />
                Resend questionnaire
              </OutlineButton>
            </Stack>
          )}
        </Box>
      </SurfaceCard>

      <SendQuestionnaireDialog
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        presetLeadId={lead.id}
      />

      <QuestionnaireResponseDialog
        responseId={openResponseId}
        onClose={() => setOpenResponseId(null)}
      />
    </>
  );
}
