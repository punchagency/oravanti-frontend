import { Box, HStack, Stack } from "@chakra-ui/react";
import { AlertTriangle, FileText, Send } from "lucide-react";
import { questionnaires } from "../data";
import {
  BrandButton,
  CardTitle,
  MutedText,
  OutlineButton,
  PracticePill,
  StatusPill,
  SurfaceCard,
} from "./intake-ui";

export function QuestionnaireView() {
  return (
    <Stack gap="16px" pt="24px" aria-label="Questionnaire queue">
      <HStack justify="space-between" gap="16px" wrap="wrap">
        <MutedText fontSize="14px">2 questionnaires sent</MutedText>
        <OutlineButton>
          <Send size={14} />
          Send new questionnaire
        </OutlineButton>
      </HStack>

      <Stack gap="14px">
        {questionnaires.map((questionnaire) => (
          <SurfaceCard key={questionnaire.title}>
            <HStack align="flex-start" justify="space-between" gap="16px">
              <Box>
                <CardTitle>{questionnaire.title}</CardTitle>
                <HStack mt="6px" gap="9px">
                  <PracticePill tone={questionnaire.practiceTone}>
                    {questionnaire.practiceArea}
                  </PracticePill>
                  <MutedText>Received from {questionnaire.receivedFrom}</MutedText>
                </HStack>
                {!questionnaire.addOnActive ? (
                  <HStack mt="0" gap="3px" color="brand.700" fontSize="10px" fontWeight="500">
                    <AlertTriangle size={11} />
                    <Box as="span">Not active</Box>
                  </HStack>
                ) : null}
              </Box>
              <StatusPill>{questionnaire.statusLabel}</StatusPill>
            </HStack>

            <Box
              display="grid"
              gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }}
              gap="8px"
              mt="14px"
              pt="14px"
              borderTop="1px solid"
              borderColor="border.subtle"
            >
              <OutlineButton>View response</OutlineButton>
              <BrandButton>
                <FileText size={14} />
                Generate fee agreement
              </BrandButton>
            </Box>
          </SurfaceCard>
        ))}
      </Stack>
    </Stack>
  );
}
