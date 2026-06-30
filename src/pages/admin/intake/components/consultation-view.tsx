import {
  Box,
  Dialog,
  Flex,
  Grid,
  HStack,
  Input,
  Stack,
  Switch,
  Text,
  Textarea,
  chakra,
} from "@chakra-ui/react";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  Check,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileText,
  Info,
  Lock,
  Mail,
  MapPin,
  Phone,
  Scale,
  Send,
  UserX,
  Video,
  X,
} from "lucide-react";
import type { ChangeEvent, ReactNode } from "react";
import { Fragment, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Lead } from "@/api/leads";
import { toast } from "sonner";
import { formatReceivedDate } from "@/api/leads";
import { downloadResponseFile } from "@/api/questionnaires";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { FormSelect } from "@/components/ui/form-select";
import { useCanDownloadDocuments } from "@/hooks/use-can-download-documents";
import {
  useAdvanceLeadStage,
  useInitiateConsultation,
  useGenerateFeeAgreement,
  useLeadById,
  useLeads,
  useMarkFeeAgreementReceived,
  useNudgeClient,
  useSendFeeAgreement,
  useUpdateConsultation,
  useUpdateLead,
} from "@/hooks/use-leads";
import {
  useLeadQuestionnaire,
  useRequestMissingDocuments,
  useResponseDetail,
  useUploadResponseFile,
} from "@/hooks/use-questionnaires";
import { useStaffList, type StaffMemberDTO } from "@/hooks/use-staff-list";
import {
  useConsultationLocations,
  useConsultationSettings,
  useCreateConsultationLocation,
} from "@/hooks/use-consultation-settings";
import type {
  ConsultationLocation,
  ConsultationSettings,
} from "@/api/consultation-settings";
import {
  BrandButton,
  CardTitle,
  IntakeListSkeleton,
  MutedText,
  OutlineButton,
  StatusPill,
  SurfaceCard,
} from "../../../../components/ui/intake-ui";
import { QuestionnaireResponseDialog } from "./questionnaire-response-dialog";

type ScheduleStep = 1 | 2 | 3;
type ConsultationMode = "video" | "in_person" | "phone_call";

const STEP_META: Record<ScheduleStep, { title: string; label: string }> = {
  1: { title: "Schedule consultation", label: "Step 1 of 3 — Select lead" },
  2: {
    title: "Consultation details",
    label: "Step 2 of 3 — Consultation details",
  },
  3: { title: "Review & confirm", label: "Step 3 of 3 — Review & confirm" },
};

const CONSULTATION_TYPE_OPTIONS: { value: ConsultationMode; label: string }[] =
  [
    { value: "video", label: "Video call" },
    { value: "phone_call", label: "Phone call" },
    { value: "in_person", label: "In person" },
  ];

const DURATION_PRESETS = [30, 45, 60, 90] as const;
type DurationChoice = (typeof DURATION_PRESETS)[number] | "custom";

function consultationModeLabel(mode: ConsultationMode): string {
  return (
    CONSULTATION_TYPE_OPTIONS.find((o) => o.value === mode)?.label ??
    "Video call"
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatIsoTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function consultationModeIcon(mode: ConsultationMode | undefined) {
  if (mode === "video") return <Video size={12} />;
  if (mode === "phone_call") return <Phone size={12} />;
  return <MapPin size={12} />;
}

export function ConsultationView() {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [presetLeadId, setPresetLeadId] = useState<string | null>(null);
  const { data, isLoading } = useLeads({ stage: "consultation" });
  const leads = Array.isArray(data) ? data : (data?.leads ?? []);

  const noConsultation = leads.filter((l) => !l.consultationId);
  const scheduled = leads.filter((l) => l.consultationId);

  function openWizard(leadId: string | null) {
    setPresetLeadId(leadId);
    setScheduleOpen(true);
  }

  return (
    <>
      <Stack gap="20px" pt="24px" aria-label="Consultation and notes">
        <HStack justify="space-between" gap="16px" wrap="wrap">
          <MutedText fontSize="14px">Consultation &amp; notes</MutedText>
          <OutlineButton onClick={() => openWizard(null)}>
            <CalendarDays size={14} />
            Schedule consultation
          </OutlineButton>
        </HStack>

        {isLoading ? (
          <IntakeListSkeleton />
        ) : leads.length === 0 ? (
          <MutedText>No leads in the consultation stage.</MutedText>
        ) : (
          <Stack gap="20px">
            {noConsultation.length > 0 ? (
              <Stack gap="12px">
                <MutedText fontSize="14px">
                  {noConsultation.length} lead
                  {noConsultation.length === 1 ? "" : "s"} with no consultation
                  scheduled yet
                </MutedText>
                <Stack gap="16px">
                  {noConsultation.map((lead) => (
                    <ConsultationCard
                      key={lead.id}
                      lead={lead}
                      onSchedule={() => openWizard(lead.id)}
                    />
                  ))}
                </Stack>
              </Stack>
            ) : null}

            {noConsultation.length > 0 && scheduled.length > 0 ? (
              <Box borderTop="1px solid" borderColor="border" />
            ) : null}

            {scheduled.length > 0 ? (
              <Stack gap="12px">
                <MutedText fontSize="14px">
                  {scheduled.length} consultation
                  {scheduled.length === 1 ? "" : "s"} in progress
                </MutedText>
                <Stack gap="16px">
                  {scheduled.map((lead) => (
                    <ConsultationCard key={lead.id} lead={lead} />
                  ))}
                </Stack>
              </Stack>
            ) : null}
          </Stack>
        )}
      </Stack>

      <ScheduleConsultationDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        presetLeadId={presetLeadId}
      />
    </>
  );
}

function ConsultationCard({
  lead,
  onSchedule,
}: {
  lead: Lead;
  onSchedule?: () => void;
}) {
  const { data: leadDetail } = useLeadById(lead.id);
  const { data: questionnaire } = useLeadQuestionnaire(lead.id);
  const responseId = questionnaire?.response?.id ?? null;
  const { data: responseDetail } = useResponseDetail(responseId);
  const canDownload = useCanDownloadDocuments();
  const { data: staffData } = useStaffList({
    role: "attorney",
    status: "active",
  });

  const saveNotesMutation = useUpdateConsultation();
  const saveLeadNotes = useUpdateLead();
  const completeMutation = useUpdateConsultation();
  const noShowMutation = useUpdateConsultation();
  const outcomesMutation = useUpdateConsultation();
  const generateFee = useGenerateFeeAgreement();
  const sendFee = useSendFeeAgreement();
  const markReceived = useMarkFeeAgreementReceived();
  const nudgeClient = useNudgeClient();
  const advanceStage = useAdvanceLeadStage();
  const requestMissing = useRequestMissingDocuments();

  const consultation = leadDetail?.consultation;
  const hasConsultation = Boolean(consultation);
  const feeAgreement = leadDetail?.feeAgreement;
  const send = questionnaire?.send;
  const response = questionnaire?.response;

  const [notes, setNotes] = useState<string | null>(null);
  const [now, setTime] = useState(() => Date.now());
  const baseNotes = hasConsultation
    ? (consultation?.attorneyNotes ?? "")
    : (leadDetail?.notes ?? "");
  const displayNotes = notes !== null ? notes : baseNotes;
  const [docDialog, setDocDialog] = useState<{
    id: string;
    tab: "responses" | "documents";
  } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const attorneys = staffData?.data ?? [];
  const attorneyName = (() => {
    if (!consultation?.leadAttorneyId) return "Unassigned";
    const a = attorneys.find((s) => s.id === consultation.leadAttorneyId);
    return a ? `${a.firstName} ${a.lastName}`.trim() : "Assigned attorney";
  })();

  const modeLabel = consultation
    ? consultationModeLabel(consultation.mode)
    : null;
  const consultationDate = consultation?.scheduledAt
    ? formatReceivedDate(consultation.scheduledAt)
    : "—";
  const consultationTime = consultation?.scheduledAt
    ? formatIsoTime(consultation.scheduledAt)
    : "—";
  const consultStatusLabel = consultation
    ? (
        {
          scheduled: "Scheduled",
          in_progress: "In progress",
          completed: "Completed",
          cancelled: "Cancelled",
          no_show: "No show",
        } as const
      )[consultation.status]
    : null;
  const consultStatusTone: "info" | "success" | "danger" =
    consultation?.status === "cancelled" || consultation?.status === "no_show"
      ? "danger"
      : consultation?.status === "scheduled"
        ? "info"
        : "success";

  // A consultation can be marked complete once it exists, hasn't already been
  // completed/cancelled, and its scheduled start time has passed.
  const consultationCompleted = consultation?.status === "completed";
  const isCompletable =
    consultation?.status === "scheduled" ||
    consultation?.status === "in_progress";
  const scheduledAt = consultation?.scheduledAt;
  const startTimeReached = scheduledAt
    ? now >= new Date(scheduledAt).getTime()
    : false;
  const canComplete = isCompletable && startTimeReached;

  // ── Documents ──────────────────────────────────────────────────────────────
  // Staff can manually attach a document received outside the client portal.
  const uploadFile = useUploadResponseFile();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingQidRef = useRef<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  function handlePickDocument(questionId: string) {
    pendingQidRef.current = questionId;
    fileInputRef.current?.click();
  }
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    const questionId = pendingQidRef.current;
    e.currentTarget.value = "";
    pendingQidRef.current = null;
    if (!file || !questionId || !responseId) return;
    setUploadingId(questionId);
    uploadFile.mutate(
      { responseId, questionId, file },
      { onSettled: () => setUploadingId(null) },
    );
  }

  const sections = responseDetail?.send?.schemaSnapshot?.sections ?? [];
  const fileQuestions = sections.flatMap((s) =>
    (s.questions ?? []).filter((q) => q.type === "file_upload"),
  );
  const labelByQuestionId = new Map(fileQuestions.map((q) => [q.id, q.label]));
  const files = responseDetail?.files ?? [];
  const uploadedQuestionIds = new Set(files.map((f) => f.questionId));
  const totalDocs = fileQuestions.length;
  const receivedCount = fileQuestions.filter((q) =>
    uploadedQuestionIds.has(q.id),
  ).length;
  const pendingQuestions = fileQuestions.filter(
    (q) => !uploadedQuestionIds.has(q.id),
  );
  const issueFiles = files.filter((f) => f.scanStatus === "issues_found");
  const issueCount = issueFiles.reduce(
    (n, f) => n + (f.scanResult?.length ?? 0),
    0,
  );

  // ── Questionnaire status ─────────────────────────────────────────────────────
  const questionnaireComplete =
    response?.status === "submitted" || send?.status === "submitted";
  const submittedDate = response?.submittedAt
    ? formatReceivedDate(response.submittedAt)
    : null;

  // ── Fee agreement tracker ────────────────────────────────────────────────────
  const caseOpened = Boolean(leadDetail?.convertedCaseId);
  const feeStageIndex = caseOpened
    ? 4
    : feeAgreement?.status === "signed"
      ? 3
      : feeAgreement?.status === "pending_signature"
        ? 2
        : feeAgreement?.status === "draft"
          ? 1
          : 0;
  const feeStatus: {
    label: string;
    tone: "success" | "warning" | "neutral" | "gold";
  } = caseOpened
    ? { label: "Signed & received", tone: "success" }
    : feeAgreement?.status === "signed"
      ? { label: "Signed", tone: "success" }
      : feeAgreement?.status === "pending_signature"
        ? { label: "Sent", tone: "warning" }
        : feeAgreement?.status === "draft"
          ? { label: "Generated", tone: "gold" }
          : { label: "Not started", tone: "neutral" };

  const alreadySettled =
    consultation?.outcome === "close_no_case" ||
    consultation?.outcome === "refer_elsewhere";

  function handleSaveNotes() {
    if (hasConsultation) {
      saveNotesMutation.mutate(
        { id: lead.id, data: { attorneyNotes: displayNotes } },
        { onSuccess: () => setNotes(null) },
      );
    } else {
      saveLeadNotes.mutate(
        { id: lead.id, data: { notes: displayNotes } },
        { onSuccess: () => setNotes(null) },
      );
    }
  }
  function handleCompleteConsultation() {
    completeMutation.mutate({ id: lead.id, data: { status: "completed" } });
  }
  function handleNoShow() {
    noShowMutation.mutate({ id: lead.id, data: { status: "no_show" } });
  }
  function handleFollowUp() {
    outcomesMutation.mutate({ id: lead.id, data: { outcome: "follow_up" } });
  }
  function handleCloseNoCase() {
    outcomesMutation.mutate({
      id: lead.id,
      data: { outcome: "close_no_case" },
    });
  }
  function handleReferElsewhere() {
    outcomesMutation.mutate({
      id: lead.id,
      data: { outcome: "refer_elsewhere" },
    });
  }

  return (
    <SurfaceCard>
      {/* 1. Lead + consultation details */}
      <HStack align="flex-start" justify="space-between" gap="16px" wrap="wrap">
        <HStack gap="12px" minW="0" align="flex-start">
          <Avatar name={lead.name} />
          <Box minW="0">
            <CardTitle>{lead.name}</CardTitle>
            <MutedText>{lead.caseTypeName ?? "Matter type not set"}</MutedText>
          </Box>
        </HStack>
        {consultation ? (
          <HStack gap="10px" wrap="wrap" justify="flex-end" align="center">
            <StatusPill tone={consultStatusTone}>
              {consultStatusLabel}
            </StatusPill>
            <StatusPill
              tone="neutral"
              icon={consultationModeIcon(consultation.mode)}
            >
              {modeLabel}
            </StatusPill>
            <MutedText>
              {consultationDate} · {consultationTime} · {consultation.duration}{" "}
              min
            </MutedText>
          </HStack>
        ) : (
          <HStack gap="8px" align="center">
            <StatusPill tone="warning" icon={<CalendarClock size={11} />}>
              No consultation scheduled
            </StatusPill>
            {onSchedule ? (
              <BrandButton onClick={onSchedule}>
                <CalendarDays size={14} />
                Schedule consultation
              </BrandButton>
            ) : null}
          </HStack>
        )}
      </HStack>

      {/* 2. Questionnaire row */}
      <SectionRow>
        <HStack justify="space-between" gap="12px" wrap="wrap">
          <HStack gap="12px" minW="0" align="flex-start">
            <IconSquare>
              <ClipboardCheck size={17} />
            </IconSquare>
            <Box minW="0">
              <Text m="0" color="fg" fontSize="13px" fontWeight="500">
                {questionnaireComplete
                  ? "Questionnaire completed"
                  : "Awaiting response"}
              </Text>
              <MutedText>
                {submittedDate ? `Submitted ${submittedDate} · ` : ""}
                {titleCase(send?.language ?? "English")}
              </MutedText>
            </Box>
          </HStack>
          {responseId ? (
            <TextLink
              onClick={() => setDocDialog({ id: responseId, tab: "responses" })}
            >
              View responses
            </TextLink>
          ) : null}
        </HStack>
      </SectionRow>

      {/* 3. Documents */}
      <SectionRow>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <Stack gap="12px">
          {/* Documents only exist once the lead has a questionnaire response. */}
          {responseId ? (
            <>
              <HStack justify="space-between" gap="12px" wrap="wrap">
                <HStack gap="8px">
                  <Text m="0" color="fg" fontSize="13px" fontWeight="500">
                    Documents
                  </Text>
                  <MutedText>
                    {receivedCount} of {totalDocs} received
                  </MutedText>
                </HStack>
                <TextLink
                  loading={requestMissing.isPending}
                  disabled={!send || pendingQuestions.length === 0}
                  onClick={() => send && requestMissing.mutate(send.id)}
                >
                  Request missing
                </TextLink>
              </HStack>

              {files.length > 0 ? (
                <Box>
                  <SubLabel>Uploaded by client</SubLabel>
                  <Stack gap="0">
                    {files.map((file) => (
                      <HStack
                        key={file.id}
                        justify="space-between"
                        gap="10px"
                        py="10px"
                        borderBottom="1px solid"
                        borderColor="border.subtle"
                        _last={{ borderBottom: 0 }}
                      >
                        <HStack gap="10px" minW="0">
                          <CheckMarker checked tone="green" />
                          <Box minW="0">
                            <Text
                              m="0"
                              color="fg"
                              fontSize="13px"
                              fontWeight="500"
                              truncate
                              title={
                                labelByQuestionId.get(file.questionId) ??
                                file.originalFilename
                              }
                            >
                              {labelByQuestionId.get(file.questionId) ??
                                file.originalFilename}
                            </Text>
                            <MutedText>
                              {file.originalFilename} ·{" "}
                              {formatBytes(file.fileSize)}
                            </MutedText>
                          </Box>
                        </HStack>
                        <HStack gap="8px" flex="0 0 auto">
                          <StatusPill tone="success">Received</StatusPill>
                          {canDownload ? (
                            <chakra.button
                              type="button"
                              aria-label={`Download ${file.originalFilename}`}
                              display="grid"
                              placeItems="center"
                              w="26px"
                              h="26px"
                              color="fg.muted"
                              onClick={() =>
                                void downloadResponseFile(
                                  file.id,
                                  file.originalFilename,
                                )
                              }
                            >
                              <Download size={15} />
                            </chakra.button>
                          ) : null}
                        </HStack>
                      </HStack>
                    ))}
                  </Stack>
                </Box>
              ) : null}

              {pendingQuestions.length > 0 ? (
                <Box>
                  <SubLabel>Required — pending receipt</SubLabel>
                  <Stack gap="0">
                    {pendingQuestions.map((q) => {
                      const isUploading = uploadingId === q.id;
                      return (
                        <HStack
                          key={q.id}
                          justify="space-between"
                          gap="10px"
                          py="10px"
                          borderBottom="1px solid"
                          borderColor="border.subtle"
                          _last={{ borderBottom: 0 }}
                        >
                          <HStack gap="10px" minW="0">
                            <CheckMarker
                              checked={false}
                              tone="gold"
                              onClick={
                                isUploading
                                  ? undefined
                                  : () => handlePickDocument(q.id)
                              }
                              label={`Upload ${q.label} received outside the portal`}
                            />
                            <Box minW="0">
                              <Text
                                m="0"
                                color="fg"
                                fontSize="13px"
                                fontWeight="500"
                                truncate
                                title={q.label}
                              >
                                {q.label}
                              </Text>
                              <HStack gap="4px" color="fg.muted">
                                <MutedText>Required</MutedText>
                                <Lock size={10} />
                              </HStack>
                            </Box>
                          </HStack>
                          <StatusPill
                            tone={isUploading ? "neutral" : "warning"}
                          >
                            {isUploading ? "Uploading…" : "Pending"}
                          </StatusPill>
                        </HStack>
                      );
                    })}
                  </Stack>
                  <HStack gap="6px" mt="8px" color="fg.muted">
                    <Info size={12} />
                    <MutedText>
                      Click the box next to a document to upload one received
                      outside the client portal (e.g. in-person, by email, or
                      via scan).
                    </MutedText>
                  </HStack>
                </Box>
              ) : null}

              {issueFiles.length > 0 && responseId ? (
                <HStack
                  justify="space-between"
                  gap="12px"
                  wrap="wrap"
                  p="10px 14px"
                  borderRadius="8px"
                  bg="#ffe2e4"
                >
                  <HStack gap="10px" minW="0" wrap="wrap">
                    <HStack gap="6px" color="fg.muted">
                      <Scale size={14} />
                      <Text
                        m="0"
                        fontSize="10px"
                        fontWeight="600"
                        textTransform="uppercase"
                      >
                        Document review
                      </Text>
                    </HStack>
                    <HStack gap="6px" color="#b00020">
                      <AlertTriangle size={14} />
                      <Text m="0" fontSize="12px" fontWeight="500">
                        {issueCount} issue{issueCount === 1 ? "" : "s"} detected
                        — review required
                      </Text>
                    </HStack>
                  </HStack>
                  <OutlineButton
                    onClick={() =>
                      setDocDialog({ id: responseId, tab: "documents" })
                    }
                  >
                    View details
                  </OutlineButton>
                </HStack>
              ) : null}
            </>
          ) : null}

          <Box>
            <Text m="0" color="fg" fontSize="13px" fontWeight="500">
              Attorney notes
            </Text>
            <MutedText>
              {hasConsultation
                ? "Notes are internal and not visible to the client."
                : "Capture observations before the consultation — saved to the lead and internal only."}
            </MutedText>
            <Textarea
              aria-label={`${lead.name} attorney notes`}
              value={displayNotes}
              onChange={(e) => setNotes(e.currentTarget.value)}
              mt="8px"
              minH="96px"
              p="12px"
              borderColor="border"
              bg="bg"
              resize="vertical"
              placeholder="Record consultation notes, client statements, key facts, and your preliminary assessment here. These notes are saved to the matter record and referenced in the fee agreement stage."
            />
            <Flex justify="flex-end" mt="8px">
              <OutlineButton
                loading={saveNotesMutation.isPending || saveLeadNotes.isPending}
                onClick={handleSaveNotes}
              >
                Save notes
              </OutlineButton>
            </Flex>
          </Box>
        </Stack>
      </SectionRow>

      {/* 4. Fee agreement — unlocks once the consultation is completed */}
      {consultationCompleted ? (
        <SectionRow>
          <Stack gap="14px">
            <HStack justify="space-between" gap="12px" wrap="wrap">
              <Text m="0" color="fg" fontSize="13px" fontWeight="500">
                Fee agreement
              </Text>
              <StatusPill tone={feeStatus.tone}>{feeStatus.label}</StatusPill>
            </HStack>
            <FeeAgreementTracker activeIndex={feeStageIndex} />
            {caseOpened ? (
              <HStack gap="6px" color="#00785a">
                <Check size={14} />
                <Text m="0" fontSize="12px" fontWeight="500">
                  Signed &amp; received — case opened successfully
                </Text>
              </HStack>
            ) : !feeAgreement ? (
              <HStack gap="8px" wrap="wrap">
                <BrandButton
                  loading={generateFee.isPending}
                  onClick={() =>
                    generateFee.mutate({
                      id: lead.id,
                      data: {
                        agreementType: "retainer",
                        generatedFrom: "manual",
                      },
                    })
                  }
                >
                  <FileText size={14} />
                  Generate fee agreement
                </BrandButton>
              </HStack>
            ) : feeAgreement.status === "draft" ? (
              <Stack gap="10px">
                <MutedText>Agreement generated — ready to dispatch.</MutedText>
                <HStack gap="8px" wrap="wrap">
                  <BrandButton
                    loading={sendFee.isPending}
                    onClick={() => sendFee.mutate(feeAgreement.id)}
                  >
                    <Send size={14} />
                    Send to client
                  </BrandButton>
                </HStack>
              </Stack>
            ) : feeAgreement.status === "pending_signature" ? (
              <Stack gap="10px">
                <MutedText>
                  Signing link sent — awaiting client signature.
                </MutedText>
                <HStack gap="8px" wrap="wrap">
                  <BrandButton
                    loading={markReceived.isPending}
                    onClick={() => markReceived.mutate(feeAgreement.id)}
                  >
                    <Check size={14} />
                    Mark as received
                  </BrandButton>
                  <OutlineButton
                    loading={nudgeClient.isPending}
                    onClick={() => nudgeClient.mutate(feeAgreement.id)}
                  >
                    <Mail size={14} />
                    Nudge client
                  </OutlineButton>
                </HStack>
              </Stack>
            ) : feeAgreement.status === "signed" ? (
              <Stack gap="10px">
                <MutedText>Signed document received.</MutedText>
                <HStack gap="8px" wrap="wrap">
                  <BrandButton
                    loading={advanceStage.isPending}
                    onClick={() =>
                      advanceStage.mutate({
                        id: lead.id,
                        stage: "case_opening",
                      })
                    }
                  >
                    <ExternalLink size={14} />
                    Advance to case opening
                  </BrandButton>
                </HStack>
              </Stack>
            ) : null}
          </Stack>
        </SectionRow>
      ) : (
        <SectionRow>
          <Stack gap="12px">
            <HStack justify="space-between" gap="12px" wrap="wrap">
              <Text m="0" color="fg" fontSize="13px" fontWeight="500">
                Fee agreement
              </Text>
              <StatusPill tone="neutral" icon={<Lock size={11} />}>
                Locked
              </StatusPill>
            </HStack>
            <HStack gap="6px" color="fg.muted" align="flex-start">
              <Info size={12} />
              <MutedText>
                {hasConsultation
                  ? "The fee agreement unlocks once the consultation has been completed."
                  : "The fee agreement unlocks once a consultation has been scheduled and completed."}
              </MutedText>
            </HStack>
            {isCompletable ? (
              <Box>
                <HStack gap="8px" wrap="wrap">
                  <BrandButton
                    disabled={!canComplete}
                    loading={completeMutation.isPending}
                    onClick={handleCompleteConsultation}
                  >
                    <Check size={14} />
                    Mark consultation completed
                  </BrandButton>
                  <OutlineButton
                    disabled={!canComplete}
                    loading={noShowMutation.isPending}
                    onClick={handleNoShow}
                  >
                    <UserX size={14} />
                    Mark no-show
                  </OutlineButton>
                </HStack>
                {!canComplete ? (
                  <Box mt="6px">
                    <MutedText>
                      Available after the scheduled start time (
                      {consultationDate} · {consultationTime}).
                    </MutedText>
                  </Box>
                ) : null}
              </Box>
            ) : null}
          </Stack>
        </SectionRow>
      )}

      {/* 5. Footer — outcomes are recorded against a consultation */}
      {hasConsultation ? (
        <HStack
          justify="space-between"
          gap="12px"
          wrap="wrap"
          mt="16px"
          pt="14px"
          borderTop="1px solid"
          borderColor="border.subtle"
        >
          <HStack gap="8px" color="fg.muted" fontSize="12px">
            <Avatar name={attorneyName} size={28} />
            <Box as="span" fontWeight="500" color="fg">
              {attorneyName}
            </Box>
            <Box as="span">(Assigned)</Box>
          </HStack>
          {alreadySettled ? (
            <MutedText fontSize="12px">
              {consultation?.outcome === "close_no_case"
                ? "Closed — no case opened."
                : "Referred to outside counsel."}
            </MutedText>
          ) : (
            <HStack gap="8px" wrap="wrap" justify="flex-end">
              <OutlineButton
                loading={outcomesMutation.isPending}
                onClick={handleFollowUp}
              >
                <CalendarDays size={14} />
                Schedule follow-up
              </OutlineButton>
              <OutlineButton
                loading={outcomesMutation.isPending}
                onClick={handleCloseNoCase}
              >
                <X size={14} />
                Close — no case
              </OutlineButton>
              <OutlineButton
                loading={outcomesMutation.isPending}
                onClick={handleReferElsewhere}
              >
                <ExternalLink size={14} />
                Refer elsewhere
              </OutlineButton>
            </HStack>
          )}
        </HStack>
      ) : null}

      <QuestionnaireResponseDialog
        responseId={docDialog?.id ?? null}
        initialTab={docDialog?.tab ?? "responses"}
        onClose={() => setDocDialog(null)}
      />
    </SurfaceCard>
  );
}

function SectionRow({ children }: { children: ReactNode }) {
  return (
    <Box mt="16px" pt="14px" borderTop="1px solid" borderColor="border.subtle">
      {children}
    </Box>
  );
}

function SubLabel({ children }: { children: ReactNode }) {
  return (
    <Text
      m="0 0 6px"
      color="fg.muted"
      fontSize="10px"
      fontWeight="600"
      textTransform="uppercase"
    >
      {children}
    </Text>
  );
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const blue = name.charCodeAt(0) % 2 === 0;
  return (
    <Box
      display="grid"
      placeItems="center"
      flex="0 0 auto"
      w={`${size}px`}
      h={`${size}px`}
      borderRadius="full"
      bg={blue ? "#e5efff" : "#d9f8ed"}
      color={blue ? "#1c55b8" : "#00785a"}
      fontSize={size >= 36 ? "12px" : "10px"}
      fontWeight="600"
    >
      {getInitials(name)}
    </Box>
  );
}

function IconSquare({ children }: { children: ReactNode }) {
  return (
    <Box
      display="grid"
      placeItems="center"
      flex="0 0 auto"
      w="34px"
      h="34px"
      borderRadius="9px"
      bg="#d9f8ed"
      color="#00785a"
    >
      {children}
    </Box>
  );
}

function CheckMarker({
  checked,
  tone,
  onClick,
  label,
}: {
  checked: boolean;
  tone: "green" | "gold";
  onClick?: () => void;
  label?: string;
}) {
  const fill = tone === "green" ? "#13b176" : "#e6a52e";
  return (
    <chakra.button
      type="button"
      aria-label={label}
      aria-pressed={onClick ? checked : undefined}
      disabled={!onClick}
      display="grid"
      placeItems="center"
      flex="0 0 auto"
      w="18px"
      h="18px"
      borderRadius="5px"
      border="1px solid"
      borderColor={checked ? fill : "border"}
      bg={checked ? fill : "bg"}
      color="white"
      cursor={onClick ? "pointer" : "default"}
    >
      {checked ? <Check size={12} /> : null}
    </chakra.button>
  );
}

function TextLink({
  children,
  onClick,
  disabled,
  loading,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <chakra.button
      type="button"
      disabled={disabled || loading}
      color="brand.700"
      fontSize="12px"
      fontWeight="500"
      _hover={{ textDecoration: "underline" }}
      _disabled={{ opacity: 0.4, cursor: "default", textDecoration: "none" }}
      onClick={onClick}
    >
      {children}
    </chakra.button>
  );
}

const FEE_STAGES = [
  "Generate",
  "Send",
  "Awaiting signature",
  "Receive",
  "Case opened",
] as const;

function FeeAgreementTracker({ activeIndex }: { activeIndex: number }) {
  return (
    <HStack gap="0" w="full" align="flex-start">
      {FEE_STAGES.map((label, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;
        return (
          <Fragment key={label}>
            {index > 0 ? (
              <Box
                flex="1"
                h="2px"
                mt="11px"
                bg={index <= activeIndex ? "brand.solid" : "border.subtle"}
              />
            ) : null}
            <Stack gap="6px" align="center" flex="0 0 auto" w="72px">
              <Box
                display="grid"
                placeItems="center"
                w="24px"
                h="24px"
                borderRadius="full"
                border="1px solid"
                borderColor={done || active ? "brand.solid" : "border.subtle"}
                bg={done ? "brand.solid" : "bg"}
                color={done ? "brand.fg" : active ? "brand.solid" : "fg.muted"}
                fontSize="11px"
                fontWeight="600"
              >
                {done ? <Check size={13} /> : index + 1}
              </Box>
              <Text
                m="0"
                fontSize="10px"
                textAlign="center"
                lineHeight="1.2"
                color={done || active ? "fg" : "fg.muted"}
              >
                {label}
              </Text>
            </Stack>
          </Fragment>
        );
      })}
    </HStack>
  );
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 KB";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function titleCase(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

const scheduleSchema = z
  .object({
    selectedLeadId: z.string().min(1, "Select a lead"),
    durationChoice: z.union([
      z.literal(30),
      z.literal(45),
      z.literal(60),
      z.literal(90),
      z.literal("custom"),
    ]),
    customDuration: z.string(),
    consultationType: z.enum(["video", "in_person", "phone_call"]),
    attorneyId: z.string().min(1, "Select an attorney"),
    participantIds: z.array(z.string()),
    locationId: z.string(),
    feeAmount: z.string(),
    notes: z.string(),
    notifyEmail: z.boolean(),
    notifySms: z.boolean(),
  })
  .superRefine((val, ctx) => {
    const dur =
      val.durationChoice === "custom"
        ? parseInt(val.customDuration, 10)
        : val.durationChoice;
    if (!dur || dur <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customDuration"],
        message: "Enter a duration in minutes",
      });
    }
    if (val.consultationType === "in_person" && !val.locationId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["locationId"],
        message: "Select a location for in-person consultations",
      });
    }
  });

type ScheduleForm = z.infer<typeof scheduleSchema>;

const SCHEDULE_DEFAULTS: ScheduleForm = {
  selectedLeadId: "",
  durationChoice: 60,
  customDuration: "",
  consultationType: "video",
  attorneyId: "",
  participantIds: [],
  locationId: "",
  feeAmount: "",
  notes: "",
  notifyEmail: true,
  notifySms: false,
};

function ScheduleConsultationDialog({
  open,
  onOpenChange,
  presetLeadId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetLeadId?: string | null;
}) {
  const [step, setStep] = useState<ScheduleStep>(1);
  const {
    control,
    setValue,
    reset,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: SCHEDULE_DEFAULTS,
    mode: "onChange",
  });
  const attorneyId = useWatch({ control, name: "attorneyId" });
  const selectedLeadId = useWatch({ control, name: "selectedLeadId" });
  const customDuration = useWatch({ control, name: "customDuration" });
  const durationChoice = useWatch({ control, name: "durationChoice" });
  const consultationType = useWatch({ control, name: "consultationType" });
  const participantIds = useWatch({ control, name: "participantIds" });
  const locationId = useWatch({ control, name: "locationId" });
  const feeAmount = useWatch({ control, name: "feeAmount" });
  const notes = useWatch({ control, name: "notes" });
  const notifyEmail = useWatch({ control, name: "notifyEmail" });
  const notifySms = useWatch({ control, name: "notifySms" });
  const setField = <K extends keyof ScheduleForm>(
    key: K,
    value: ScheduleForm[K],
  ) => setValue(key, value as never, { shouldValidate: true });

  // Eligible candidates have cleared conflict check — that's everyone in the
  // questionnaire stage (regardless of completion) plus consultation-stage leads
  // who don't yet have a consultation booked.
  const { data: questionnaireData } = useLeads({ stage: "questionnaire" });
  const { data: consultationData } = useLeads({ stage: "consultation" });
  const questionnaireLeads = Array.isArray(questionnaireData)
    ? questionnaireData
    : (questionnaireData?.leads ?? []);
  const consultationLeads = Array.isArray(consultationData)
    ? consultationData
    : (consultationData?.leads ?? []);
  const leads = [
    ...questionnaireLeads,
    ...consultationLeads.filter((l) => !l.consultationId),
  ];

  const { data: staffData } = useStaffList({ status: "active" });
  const allStaff = staffData?.data ?? [];
  const attorneys = allStaff.filter((s) => s.role === "attorney");

  const { data: feeSettings } = useConsultationSettings();
  const { data: locations = [] } = useConsultationLocations();
  const createLocation = useCreateConsultationLocation();

  const initiateConsultation = useInitiateConsultation();

  // Preselect the lead when the dialog is opened from a specific card, and skip
  // straight to step 2 since the lead is already chosen. Done during render
  // (adjust-state-on-prop-change) to avoid an extra effect.
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      reset({ ...SCHEDULE_DEFAULTS, selectedLeadId: presetLeadId ?? "" });
      setStep(presetLeadId ? 2 : 1);
    }
  }

  const selectedLead = leads.find((l) => l.id === selectedLeadId);
  const { data: questionnaire } = useLeadQuestionnaire(selectedLeadId);
  const language = questionnaire?.send?.language ?? "English";
  const matterType = selectedLead?.caseTypeName ?? "Not specified";

  const durationLabel =
    durationChoice === "custom"
      ? customDuration
        ? `${customDuration} minutes`
        : "—"
      : `${durationChoice} minutes`;
  const attorneyName = (() => {
    const a = attorneys.find((s) => s.id === attorneyId);
    return a ? `${a.firstName} ${a.lastName}`.trim() : "Not assigned";
  })();
  const participantNames = participantIds
    .map((id) => {
      const member = allStaff.find((m) => m.id === id);
      return member ? `${member.firstName} ${member.lastName}`.trim() : null;
    })
    .filter(Boolean)
    .join(", ");
  const locationLabel =
    locations.find((l) => l.id === locationId)?.label ?? "—";
  const notifyChannels: ("email" | "sms")[] = [
    ...(notifyEmail ? (["email"] as const) : []),
    ...(notifySms ? (["sms"] as const) : []),
  ];

  function closeDialog() {
    onOpenChange(false);
    reset(SCHEDULE_DEFAULTS);
    setStep(1);
  }

  async function handleContinue() {
    if (step === 1) {
      if (await trigger(["selectedLeadId"])) setStep(2);
      return;
    }
    if (step === 2) {
      if (await trigger(["customDuration", "attorneyId", "locationId"]))
        setStep(3);
    }
  }

  const chargesCustomFee =
    Boolean(feeSettings?.chargesFee) &&
    feeSettings?.feeStructure === "custom_per_case_type";

  const onValid = (data: ScheduleForm) => {
    const duration =
      data.durationChoice === "custom"
        ? parseInt(data.customDuration, 10)
        : data.durationChoice;

    if (chargesCustomFee && !data.feeAmount.trim()) {
      toast.error("Enter the consultation fee for this case type");
      setStep(3);
      return;
    }

    initiateConsultation.mutate(
      {
        id: data.selectedLeadId,
        data: {
          leadAttorneyId: data.attorneyId,
          participantStaffIds: data.participantIds.length
            ? data.participantIds
            : undefined,
          mode: data.consultationType,
          duration,
          locationId:
            data.consultationType === "in_person"
              ? data.locationId || undefined
              : undefined,
          feeAmount: chargesCustomFee ? Number(data.feeAmount) : undefined,
          preConsultationNotes: data.notes || undefined,
          notifyChannels: [
            ...(data.notifyEmail ? (["email"] as const) : []),
            ...(data.notifySms ? (["sms"] as const) : []),
          ],
        },
      },
      { onSuccess: () => closeDialog() },
    );
  };

  const onInvalid = () => {
    // Jump back to the step that holds the first error.
    if (errors.selectedLeadId) setStep(1);
    else if (errors.customDuration || errors.attorneyId || errors.locationId)
      setStep(2);
  };

  const handleConfirm = handleSubmit(onValid, onInvalid);

  return (
    <Dialog.Root
      open={open}
      lazyMount
      unmountOnExit
      onOpenChange={(details) => {
        if (details.open) {
          onOpenChange(true);
        } else {
          closeDialog();
        }
      }}
      placement="center"
    >
      <Dialog.Backdrop bg="rgba(0, 0, 0, 0.46)" />
      <Dialog.Positioner px="16px">
        <Dialog.Content
          w="full"
          maxW="560px"
          maxH="calc(100vh - 72px)"
          border="1px solid"
          borderColor="border"
          borderRadius="14px"
          bg="bg"
          p="0"
          boxShadow="0 24px 70px rgba(0, 0, 0, 0.26)"
        >
          <Flex direction="column" maxH="calc(100vh - 72px)">
            <Box p="24px 24px 12px">
              <Flex align="flex-start" justify="space-between" gap="16px">
                <Box minW="0">
                  <Dialog.Title
                    color="fg"
                    fontSize="17px"
                    fontWeight="600"
                    lineHeight="1.2"
                  >
                    {STEP_META[step].title}
                  </Dialog.Title>
                  <Dialog.Description
                    mt="6px"
                    color="fg.muted"
                    fontSize="12px"
                    lineHeight="1.45"
                  >
                    {STEP_META[step].label}
                  </Dialog.Description>
                </Box>
                <Dialog.CloseTrigger asChild>
                  <chakra.button
                    type="button"
                    aria-label="Close schedule consultation"
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

              <StepProgress step={step} />
            </Box>

            <Box flex="1" minH="0" px="24px" pb="20px">
              {step === 1 ? (
                <SelectClientStep
                  leads={leads}
                  selectedLeadId={selectedLeadId}
                  matterType={matterType}
                  language={language}
                  touched={Boolean(errors.selectedLeadId)}
                  onSelect={(leadId) => setField("selectedLeadId", leadId)}
                />
              ) : null}
              {step === 2 ? (
                <ScheduleDetailsStep
                  durationChoice={durationChoice}
                  customDuration={customDuration}
                  consultationType={consultationType}
                  attorneyId={attorneyId}
                  attorneys={attorneys}
                  allStaff={allStaff}
                  participantIds={participantIds}
                  locationId={locationId}
                  locations={locations}
                  notes={notes}
                  notifyEmail={notifyEmail}
                  touchedField={
                    errors.customDuration
                      ? "duration"
                      : errors.attorneyId
                        ? "attorney"
                        : errors.locationId
                          ? "location"
                          : null
                  }
                  onDurationChoiceChange={(value) =>
                    setField("durationChoice", value)
                  }
                  onCustomDurationChange={(value) =>
                    setField("customDuration", value)
                  }
                  onConsultationTypeChange={(value) =>
                    setField("consultationType", value)
                  }
                  onAttorneyChange={(value) => setField("attorneyId", value)}
                  onParticipantsChange={(value) =>
                    setField("participantIds", value)
                  }
                  onLocationChange={(value) => setField("locationId", value)}
                  onCreateLocation={async (label) => {
                    const created = await createLocation.mutateAsync({ label });
                    setField("locationId", created.id);
                  }}
                  creatingLocation={createLocation.isPending}
                  onNotesChange={(value) => setField("notes", value)}
                  onNotifyEmailChange={(value) =>
                    setField("notifyEmail", value)
                  }
                />
              ) : null}
              {step === 3 && selectedLead ? (
                <ReviewStep
                  lead={selectedLead}
                  duration={durationLabel}
                  consultationType={consultationModeLabel(consultationType)}
                  attorney={attorneyName}
                  participantNames={participantNames}
                  mode={consultationType}
                  locationLabel={locationLabel}
                  notifyChannels={notifyChannels}
                  notes={notes}
                  feeSettings={feeSettings ?? null}
                  feeAmount={feeAmount}
                  onFeeAmountChange={(value) => setField("feeAmount", value)}
                />
              ) : null}
            </Box>

            <Flex
              align="center"
              justify="space-between"
              gap="12px"
              p="14px 24px"
              borderTop="1px solid"
              borderColor="border.subtle"
              borderBottomRadius="14px"
              bg="bg"
            >
              {step > 1 ? (
                <OutlineButton
                  onClick={() => setStep((s) => (s - 1) as ScheduleStep)}
                >
                  Back
                </OutlineButton>
              ) : (
                <Box />
              )}
              <HStack gap="10px">
                <OutlineButton onClick={closeDialog}>Cancel</OutlineButton>
                {step < 3 ? (
                  <BrandButton minW="100px" onClick={handleContinue}>
                    Next
                  </BrandButton>
                ) : (
                  <BrandButton
                    minW="180px"
                    loading={initiateConsultation.isPending}
                    onClick={handleConfirm}
                  >
                    Confirm &amp; schedule
                  </BrandButton>
                )}
              </HStack>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

function StepProgress({ step }: { step: ScheduleStep }) {
  return (
    <Box
      mt="14px"
      h="3px"
      borderRadius="999px"
      bg="border.subtle"
      overflow="hidden"
    >
      <Box
        h="full"
        bg="brand.solid"
        w={`${(step / 3) * 100}%`}
        transition="width 0.2s ease"
      />
    </Box>
  );
}

function SelectClientStep({
  leads,
  selectedLeadId,
  matterType,
  language,
  touched,
  onSelect,
}: {
  leads: Lead[];
  selectedLeadId: string;
  matterType: string;
  language: string;
  touched: boolean;
  onSelect: (leadId: string) => void;
}) {
  return (
    <Stack gap="14px" pt="8px">
      <HStack
        align="flex-start"
        gap="10px"
        p="12px"
        border="1px solid"
        borderColor="#7c3cff"
        borderRadius="7px"
        bg="#f4ebff"
        color="#4b00b8"
        fontSize="11px"
        lineHeight="1.4"
      >
        <Info size={13} />
        <Box>
          Leads who have cleared conflict check are shown — including those
          still completing the questionnaire. A consultation can be booked
          before the questionnaire is finished.
        </Box>
      </HStack>

      <Box>
        <Text m="0 0 8px" color="fg" fontSize="12px" fontWeight="500">
          Select lead
        </Text>
        {leads.length === 0 ? (
          <MutedText>No leads are ready for a consultation.</MutedText>
        ) : (
          <SearchableSelect
            ariaLabel="Select lead"
            value={selectedLeadId}
            onChange={onSelect}
            invalid={touched}
            placeholder="— Select a conflict-cleared lead —"
            searchPlaceholder="Search by name or email…"
            emptyText="No leads match your search"
            options={leads.map((lead) => ({
              value: lead.id,
              label: lead.name,
              sublabel: lead.email,
            }))}
          />
        )}
      </Box>

      {selectedLeadId ? (
        <Grid
          templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }}
          gap="10px"
        >
          <ReadOnlyField label="Matter type">{matterType}</ReadOnlyField>
          <ReadOnlyField label="Language">{language}</ReadOnlyField>
        </Grid>
      ) : null}
    </Stack>
  );
}

function StepFieldLabel({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <Text m="0 0 8px" color="fg" fontSize="13px" fontWeight="600">
      {children}
      {required ? <chakra.span color="#d14343"> *</chakra.span> : null}
    </Text>
  );
}

function CheckOption({
  checked,
  disabled,
  label,
  onToggle,
}: {
  checked: boolean;
  disabled?: boolean;
  label: ReactNode;
  onToggle: () => void;
}) {
  return (
    <chakra.button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      display="flex"
      alignItems="center"
      gap="8px"
      opacity={disabled ? 0.5 : 1}
      cursor={disabled ? "not-allowed" : "pointer"}
    >
      <Box
        w="16px"
        h="16px"
        borderRadius="4px"
        border="1px solid"
        borderColor={checked ? "brand.solid" : "border"}
        bg={checked ? "brand.solid" : "bg"}
        color="brand.fg"
        display="grid"
        placeItems="center"
      >
        {checked ? <Check size={12} /> : null}
      </Box>
      <Text m="0" fontSize="13px" color="fg">
        {label}
      </Text>
    </chakra.button>
  );
}

// Note shown in place of mode-specific fields that our backend handles
// automatically (video Meet link, phone number).
function ModeNote({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <HStack
      gap="8px"
      p="10px 12px"
      border="1px solid"
      borderColor="border"
      borderRadius="8px"
      bg="bg.subtle"
      color="fg.muted"
      fontSize="12px"
      lineHeight="1.4"
    >
      {icon}
      <Text m="0">{children}</Text>
    </HStack>
  );
}

function ScheduleDetailsStep({
  durationChoice,
  customDuration,
  consultationType,
  attorneyId,
  attorneys,
  allStaff,
  participantIds,
  locationId,
  locations,
  notes,
  notifyEmail,
  touchedField,
  onDurationChoiceChange,
  onCustomDurationChange,
  onConsultationTypeChange,
  onAttorneyChange,
  onParticipantsChange,
  onLocationChange,
  onCreateLocation,
  creatingLocation,
  onNotesChange,
  onNotifyEmailChange,
}: {
  durationChoice: DurationChoice;
  customDuration: string;
  consultationType: ConsultationMode;
  attorneyId: string;
  attorneys: StaffMemberDTO[];
  allStaff: StaffMemberDTO[];
  participantIds: string[];
  locationId: string;
  locations: ConsultationLocation[];
  notes: string;
  notifyEmail: boolean;
  touchedField: "duration" | "attorney" | "location" | null;
  onDurationChoiceChange: (value: DurationChoice) => void;
  onCustomDurationChange: (value: string) => void;
  onConsultationTypeChange: (value: ConsultationMode) => void;
  onAttorneyChange: (value: string) => void;
  onParticipantsChange: (value: string[]) => void;
  onLocationChange: (value: string) => void;
  onCreateLocation: (label: string) => void;
  creatingLocation: boolean;
  onNotesChange: (value: string) => void;
  onNotifyEmailChange: (value: boolean) => void;
}) {
  const [addingLocation, setAddingLocation] = useState(false);
  const [newLocationLabel, setNewLocationLabel] = useState("");
  const [attendeeQuery, setAttendeeQuery] = useState("");

  const participantOptions = allStaff.filter(
    (s) => s.id !== attorneyId && (s.role === "attorney" || s.role === "paralegal"),
  );
  const addedParticipants = participantOptions.filter((s) =>
    participantIds.includes(s.id),
  );
  const attendeeMatches = attendeeQuery.trim()
    ? participantOptions.filter(
        (s) =>
          !participantIds.includes(s.id) &&
          `${s.firstName} ${s.lastName}`
            .toLowerCase()
            .includes(attendeeQuery.toLowerCase()),
      )
    : [];

  const addParticipant = (id: string) => {
    onParticipantsChange([...participantIds, id]);
    setAttendeeQuery("");
  };
  const removeParticipant = (id: string) =>
    onParticipantsChange(participantIds.filter((p) => p !== id));

  return (
    <Stack gap="16px" pt="12px">
      {/* Consultation type */}
      <Box>
        <StepFieldLabel required>Consultation type</StepFieldLabel>
        <HStack gap="8px" wrap="wrap">
          {CONSULTATION_TYPE_OPTIONS.map((option) => {
            const active = consultationType === option.value;
            return (
              <chakra.button
                key={option.value}
                type="button"
                onClick={() => onConsultationTypeChange(option.value)}
                px="16px"
                h="36px"
                borderRadius="999px"
                border="1px solid"
                fontSize="13px"
                fontWeight="500"
                bg={active ? "brand.subtle" : "bg"}
                color={active ? "brand.fg" : "fg.muted"}
                borderColor={active ? "brand.solid" : "border"}
              >
                {option.label}
              </chakra.button>
            );
          })}
        </HStack>
      </Box>

      {/* Mode-specific */}
      {consultationType === "video" ? (
        <Box>
          <StepFieldLabel>Video call link</StepFieldLabel>
          <ModeNote icon={<Video size={14} />}>
            A Google Meet link is generated automatically once the lead picks a
            time.
          </ModeNote>
        </Box>
      ) : consultationType === "phone_call" ? (
        <Box>
          <StepFieldLabel>Phone call</StepFieldLabel>
          <ModeNote icon={<Phone size={14} />}>
            The lead attorney's phone number will be used for this call.
          </ModeNote>
        </Box>
      ) : (
        <Box>
          <StepFieldLabel required>Office location</StepFieldLabel>
          {addingLocation ? (
            <Stack gap="8px">
              <Input
                value={newLocationLabel}
                onChange={(e) => setNewLocationLabel(e.currentTarget.value)}
                placeholder="Location name / address"
                {...fieldStyles}
              />
              <HStack gap="8px">
                <BrandButton
                  disabled={!newLocationLabel.trim() || creatingLocation}
                  onClick={() => {
                    onCreateLocation(newLocationLabel.trim());
                    setNewLocationLabel("");
                    setAddingLocation(false);
                  }}
                >
                  {creatingLocation ? "Saving…" : "Save location"}
                </BrandButton>
                <OutlineButton onClick={() => setAddingLocation(false)}>
                  Cancel
                </OutlineButton>
              </HStack>
            </Stack>
          ) : (
            <Stack gap="6px">
              <FormSelect
                ariaLabel="Office location"
                value={locationId}
                onChange={onLocationChange}
                invalid={touchedField === "location"}
                placeholder="Select office location"
                options={locations.map((loc) => ({
                  value: loc.id,
                  label: loc.label,
                }))}
              />
              <chakra.button
                type="button"
                onClick={() => setAddingLocation(true)}
                color="brand.fg"
                fontSize="12px"
                fontWeight="500"
                textAlign="left"
                w="fit-content"
              >
                + Add new location
              </chakra.button>
            </Stack>
          )}
        </Box>
      )}

      {/* Available time slots — lead-driven (matches "Let client choose" on) */}
      <Box>
        <Flex align="center" justify="space-between" mb="8px">
          <StepFieldLabel required>Available time slots</StepFieldLabel>
          <HStack gap="8px">
            <Text fontSize="12px" color="fg.muted">
              Let client choose
            </Text>
            <Switch.Root checked disabled>
              <Switch.HiddenInput />
              <Switch.Control bg="brand.solid">
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </HStack>
        </Flex>
        <ModeNote icon={<CalendarClock size={14} />}>
          The lead chooses a time from the selected attorney's availability —
          they'll receive a link to pick the slot that works for them.
        </ModeNote>
        <Box mt="12px">
          <StepFieldLabel>Consultation length</StepFieldLabel>
          <HStack gap="8px" wrap="wrap">
            {DURATION_PRESETS.map((preset) => (
              <ChoiceChip
                key={preset}
                active={durationChoice === preset}
                onClick={() => onDurationChoiceChange(preset)}
              >
                {preset} min
              </ChoiceChip>
            ))}
            <ChoiceChip
              active={durationChoice === "custom"}
              onClick={() => onDurationChoiceChange("custom")}
            >
              Custom
            </ChoiceChip>
          </HStack>
          {durationChoice === "custom" ? (
            <Input
              type="number"
              min={1}
              value={customDuration}
              onChange={(event) =>
                onCustomDurationChange(event.currentTarget.value)
              }
              placeholder="Minutes"
              mt="8px"
              {...fieldStyles}
              borderColor={touchedField === "duration" ? invalidColor : "border"}
            />
          ) : null}
        </Box>
      </Box>

      {/* Assigned attorney */}
      <Box>
        <StepFieldLabel required>Assigned attorney</StepFieldLabel>
        <FormSelect
          ariaLabel="Assigned attorney"
          value={attorneyId}
          onChange={onAttorneyChange}
          invalid={touchedField === "attorney"}
          placeholder="Select attorney"
          options={attorneys.map((attorney) => ({
            value: attorney.id,
            label: `${attorney.firstName} ${attorney.lastName}`.trim(),
          }))}
        />
      </Box>

      {/* Additional attendees — search to add */}
      <Box>
        <StepFieldLabel>
          Additional attendees{" "}
          <chakra.span color="fg.muted" fontWeight="400">
            (optional)
          </chakra.span>
        </StepFieldLabel>
        <Text m="0 0 8px" fontSize="12px" color="fg.muted">
          Add paralegals or staff who need to attend.
        </Text>
        {addedParticipants.length > 0 ? (
          <HStack gap="6px" wrap="wrap" mb="8px">
            {addedParticipants.map((member) => (
              <HStack
                key={member.id}
                gap="6px"
                px="10px"
                h="28px"
                borderRadius="999px"
                bg="bg.subtle"
                border="1px solid"
                borderColor="border"
                fontSize="12px"
              >
                <Text m="0">
                  {`${member.firstName} ${member.lastName}`.trim()}
                </Text>
                <chakra.button
                  type="button"
                  onClick={() => removeParticipant(member.id)}
                  color="fg.muted"
                  aria-label="Remove attendee"
                  display="grid"
                  placeItems="center"
                >
                  <X size={12} />
                </chakra.button>
              </HStack>
            ))}
          </HStack>
        ) : null}
        <Box position="relative">
          <Input
            value={attendeeQuery}
            onChange={(e) => setAttendeeQuery(e.currentTarget.value)}
            placeholder="Search staff to add…"
            {...fieldStyles}
          />
          {attendeeMatches.length > 0 ? (
            <Stack
              gap="0"
              position="absolute"
              zIndex={10}
              top="calc(100% + 4px)"
              left="0"
              right="0"
              bg="bg"
              border="1px solid"
              borderColor="border"
              borderRadius="8px"
              boxShadow="0 8px 24px rgba(0, 0, 0, 0.12)"
              maxH="184px"
              overflowY="auto"
              p="4px"
            >
              {attendeeMatches.map((member) => (
                <chakra.button
                  key={member.id}
                  type="button"
                  onClick={() => addParticipant(member.id)}
                  textAlign="left"
                  px="10px"
                  py="8px"
                  borderRadius="6px"
                  fontSize="13px"
                  _hover={{ bg: "bg.subtle" }}
                >
                  {`${member.firstName} ${member.lastName}`.trim()}
                  {member.role ? (
                    <chakra.span color="fg.muted"> · {member.role}</chakra.span>
                  ) : null}
                </chakra.button>
              ))}
            </Stack>
          ) : null}
        </Box>
      </Box>

      {/* Pre-consultation notes */}
      <Box>
        <StepFieldLabel>
          Pre-consultation notes{" "}
          <chakra.span color="fg.muted" fontWeight="400">
            (optional — attorney only)
          </chakra.span>
        </StepFieldLabel>
        <Textarea
          value={notes}
          onChange={(event) => onNotesChange(event.currentTarget.value)}
          minH="92px"
          resize="vertical"
          placeholder="Add any notes for the attorney before the consultation."
          {...fieldStyles}
          h="auto"
          py="10px"
        />
      </Box>

      {/* Notify */}
      <Box>
        <StepFieldLabel>Notify client via</StepFieldLabel>
        <HStack gap="24px">
          <CheckOption
            checked={notifyEmail}
            label="Email"
            onToggle={() => onNotifyEmailChange(!notifyEmail)}
          />
          <CheckOption
            checked={false}
            disabled
            onToggle={() => undefined}
            label={
              <>
                SMS{" "}
                <chakra.span color="fg.subtle">(coming soon)</chakra.span>
              </>
            }
          />
        </HStack>
      </Box>
    </Stack>
  );
}

function ReviewStep({
  lead,
  duration,
  consultationType,
  mode,
  attorney,
  participantNames,
  locationLabel,
  notifyChannels,
  notes,
  feeSettings,
  feeAmount,
  onFeeAmountChange,
}: {
  lead: Lead;
  duration: string;
  consultationType: string;
  mode: ConsultationMode;
  attorney: string;
  participantNames: string;
  locationLabel: string;
  notifyChannels: ("email" | "sms")[];
  notes: string;
  feeSettings: ConsultationSettings | null;
  feeAmount: string;
  onFeeAmountChange: (value: string) => void;
}) {
  const notifyLabel =
    notifyChannels.length === 0
      ? "No notification"
      : notifyChannels.map((c) => (c === "email" ? "Email" : "SMS")).join(", ");

  const charges = Boolean(feeSettings?.chargesFee);
  const structure = feeSettings?.feeStructure;

  return (
    <Stack gap="16px" pt="12px">
      <Text m="0" fontSize="14px" fontWeight="600" color="fg">
        Review consultation details
      </Text>

      <Box p="14px 16px" borderRadius="10px" bg="bg.subtle">
        <SummaryItem label="Lead">{lead.name}</SummaryItem>
        <SummaryItem label="Consultation type">{consultationType}</SummaryItem>
        {mode === "in_person" ? (
          <SummaryItem label="Location">{locationLabel}</SummaryItem>
        ) : null}
        <SummaryItem label="Duration">{duration}</SummaryItem>
        <SummaryItem label="Attorney">{attorney}</SummaryItem>
        {participantNames ? (
          <SummaryItem label="Additional attendees">
            {participantNames}
          </SummaryItem>
        ) : null}
        <SummaryItem label="Notification">{notifyLabel}</SummaryItem>
        {notes ? <SummaryItem label="Notes">{notes}</SummaryItem> : null}
      </Box>

      <Box borderTop="1px solid" borderColor="border.subtle" />

      <Box>
        <Text
          textTransform="uppercase"
          fontSize="11px"
          fontWeight="600"
          letterSpacing="0.04em"
          color="fg.muted"
          mb="12px"
        >
          Consultation fee
        </Text>

        <Flex align="flex-start" justify="space-between" gap="12px">
          <Box>
            <Text m="0" fontSize="13px" fontWeight="600" color="fg">
              Charge consultation fee
            </Text>
            <Text m="2px 0 0" fontSize="12px" color="fg.muted">
              Default set in firm settings
            </Text>
          </Box>
          <Switch.Root checked={charges} disabled>
            <Switch.HiddenInput />
            <Switch.Control bg={charges ? "brand.solid" : "bg.muted"}>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
        </Flex>

        {charges ? (
          <>
            <Flex align="center" justify="space-between" mt="16px">
              <Text fontSize="13px" color="fg">
                Fee amount
              </Text>
              <HStack gap="6px">
                <Text fontSize="14px" color="fg.muted">
                  $
                </Text>
                {structure === "custom_per_case_type" ? (
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={feeAmount}
                    onChange={(e) => onFeeAmountChange(e.currentTarget.value)}
                    placeholder={feeSettings?.defaultAmount?.toString() ?? "0.00"}
                    maxW="96px"
                    textAlign="right"
                    {...fieldStyles}
                  />
                ) : (
                  <Text fontSize="14px" fontWeight="600" color="fg">
                    {feeSettings?.defaultAmount ?? 0}
                  </Text>
                )}
                <Text fontSize="12px" color="fg.muted">
                  per session
                </Text>
              </HStack>
            </Flex>

            {structure === "waived_if_retainer" ? (
              <MutedText>
                Waived if the client signs a retainer within{" "}
                {feeSettings?.waiverWindowDays ?? 0} days.
              </MutedText>
            ) : null}

            <HStack
              mt="14px"
              align="flex-start"
              gap="10px"
              p="12px"
              border="1px solid"
              borderColor="#377dff"
              borderRadius="8px"
              bg="#e8f1ff"
              color="#0f4aa8"
              fontSize="12px"
              lineHeight="1.45"
            >
              <Info size={14} />
              <Text m="0">
                A payment link will be included in the client confirmation email.
                Payment goes to the firm's operating account.
              </Text>
            </HStack>
          </>
        ) : null}
      </Box>
    </Stack>
  );
}

function ChoiceChip({
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
      minH="32px"
      px="14px"
      border="1px solid"
      borderColor={active ? "brand.solid" : "border"}
      borderRadius="8px"
      bg={active ? "brand.solid" : "bg"}
      color={active ? "brand.fg" : "fg.muted"}
      fontSize="12px"
      fontWeight="500"
      onClick={onClick}
    >
      {children}
    </chakra.button>
  );
}

function ReadOnlyField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <Text
        m="0 0 5px"
        color="fg.muted"
        fontSize="10px"
        fontWeight="600"
        textTransform="uppercase"
      >
        {label}
      </Text>
      <Box
        minH="28px"
        px="10px"
        py="7px"
        borderRadius="6px"
        bg="bg.subtle"
        color="fg.muted"
        fontSize="12px"
        lineHeight="1.1"
      >
        {children}
      </Box>
    </Box>
  );
}

function SummaryItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Box
      py="7px"
      borderBottom="1px solid"
      borderColor="border.subtle"
      _last={{ borderBottom: 0 }}
    >
      <Text
        m="0 0 4px"
        color="fg.muted"
        fontSize="10px"
        fontWeight="600"
        textTransform="uppercase"
      >
        {label}
      </Text>
      <Text m="0" color="fg" fontSize="13px" lineHeight="1.2">
        {children}
      </Text>
    </Box>
  );
}

const invalidColor = "#ff2d55";

const fieldStyles = {
  w: "full",
  h: "36px",
  px: "12px",
  border: "1px solid",
  borderColor: "border",
  borderRadius: "7px",
  bg: "bg",
  color: "fg",
  fontSize: "13px",
  _placeholder: { color: "fg.muted" },
  _focus: {
    borderColor: "brand.solid",
    boxShadow: "0 0 0 1px var(--brand-cta)",
  },
};
