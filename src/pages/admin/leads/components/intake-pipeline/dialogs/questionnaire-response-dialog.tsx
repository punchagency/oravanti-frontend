import {
  Box,
  Dialog,
  Flex,
  HStack,
  Text,
  VStack,
  chakra,
} from "@chakra-ui/react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  Download,
  FileText,
  Flag,
  Lock,
  RefreshCw,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  downloadResponseFile,
  downloadResponsePdf,
  type QuestionnaireResponseDetail,
  type ResponseFile,
} from "@/api/questionnaires";
import { useCanDownloadDocuments } from "@/hooks/use-can-download-documents";
import { useLeadById } from "@/hooks/use-leads";
import {
  useAcceptResponse,
  useResponseDetail,
  useSendReminder,
} from "@/hooks/use-questionnaires";
import {
  BrandButton,
  MutedText,
  OutlineButton,
} from "@/components/ui/intake-ui";

type ResponseTab = "responses" | "documents";

const renderValue = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return JSON.stringify(value);
};

export function QuestionnaireResponseDialog({
  responseId,
  onClose,
  initialTab = "responses",
}: {
  responseId: string | null;
  onClose: () => void;
  initialTab?: ResponseTab;
}) {
  const [activeTab, setActiveTab] = useState<ResponseTab>(initialTab);
  // Reset to the requested tab each time a new response opens the dialog
  // (render-phase pattern — no effect needed).
  const [openedFor, setOpenedFor] = useState<string | null>(responseId);
  if (responseId !== openedFor) {
    setOpenedFor(responseId);
    if (responseId) setActiveTab(initialTab);
  }
  const { data: detail, isLoading } = useResponseDetail(responseId);

  return (
    <Dialog.Root
      open={Boolean(responseId)}
      lazyMount
      unmountOnExit
      placement="center"
      onOpenChange={(d) => {
        if (!d.open) onClose();
      }}
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
          <Flex direction="column" maxH="calc(100vh - 72px)">
            {isLoading || !detail ? (
              <Box p="40px" textAlign="center">
                <MutedText>Loading response…</MutedText>
              </Box>
            ) : (
              <ResponseContent
                detail={detail}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onClose={onClose}
              />
            )}
          </Flex>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

function ResponseContent({
  detail,
  activeTab,
  setActiveTab,
  onClose,
}: {
  detail: QuestionnaireResponseDetail;
  activeTab: ResponseTab;
  setActiveTab: (t: ResponseTab) => void;
  onClose: () => void;
}) {
  const acceptResponse = useAcceptResponse();
  const sendReminder = useSendReminder();
  const [downloading, setDownloading] = useState(false);

  // State-aware footer: once the lead has been marked complete and moved past
  // the questionnaire, the accept action is shown as done; reminders are pointless
  // (and rejected by the backend) once the questionnaire has been submitted.
  const { data: lead } = useLeadById(detail.response.leadId ?? "");
  const questionnaireSubmitted = detail.response.status === "submitted";
  const alreadyAccepted =
    questionnaireSubmitted &&
    (lead
      ? ["consultation", "fee_agreement", "case_opening"].includes(
          lead.pipelineStage,
        )
      : true);

  const answerMap = useMemo(
    () => new Map(detail.answers.map((a) => [a.questionId, a.value])),
    [detail.answers],
  );
  const filesByQuestion = useMemo(
    () => new Map(detail.files.map((f) => [f.questionId, f])),
    [detail.files],
  );

  const sections = detail.send?.schemaSnapshot?.sections ?? [];
  const title = detail.send?.schemaSnapshot?.title ?? "Questionnaire response";
  const { answered, total } = detail.completion;
  const percent = total ? Math.round((answered / total) * 100) : 0;
  const submitted = detail.response.submittedAt
    ? new Date(detail.response.submittedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Not submitted";

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      await downloadResponsePdf(detail.response.id);
    } catch {
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  }

  function handleReminder() {
    if (detail.send?.id) sendReminder.mutate(detail.send.id);
  }

  function handleAccept() {
    acceptResponse.mutate(detail.response.id, { onSuccess: onClose });
  }

  return (
    <>
      <Box p="22px 24px 14px">
        <Flex align="flex-start" justify="space-between" gap="16px">
          <Box minW="0">
            <Dialog.Title color="fg" fontSize="17px" fontWeight="600" lineHeight="1.2">
              {title}
            </Dialog.Title>
            <Dialog.Description mt="6px" color="fg.muted" fontSize="12px" lineHeight="1.3">
              Submitted {submitted} · {detail.send?.language ?? "English"}
            </Dialog.Description>
          </Box>
          <Dialog.CloseTrigger asChild>
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
            >
              <X size={16} />
            </chakra.button>
          </Dialog.CloseTrigger>
        </Flex>

        <Box mt="14px">
          <Flex justify="space-between" gap="12px" color="fg.muted" fontSize="11px">
            <Box as="span">Completion</Box>
            <Box as="span">
              {answered} of {total} questions answered
            </Box>
          </Flex>
          <Box mt="7px" h="5px" borderRadius="999px" bg="border.subtle" overflow="hidden">
            <Box h="full" w={`${percent}%`} borderRadius="inherit" bg="brand.solid" />
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
            Standard questions (marked with a lock) are pre-defined for this matter
            type and linked to court/USCIS forms and case records. They cannot be
            removed.
          </Box>
        </HStack>

        <HStack mt="18px" gap="0" borderBottom="1px solid" borderColor="border.subtle">
          <ResponseTabButton
            active={activeTab === "responses"}
            onClick={() => setActiveTab("responses")}
          >
            Responses ({answered})
          </ResponseTabButton>
          <ResponseTabButton
            active={activeTab === "documents"}
            onClick={() => setActiveTab("documents")}
          >
            Documents ({detail.files.length})
          </ResponseTabButton>
        </HStack>
      </Box>

      <Box flex="1" minH="0" overflowY="auto" px="24px" pb="18px">
        {activeTab === "responses" ? (
          <VStack align="stretch" gap="0">
            {sections.map((section) => {
              const questions = section.questions.filter(
                (q) => q.type !== "file_upload",
              );
              if (!questions.length) return null;
              return (
                <Box key={section.id}>
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
                    <Box as="span">{section.title}</Box>
                  </HStack>
                  {questions.map((q) => {
                    const answer = renderValue(answerMap.get(q.id));
                    return (
                      <Box
                        key={q.id}
                        py="11px"
                        borderBottom="1px solid"
                        borderColor="border.subtle"
                      >
                        <Text m="0" color="fg" fontSize="12px" fontWeight="600" lineHeight="1.35">
                          {q.label}
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
                    );
                  })}
                </Box>
              );
            })}
          </VStack>
        ) : (
          <DocumentsTab files={detail.files} filesByQuestion={filesByQuestion} />
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
        <OutlineButton loading={downloading} onClick={handleDownloadPdf}>
          <Download size={14} />
          Download PDF
        </OutlineButton>
        <HStack gap="8px">
          <OutlineButton
            loading={sendReminder.isPending}
            disabled={questionnaireSubmitted}
            onClick={handleReminder}
          >
            <Bell size={14} />
            Send reminder
          </OutlineButton>
          {alreadyAccepted ? (
            <BrandButton minW="198px" disabled>
              <Check size={14} />
              Marked complete
            </BrandButton>
          ) : (
            <BrandButton
              minW="198px"
              loading={acceptResponse.isPending}
              onClick={handleAccept}
            >
              <ArrowRight size={14} />
              Mark complete &amp; proceed
            </BrandButton>
          )}
        </HStack>
      </Flex>
    </>
  );
}

function DocumentsTab({
  files,
  filesByQuestion,
}: {
  files: ResponseFile[];
  filesByQuestion: Map<string, ResponseFile>;
}) {
  void filesByQuestion;
  const canDownload = useCanDownloadDocuments();

  if (!files.length) {
    return (
      <Box pt="20px">
        <MutedText>No documents uploaded yet.</MutedText>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap="10px" pt="12px">
      {files.map((file) => (
        <Box
          key={file.id}
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="9px"
          p="12px"
        >
          <HStack justify="space-between" gap="12px">
            <HStack gap="8px" minW="0">
              <FileText size={14} />
              <Text color="fg" fontSize="13px" fontWeight="500" truncate>
                {file.originalFilename}
              </Text>
            </HStack>
            {canDownload ? (
              <OutlineButton
                h="30px"
                px="10px"
                onClick={() => downloadResponseFile(file.id, file.originalFilename)}
              >
                <Download size={13} />
                Download
              </OutlineButton>
            ) : null}
          </HStack>

          {file.scanStatus === "issues_found" && file.scanResult?.length ? (
            <Box
              mt="10px"
              p="10px"
              borderRadius="7px"
              border="1px solid"
              borderColor="#e0796f"
              bg="#fdecea"
            >
              {file.scanResult.map((finding, i) => (
                <HStack key={i} align="flex-start" gap="8px" mb={i === file.scanResult!.length - 1 ? "0" : "8px"}>
                  <AlertTriangle size={13} color="#c0392b" />
                  <Box>
                    <Text fontSize="12px" fontWeight="600" color="#922b21">
                      {finding.title}
                    </Text>
                    <Text fontSize="11px" color="#7b241c" lineHeight="1.4">
                      {finding.description}
                    </Text>
                  </Box>
                </HStack>
              ))}
              <HStack gap="8px" mt="10px">
                <OutlineButton
                  h="28px"
                  px="10px"
                  onClick={() => toast.success("Re-upload requested from client")}
                >
                  <RefreshCw size={12} />
                  Request re-upload
                </OutlineButton>
                <OutlineButton
                  h="28px"
                  px="10px"
                  onClick={() => toast.success("Flagged for advisory review")}
                >
                  <Flag size={12} />
                  Flag for advisory
                </OutlineButton>
              </HStack>
            </Box>
          ) : (
            <Box mt="6px">
              <MutedText fontSize="11px">
                {file.scanStatus === "clean"
                  ? "✓ AI scan: no issues detected"
                  : file.scanStatus === "pending" ||
                      file.scanStatus === "scanning"
                    ? "AI scan in progress…"
                    : "Scan unavailable"}
              </MutedText>
            </Box>
          )}
        </Box>
      ))}
    </VStack>
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
