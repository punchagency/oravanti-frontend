import {
  Box,
  Dialog,
  Flex,
  HStack,
  Stack,
  Text,
  VStack,
  chakra,
} from "@chakra-ui/react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Download,
  FileText,
  Lock,
  Send,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
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

type Questionnaire = (typeof questionnaires)[number];
type ResponseTab = "responses" | "documents";

export function QuestionnaireView() {
  const [selectedQuestionnaire, setSelectedQuestionnaire] =
    useState<Questionnaire | null>(null);

  return (
    <>
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
                <OutlineButton onClick={() => setSelectedQuestionnaire(questionnaire)}>
                  View response
                </OutlineButton>
                <BrandButton>
                  <FileText size={14} />
                  Generate fee agreement
                </BrandButton>
              </Box>
            </SurfaceCard>
          ))}
        </Stack>
      </Stack>

      <QuestionnaireResponseDialog
        key={selectedQuestionnaire?.title ?? "closed-questionnaire-response"}
        questionnaire={selectedQuestionnaire}
        onClose={() => setSelectedQuestionnaire(null)}
      />
    </>
  );
}

function QuestionnaireResponseDialog({
  questionnaire,
  onClose,
}: {
  questionnaire: Questionnaire | null;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ResponseTab>("responses");

  return (
    <Dialog.Root
      open={Boolean(questionnaire)}
      onOpenChange={(details) => {
        if (!details.open) {
          onClose();
        }
      }}
      placement="center"
    >
      <Dialog.Backdrop bg="rgba(0, 0, 0, 0.46)" />
      <Dialog.Positioner px="16px">
        <Dialog.Content
          w="full"
          maxW="680px"
          maxH="calc(100vh - 72px)"
          border="1px solid"
          borderColor="border"
          borderRadius="14px"
          bg="bg"
          p="0"
          overflow="hidden"
          boxShadow="0 24px 70px rgba(0, 0, 0, 0.26)"
        >
          {questionnaire ? (
            <Flex direction="column" maxH="calc(100vh - 72px)">
              <Box p="22px 24px 14px">
                <Flex align="flex-start" justify="space-between" gap="16px">
                  <Box minW="0">
                    <Dialog.Title color="fg" fontSize="17px" fontWeight="600" lineHeight="1.2">
                      {questionnaire.responseTitle}
                    </Dialog.Title>
                    <Dialog.Description mt="6px" color="fg.muted" fontSize="12px" lineHeight="1.3">
                      {questionnaire.matter} · {questionnaire.submitted} · {questionnaire.language}
                    </Dialog.Description>
                  </Box>
                  <chakra.button
                    type="button"
                    aria-label="Close questionnaire response"
                    display="grid"
                    placeItems="center"
                    flex="0 0 auto"
                    w="34px"
                    h="34px"
                    border="1px solid"
                    borderColor="border"
                    borderRadius="full"
                    bg="bg"
                    color="fg.muted"
                    onClick={onClose}
                  >
                    <X size={16} />
                  </chakra.button>
                </Flex>

                <Box mt="14px">
                  <Flex justify="space-between" gap="12px" color="fg.muted" fontSize="11px">
                    <Box as="span">Completion</Box>
                    <Box as="span">{questionnaire.answeredLabel}</Box>
                  </Flex>
                  <Box mt="7px" h="5px" borderRadius="999px" bg="border.subtle" overflow="hidden">
                    <Box
                      h="full"
                      w={`${questionnaire.completionPercent}%`}
                      borderRadius="inherit"
                      bg="brand.solid"
                    />
                  </Box>
                </Box>

                <HStack
                  align="flex-start"
                  gap="8px"
                  mt="14px"
                  p="10px 12px"
                  border="1px solid"
                  borderColor="brand.solid"
                  borderRadius="8px"
                  bg="#fff8e7"
                  color="brand.700"
                  fontSize="11px"
                  lineHeight="1.35"
                >
                  <Lock size={13} />
                  <Box>
                    Standard questions (marked with a lock) are pre-defined for this matter type and linked to court filings and case records. They cannot be removed.
                  </Box>
                </HStack>

                <HStack mt="18px" gap="0" borderBottom="1px solid" borderColor="border.subtle">
                  <ResponseTabButton
                    active={activeTab === "responses"}
                    onClick={() => setActiveTab("responses")}
                  >
                    Responses (18)
                  </ResponseTabButton>
                  <ResponseTabButton
                    active={activeTab === "documents"}
                    onClick={() => setActiveTab("documents")}
                  >
                    Documents ({questionnaire.documents.length})
                  </ResponseTabButton>
                </HStack>
              </Box>

              <Box flex="1" minH="0" overflowY="auto" px="24px" pb="18px">
                {activeTab === "responses" ? (
                  <QuestionnaireResponses questionnaire={questionnaire} />
                ) : (
                  <QuestionnaireDocuments documents={questionnaire.documents} />
                )}
              </Box>

              <Flex
                align="center"
                justify="space-between"
                gap="12px"
                p="14px 24px"
                borderTop="1px solid"
                borderColor="border.subtle"
                bg="bg"
              >
                <OutlineButton>
                  <Download size={14} />
                  Download PDF
                </OutlineButton>
                <HStack gap="8px">
                  <OutlineButton>
                    <Bell size={14} />
                    Send reminder
                  </OutlineButton>
                  <BrandButton minW="198px">
                    <ArrowRight size={14} />
                    Mark complete & proceed
                  </BrandButton>
                </HStack>
              </Flex>
            </Flex>
          ) : null}
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

function ResponseTabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <chakra.button
      type="button"
      minH="38px"
      px="14px"
      borderBottom="2px solid"
      borderColor={active ? "brand.solid" : "transparent"}
      color={active ? "fg" : "fg.muted"}
      bg="transparent"
      fontSize="12px"
      fontWeight={active ? "600" : "400"}
      textAlign="left"
      onClick={onClick}
    >
      {children}
    </chakra.button>
  );
}

function QuestionnaireResponses({
  questionnaire,
}: {
  questionnaire: Questionnaire;
}) {
  return (
    <VStack align="stretch" gap="0">
      {questionnaire.responseSections.map((section) => (
        <Box key={section.title}>
          <HStack
            gap="8px"
            mt="16px"
            mb="8px"
            px="12px"
            minH="28px"
            borderRadius="7px"
            bg="bg.subtle"
            color="fg.muted"
            fontSize="10px"
            fontWeight="600"
            letterSpacing="0.08em"
            textTransform="uppercase"
          >
            <Lock size={11} />
            <Box as="span">{section.title}</Box>
          </HStack>
          {section.questions.map(([question, answer]) => (
            <Box
              key={question}
              py="11px"
              borderBottom="1px solid"
              borderColor="border.subtle"
            >
              <HStack align="flex-start" gap="8px">
                <Lock size={11} color="var(--chakra-colors-fg-muted)" />
                <Box flex="1" minW="0">
                  <Text m="0" color="fg" fontSize="12px" fontWeight="600" lineHeight="1.35">
                    {question}
                  </Text>
                  {answer ? (
                    <Text m="7px 0 0" color="fg.muted" fontSize="13px" lineHeight="1.35">
                      {answer}
                    </Text>
                  ) : (
                    <Box
                      mt="8px"
                      px="10px"
                      py="6px"
                      borderRadius="6px"
                      bg="bg.subtle"
                      color="fg.muted"
                      fontSize="12px"
                      fontStyle="italic"
                    >
                      Not yet answered
                    </Box>
                  )}
                </Box>
              </HStack>
            </Box>
          ))}
        </Box>
      ))}
    </VStack>
  );
}

function QuestionnaireDocuments({ documents }: { documents: readonly string[] }) {
  return (
    <VStack align="stretch" gap="0" pt="10px">
      {documents.map((document) => (
        <HStack
          key={document}
          justify="space-between"
          gap="12px"
          py="12px"
          borderBottom="1px solid"
          borderColor="border.subtle"
        >
          <HStack gap="8px">
            <FileText size={14} />
            <Text m="0" color="fg" fontSize="13px" fontWeight="500">
              {document}
            </Text>
          </HStack>
          <MutedText>Received</MutedText>
        </HStack>
      ))}
    </VStack>
  );
}
