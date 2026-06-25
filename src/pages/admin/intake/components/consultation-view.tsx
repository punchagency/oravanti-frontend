import {
  Box,
  Dialog,
  Flex,
  Grid,
  HStack,
  Input,
  Stack,
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
  Info,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Scale,
  Send,
  UserX,
  Video,
  X,
} from "lucide-react";
import type { ChangeEvent, ReactNode } from "react";
import { Fragment, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Lead } from "@/api/leads";
import { formatReceivedDate } from "@/api/leads";
import { downloadResponseFile } from "@/api/questionnaires";
import { useCanDownloadDocuments } from "@/hooks/use-can-download-documents";
import {
  useAdvanceLeadStage,
  useCreateConsultation,
  useGenerateFeeAgreement,
  useLeadById,
  useLeads,
  useNudgeClient,
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
  BrandButton,
  CardTitle,
  IntakeListSkeleton,
  MutedText,
  OutlineButton,
  StatusPill,
  SurfaceCard,
} from "../../../../components/ui/intake-ui";
import { QuestionnaireResponseDialog } from "./questionnaire-response-dialog";
import { NotifyChip } from "@/components/ui/notify-chip";

type ScheduleStep = 1 | 2 | 3;
type ConsultationMode = "video" | "in_person" | "phone_call";

const CONSULTATION_TYPE_OPTIONS: { value: ConsultationMode; label: string }[] =
  [
    { value: "video", label: "Video call" },
    { value: "phone_call", label: "Phone call" },
    { value: "in_person", label: "In person" },
  ];

const DURATION_PRESETS = [30, 45, 60, 90] as const;

function consultationModeLabel(mode: ConsultationMode): string {
  return (
    CONSULTATION_TYPE_OPTIONS.find((o) => o.value === mode)?.label ??
    "Video call"
  );
}

// time is a 24h "HH:MM" value from a native time input.
function buildScheduledAt(date: string, time: string): string {
  return `${date}T${time || "09:00"}:00`;
}

// Local "YYYY-MM-DD" for today — used to block scheduling in the past.
function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function formatTimeLabel(time: string): string {
  if (!time) return "—";
  const [hourStr, minStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  if (Number.isNaN(hour)) return time;
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minStr} ${period}`;
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
  const feeStatus: { label: string; tone: "success" | "warning" | "neutral" } =
    caseOpened
      ? { label: "Signed & received", tone: "success" }
      : feeAgreement?.status === "signed"
        ? { label: "Signed", tone: "success" }
        : feeAgreement?.status === "pending_signature"
          ? { label: "Awaiting signature", tone: "warning" }
          : feeAgreement?.status === "draft"
            ? { label: "Draft", tone: "neutral" }
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
                          {file.originalFilename} · {formatBytes(file.fileSize)}
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
                            isUploading ? undefined : () => handlePickDocument(q.id)
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
                      <StatusPill tone={isUploading ? "neutral" : "warning"}>
                        {isUploading ? "Uploading…" : "Pending"}
                      </StatusPill>
                    </HStack>
                  );
                })}
              </Stack>
              <HStack gap="6px" mt="8px" color="fg.muted">
                <Info size={12} />
                <MutedText>
                  Click the box next to a document to upload one received outside
                  the client portal (e.g. in-person, by email, or via scan).
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
                    {issueCount} issue{issueCount === 1 ? "" : "s"} detected —
                    review required
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
            ) : (
              <HStack gap="8px" wrap="wrap">
                {!feeAgreement ? (
                  <BrandButton
                    loading={generateFee.isPending}
                    onClick={() =>
                      generateFee.mutate({
                        id: lead.id,
                        data: { agreementType: "retainer" },
                      })
                    }
                  >
                    <Send size={14} />
                    Generate the agreement
                  </BrandButton>
                ) : null}
                {feeAgreement?.status === "pending_signature" ? (
                  <OutlineButton
                    loading={nudgeClient.isPending}
                    onClick={() => nudgeClient.mutate(feeAgreement.id)}
                  >
                    <Mail size={14} />
                    Nudge client
                  </OutlineButton>
                ) : null}
                {feeAgreement?.status === "signed" ? (
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
                ) : null}
              </HStack>
            )}
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
        const filled = index <= activeIndex;
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
                borderColor={filled ? "brand.solid" : "border.subtle"}
                bg={filled ? "brand.solid" : "bg.subtle"}
                color={filled ? "brand.fg" : "fg.muted"}
              >
                {filled ? <Check size={13} /> : null}
              </Box>
              <Text
                m="0"
                fontSize="10px"
                textAlign="center"
                lineHeight="1.2"
                color={filled ? "fg" : "fg.muted"}
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
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [durationChoice, setDurationChoice] = useState<number | "custom">(60);
  const [customDuration, setCustomDuration] = useState("");
  const [consultationType, setConsultationType] =
    useState<ConsultationMode>("video");
  const [attorneyId, setAttorneyId] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [notes, setNotes] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [touchedField, setTouchedField] = useState<
    "client" | "date" | "duration" | "attorney" | null
  >(null);

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

  const { data: staffData } = useStaffList({
    role: "attorney",
    status: "active",
  });
  const attorneys = staffData?.data ?? [];

  const createConsultation = useCreateConsultation();

  // Preselect the lead when the dialog is opened from a specific card, and skip
  // straight to step 2 since the lead is already chosen. Done during render
  // (adjust-state-on-prop-change) to avoid an extra effect.
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSelectedLeadId(presetLeadId ?? "");
      setStep(presetLeadId ? 2 : 1);
    }
  }

  const selectedLead = leads.find((l) => l.id === selectedLeadId);
  const { data: questionnaire } = useLeadQuestionnaire(selectedLeadId);
  const language = questionnaire?.send?.language ?? "English";
  const matterType = selectedLead?.caseTypeName ?? "Not specified";

  const resolvedDuration =
    durationChoice === "custom" ? parseInt(customDuration, 10) : durationChoice;
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
  const notifyChannels: ("email" | "sms")[] = [
    ...(notifyEmail ? (["email"] as const) : []),
    ...(notifySms ? (["sms"] as const) : []),
  ];

  function resetDialog() {
    setStep(1);
    setSelectedLeadId("");
    setDate("");
    setStartTime("09:00");
    setDurationChoice(60);
    setCustomDuration("");
    setConsultationType("video");
    setAttorneyId("");
    setVideoLink("");
    setNotes("");
    setNotifyEmail(true);
    setNotifySms(false);
    setTouchedField(null);
  }

  function closeDialog() {
    onOpenChange(false);
    resetDialog();
  }

  function handleContinue() {
    if (step === 1) {
      if (!selectedLeadId) {
        setTouchedField("client");
        return;
      }
      setTouchedField(null);
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!date) {
        setTouchedField("date");
        return;
      }
      if (date < getTodayDate()) {
        setTouchedField("date");
        toast.error("Consultation date cannot be in the past");
        return;
      }
      if (!resolvedDuration || resolvedDuration <= 0) {
        setTouchedField("duration");
        return;
      }
      if (!attorneyId) {
        setTouchedField("attorney");
        return;
      }
      setTouchedField(null);
      setStep(3);
    }
  }

  function handleConfirm() {
    if (!selectedLeadId || !resolvedDuration || resolvedDuration <= 0) return;
    if (!date || date < getTodayDate()) {
      setStep(2);
      setTouchedField("date");
      toast.error("Consultation date cannot be in the past");
      return;
    }
    createConsultation.mutate(
      {
        id: selectedLeadId,
        data: {
          scheduledAt: buildScheduledAt(date, startTime),
          duration: resolvedDuration,
          mode: consultationType,
          leadAttorneyId: attorneyId || undefined,
          videoLink: videoLink || undefined,
          preConsultationNotes: notes || undefined,
          notifyChannels,
        },
      },
      { onSuccess: () => closeDialog() },
    );
  }

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
          overflow="hidden"
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
                    Schedule consultation
                  </Dialog.Title>
                  <Dialog.Description
                    mt="8px"
                    color="fg.muted"
                    fontSize="12px"
                    lineHeight="1.45"
                  >
                    Schedule a consultation with a lead who has cleared conflict
                    check.
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

            <Box flex="1" minH="0" overflowY="auto" px="24px" pb="20px">
              {step === 1 ? (
                <SelectClientStep
                  leads={leads}
                  selectedLeadId={selectedLeadId}
                  matterType={matterType}
                  language={language}
                  touched={touchedField === "client"}
                  onSelect={(leadId) => {
                    setSelectedLeadId(leadId);
                    setTouchedField(null);
                  }}
                />
              ) : null}
              {step === 2 ? (
                <ScheduleDetailsStep
                  date={date}
                  startTime={startTime}
                  durationChoice={durationChoice}
                  customDuration={customDuration}
                  consultationType={consultationType}
                  attorneyId={attorneyId}
                  attorneys={attorneys}
                  videoLink={videoLink}
                  notes={notes}
                  notifyEmail={notifyEmail}
                  notifySms={notifySms}
                  touchedField={touchedField}
                  onDateChange={(value) => {
                    setDate(value);
                    if (value) setTouchedField(null);
                  }}
                  onStartTimeChange={setStartTime}
                  onDurationChoiceChange={(value) => {
                    setDurationChoice(value);
                    setTouchedField(null);
                  }}
                  onCustomDurationChange={(value) => {
                    setCustomDuration(value);
                    if (value) setTouchedField(null);
                  }}
                  onConsultationTypeChange={setConsultationType}
                  onAttorneyChange={(value) => {
                    setAttorneyId(value);
                    if (value) setTouchedField(null);
                  }}
                  onVideoLinkChange={setVideoLink}
                  onNotesChange={setNotes}
                  onNotifyEmailChange={setNotifyEmail}
                  onNotifySmsChange={setNotifySms}
                />
              ) : null}
              {step === 3 && selectedLead ? (
                <ReviewStep
                  lead={selectedLead}
                  matterType={matterType}
                  language={language}
                  date={date || "—"}
                  startTime={formatTimeLabel(startTime)}
                  duration={durationLabel}
                  consultationType={consultationModeLabel(consultationType)}
                  attorney={attorneyName}
                  notifyChannels={notifyChannels}
                  videoLink={videoLink}
                  notes={notes}
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
              {step < 3 ? (
                <BrandButton minW="116px" onClick={handleContinue}>
                  Continue
                  <Send size={14} />
                </BrandButton>
              ) : (
                <BrandButton
                  minW="180px"
                  loading={createConsultation.isPending}
                  onClick={handleConfirm}
                >
                  <CalendarDays size={14} />
                  Confirm & schedule
                </BrandButton>
              )}
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

function StepProgress({ step }: { step: ScheduleStep }) {
  const labels = {
    1: "Step 1 of 3 — Select lead",
    2: "Step 2 of 3 — Date, time & attorney",
    3: "Step 3 of 3 — Review & confirm",
  } as const;

  return (
    <Box mt="18px">
      <Grid templateColumns="repeat(3, minmax(0, 1fr))" gap="4px">
        {[1, 2, 3].map((stage) => (
          <Box
            key={stage}
            h="3px"
            borderRadius="999px"
            bg={stage <= step ? "brand.solid" : "border.subtle"}
          />
        ))}
      </Grid>
      <Text m="8px 0 0" color="fg.muted" fontSize="11px">
        {labels[step]}
      </Text>
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
          <Stack gap="7px">
            {leads.map((lead) => {
              const selected = selectedLeadId === lead.id;
              const initials = getInitials(lead.name);
              const isBlue = lead.id.charCodeAt(0) % 2 === 0;
              const caseTypeName = lead.caseTypeName ?? "General";

              return (
                <chakra.button
                  key={lead.id}
                  type="button"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  gap="12px"
                  w="full"
                  minH="58px"
                  p="10px 12px"
                  border="1px solid"
                  borderColor={
                    selected ? "brand.solid" : touched ? invalidColor : "border"
                  }
                  borderRadius="8px"
                  bg="bg"
                  textAlign="left"
                  onClick={() => onSelect(lead.id)}
                >
                  <HStack gap="12px" minW="0">
                    <SelectionDot selected={selected} />
                    <Box
                      display="grid"
                      placeItems="center"
                      flex="0 0 auto"
                      w="36px"
                      h="36px"
                      borderRadius="full"
                      bg={isBlue ? "#e5efff" : "#d9f8ed"}
                      color={isBlue ? "#1c55b8" : "#00785a"}
                      fontSize="11px"
                      fontWeight="500"
                    >
                      {initials}
                    </Box>
                    <Box minW="0">
                      <HStack gap="7px" wrap="wrap">
                        <Text m="0" color="fg" fontSize="13px" fontWeight="500">
                          {lead.name}
                        </Text>
                        <StatusPill tone="neutral">{caseTypeName}</StatusPill>
                      </HStack>
                      <MutedText>{lead.email}</MutedText>
                    </Box>
                  </HStack>
                  <StatusPill tone="success">Conflict cleared</StatusPill>
                </chakra.button>
              );
            })}
          </Stack>
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

function ScheduleDetailsStep({
  date,
  startTime,
  durationChoice,
  customDuration,
  consultationType,
  attorneyId,
  attorneys,
  videoLink,
  notes,
  notifyEmail,
  notifySms,
  touchedField,
  onDateChange,
  onStartTimeChange,
  onDurationChoiceChange,
  onCustomDurationChange,
  onConsultationTypeChange,
  onAttorneyChange,
  onVideoLinkChange,
  onNotesChange,
  onNotifyEmailChange,
  onNotifySmsChange,
}: {
  date: string;
  startTime: string;
  durationChoice: number | "custom";
  customDuration: string;
  consultationType: ConsultationMode;
  attorneyId: string;
  attorneys: StaffMemberDTO[];
  videoLink: string;
  notes: string;
  notifyEmail: boolean;
  notifySms: boolean;
  touchedField: "client" | "date" | "duration" | "attorney" | null;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onDurationChoiceChange: (value: number | "custom") => void;
  onCustomDurationChange: (value: string) => void;
  onConsultationTypeChange: (value: ConsultationMode) => void;
  onAttorneyChange: (value: string) => void;
  onVideoLinkChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onNotifyEmailChange: (value: boolean) => void;
  onNotifySmsChange: (value: boolean) => void;
}) {
  return (
    <Stack gap="12px" pt="10px">
      <Grid
        templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }}
        gap="10px"
      >
        <FormField label="Date">
          <Input
            type="date"
            value={date}
            min={getTodayDate()}
            onChange={(event) => onDateChange(event.currentTarget.value)}
            {...fieldStyles}
            borderColor={touchedField === "date" ? invalidColor : "border"}
          />
        </FormField>
        <FormField label="Start time">
          <Input
            type="time"
            value={startTime}
            onChange={(event) => onStartTimeChange(event.currentTarget.value)}
            {...fieldStyles}
          />
        </FormField>
      </Grid>

      <FormField label="Duration">
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
      </FormField>

      <FormField label="Consultation type">
        <chakra.select
          value={consultationType}
          onChange={(event) =>
            onConsultationTypeChange(
              event.currentTarget.value as ConsultationMode,
            )
          }
          {...fieldStyles}
          borderColor="border"
          cursor="pointer"
        >
          {CONSULTATION_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </chakra.select>
      </FormField>

      <FormField label="Lead attorney conducting consultation">
        <chakra.select
          value={attorneyId}
          onChange={(event) => onAttorneyChange(event.currentTarget.value)}
          {...fieldStyles}
          borderColor={touchedField === "attorney" ? invalidColor : "border"}
          cursor="pointer"
        >
          <option value="">— Select attorney —</option>
          {attorneys.map((attorney) => (
            <option key={attorney.id} value={attorney.id}>
              {attorney.firstName} {attorney.lastName}
            </option>
          ))}
        </chakra.select>
      </FormField>

      <FormField label="Video call link (optional)">
        <Input
          value={videoLink}
          onChange={(event) => onVideoLinkChange(event.currentTarget.value)}
          placeholder="https://zoom.us/j/... or Teams / Google Meet link"
          {...fieldStyles}
        />
        <MutedText>
          Link will be included in the client's calendar invitation.
        </MutedText>
      </FormField>

      <FormField label="Pre-consultation notes (optional)">
        <Textarea
          value={notes}
          onChange={(event) => onNotesChange(event.currentTarget.value)}
          minH="82px"
          resize="vertical"
          placeholder="Add any notes for the attorney before the consultation — e.g. outstanding documents, follow-up questions from questionnaire review, or client-specific considerations."
          {...fieldStyles}
          h="auto"
          py="10px"
        />
      </FormField>

      <Box>
        <Text m="0 0 8px" color="fg" fontSize="12px" fontWeight="500">
          Notify client via
        </Text>
        <HStack gap="8px" wrap="wrap">
          <NotifyChip
            active={notifyEmail}
            onClick={() => onNotifyEmailChange(!notifyEmail)}
            icon={<Mail size={12} />}
          >
            Email
          </NotifyChip>
          <NotifyChip
            active={notifySms}
            onClick={() => onNotifySmsChange(!notifySms)}
            icon={<MessageSquare size={12} />}
          >
            SMS
          </NotifyChip>
        </HStack>
      </Box>
    </Stack>
  );
}

function ReviewStep({
  lead,
  matterType,
  language,
  date,
  startTime,
  duration,
  consultationType,
  attorney,
  notifyChannels,
  videoLink,
  notes,
}: {
  lead: Lead;
  matterType: string;
  language: string;
  date: string;
  startTime: string;
  duration: string;
  consultationType: string;
  attorney: string;
  notifyChannels: ("email" | "sms")[];
  videoLink: string;
  notes: string;
}) {
  const notifyLabel =
    notifyChannels.length === 0
      ? "No notification"
      : notifyChannels.map((c) => (c === "email" ? "Email" : "SMS")).join(", ");
  return (
    <Stack gap="14px" pt="10px">
      <Box p="14px 16px" borderRadius="8px" bg="bg.subtle">
        <SummaryItem label="Lead">{lead.name}</SummaryItem>
        <SummaryItem label="Matter type">{matterType}</SummaryItem>
        <SummaryItem label="Language">{language}</SummaryItem>
        <SummaryItem label="Date">{date}</SummaryItem>
        <SummaryItem label="Start time">{startTime}</SummaryItem>
        <SummaryItem label="Duration">{duration}</SummaryItem>
        <SummaryItem label="Consultation type">{consultationType}</SummaryItem>
        <SummaryItem label="Lead attorney">{attorney}</SummaryItem>
        <SummaryItem label="Notify via">{notifyLabel}</SummaryItem>
        {videoLink ? (
          <SummaryItem label="Video link">{videoLink}</SummaryItem>
        ) : null}
        {notes ? (
          <SummaryItem label="Pre-consultation notes">{notes}</SummaryItem>
        ) : null}
      </Box>

      <HStack
        align="flex-start"
        gap="10px"
        p="12px"
        border="1px solid"
        borderColor="#377dff"
        borderRadius="7px"
        bg="#e8f1ff"
        color="#0f4aa8"
        fontSize="12px"
        lineHeight="1.45"
      >
        <Info size={14} />
        <Box>
          <Text m="0 0 4px" fontSize="12px" fontWeight="500">
            What happens after scheduling:
          </Text>
          <Text m="0">
            1. Client receives a notification via the selected channels.
            <br />
            2. The lead moves to Consultation & Notes stage and a consultation
            card is created.
            <br />
            3. The assigned attorney sees the consultation in their portal with
            the client's questionnaire responses and documents ready to review.
            <br />
            4. After the consultation the attorney selects an outcome.
          </Text>
        </Box>
      </HStack>
    </Stack>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <Text m="0 0 6px" color="fg" fontSize="12px" fontWeight="500">
        {label}
      </Text>
      {children}
    </Box>
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

function SelectionDot({ selected }: { selected: boolean }) {
  return (
    <Box
      display="grid"
      placeItems="center"
      flex="0 0 auto"
      w="16px"
      h="16px"
      border="1px solid"
      borderColor={selected ? "brand.solid" : "border"}
      borderRadius="full"
      bg={selected ? "brand.solid" : "bg"}
      color="brand.fg"
    >
      {selected ? <Check size={10} /> : null}
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
