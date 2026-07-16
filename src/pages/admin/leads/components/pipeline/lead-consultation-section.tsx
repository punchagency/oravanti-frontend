import {
  Box,
  chakra,
  Dialog,
  Flex,
  HStack,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  ExternalLink,
  FileText,
  Info,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Send,
  UserX,
  Video,
  X,
  Zap,
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  Consultation,
  FeeAgreementDetails,
  FeeAgreementPreview,
  LeadDetail,
} from "@/api/leads";
import { formatReceivedDate, getLeadById } from "@/api/leads";
import { useConsultationSettings } from "@/hooks/use-consultation-settings";
import {
  useAdvanceLeadStage,
  useCancelConsultation,
  useDiscardFeeAgreement,
  useFeeAgreementPreview,
  useGenerateFeeAgreement,
  useMarkFeeAgreementPaymentReceived,
  useMarkFeeAgreementReceived,
  useNudgeClient,
  useSendFeeAgreement,
  useUpdateConsultation,
  useUpdateLead,
} from "@/hooks/use-leads";
import { useLeadQuestionnaire } from "@/hooks/use-questionnaires";
import { useStaffList } from "@/hooks/use-staff-list";
import { dayjs, formatTime } from "@/utils/date";
import {
  BrandButton,
  CardTitle,
  MutedText,
  OutlineButton,
  StatusPill,
  SurfaceCard,
} from "@/components/ui/intake-ui";
import { buildFeeAgreementHtml } from "@/pages/admin/intake/components/fee-agreement-document";
import { FeeAgreementWizard } from "@/pages/admin/intake/components/fee-agreement-wizard";
import { consultationModeLabel } from "@/pages/admin/intake/components/consultation-wizard-constants";
import {
  ScheduleConsultationDialog,
  type ConsultationSummaryLead,
} from "@/pages/admin/intake/components/consultation-view";
import { InstantConsultationDialog } from "@/pages/admin/intake/components/instant-consultation-dialog";

type StatusTone = "info" | "success" | "danger" | "warning" | "neutral";

const CONSULT_STATUS_LABEL: Record<string, string> = {
  pending_payment: "Pending payment",
  awaiting_slot_selection: "Awaiting slot",
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

const CONSULT_STATUS_TONE: Record<string, StatusTone> = {
  pending_payment: "warning",
  awaiting_slot_selection: "warning",
  scheduled: "info",
  in_progress: "warning",
  completed: "success",
  cancelled: "danger",
  no_show: "danger",
};

const TONE_DOT: Record<StatusTone, string> = {
  info: "#2f63c7",
  success: "#00785a",
  warning: "#8a641d",
  danger: "#b00020",
  neutral: "#94a3b8",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatIsoTime(iso: string): string {
  if (!iso || !dayjs(iso).isValid()) return "\u2014";
  return formatTime(iso);
}

function consultationModeIcon(mode: string | undefined) {
  if (mode === "video") return <Video size={12} />;
  if (mode === "phone_call") return <Phone size={12} />;
  return <MapPin size={12} />;
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

function SectionRow({ children }: { children: React.ReactNode }) {
  return (
    <Box mt="16px" pt="14px" borderTop="1px solid" borderColor="border.subtle">
      {children}
    </Box>
  );
}

// SubLabel, CheckMarker, TextLink kept as potential future use

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

function PastConsultations({ items }: { items: Consultation[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Box>
      <chakra.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        display="flex"
        alignItems="center"
        gap="8px"
        w="full"
        textAlign="left"
      >
        <Text m="0" color="fg" fontSize="13px" fontWeight="500">
          Past consultations
        </Text>
        <MutedText>{items.length}</MutedText>
        <Box ml="auto" color="fg.muted" transform={open ? "rotate(180deg)" : undefined} transition="transform 0.2s">
          <ChevronDown size={16} />
        </Box>
      </chakra.button>
      {open ? (
        <Stack gap="0" mt="8px">
          {items.map((c) => (
            <PastConsultationRow key={c.id} consultation={c} />
          ))}
        </Stack>
      ) : null}
    </Box>
  );
}

function PastConsultationRow({ consultation: c }: { consultation: Consultation }) {
  const [showNotes, setShowNotes] = useState(false);
  const tone = CONSULT_STATUS_TONE[c.status] ?? "neutral";
  const when = c.scheduledAt
    ? `${formatReceivedDate(c.scheduledAt)} \u00B7 ${formatIsoTime(c.scheduledAt)}`
    : "Not scheduled";
  const notes = c.attorneyNotes?.trim();
  return (
    <Box
      py="8px"
      borderBottom="1px solid"
      borderColor="border.subtle"
      _last={{ borderBottom: 0 }}
    >
      <HStack justify="space-between" gap="10px">
        <HStack gap="8px" minW="0">
          <Box
            flex="0 0 auto"
            w="7px"
            h="7px"
            borderRadius="full"
            bg={TONE_DOT[tone]}
          />
          <Box minW="0">
            <Text m="0" color="fg" fontSize="13px" truncate>
              {consultationModeLabel(c.mode)} · {when}
            </Text>
            {c.outcome ? (
              <MutedText>Outcome: {c.outcome.replace(/_/g, " ")}</MutedText>
            ) : null}
          </Box>
        </HStack>
        <StatusPill tone={tone}>{CONSULT_STATUS_LABEL[c.status] ?? c.status}</StatusPill>
      </HStack>
      {notes ? (
        <Box pl="15px" mt="4px">
          <chakra.button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            color="brand.fg"
            fontSize="12px"
            fontWeight="500"
          >
            {showNotes ? "Hide attorney notes" : "View attorney notes"}
          </chakra.button>
          {showNotes ? (
            <Text
              m="6px 0 0"
              p="8px 10px"
              bg="bg.subtle"
              borderRadius="6px"
              color="fg"
              fontSize="12px"
              lineHeight="1.5"
              whiteSpace="pre-wrap"
            >
              {notes}
            </Text>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}

function CancelConsultationDialog({
  open,
  leadName,
  reason,
  onReasonChange,
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  leadName: string;
  reason: string;
  onReasonChange: (value: string) => void;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(d) => {
        if (!d.open) onClose();
      }}
    >
      <Dialog.Backdrop bg="blackAlpha.500" />
      <Dialog.Positioner>
        <Dialog.Content
          maxW="440px"
          borderRadius="14px"
          bg="bg"
          p="0"
          overflow="hidden"
        >
          <Box p="20px 24px">
            <Dialog.Title color="fg" fontSize="16px" fontWeight="600">
              Cancel consultation
            </Dialog.Title>
            <MutedText fontSize="13px">
              This cancels {leadName}'s consultation, revokes their booking
              link, and notifies everyone involved. This can't be undone, but
              you can schedule a new consultation afterwards.
            </MutedText>
            <Box mt="14px">
              <Text m="0 0 6px" fontSize="12px" color="fg.muted">
                Reason (optional)
              </Text>
              <Textarea
                value={reason}
                onChange={(e) => onReasonChange(e.currentTarget.value)}
                placeholder="Shared with the client and staff in the cancellation email."
                minH="72px"
                resize="vertical"
                w="full"
                h="auto"
                py="10px"
                px="12px"
                border="1px solid"
                borderColor="border"
                borderRadius="7px"
                bg="bg"
                color="fg"
                fontSize="13px"
                _placeholder={{ color: "fg.muted" }}
                _focus={{ borderColor: "brand.solid", boxShadow: "0 0 0 1px var(--brand-cta)" }}
              />
            </Box>
          </Box>
          <Flex
            justify="flex-end"
            gap="10px"
            p="14px 24px"
            borderTop="1px solid"
            borderColor="border.subtle"
          >
            <OutlineButton onClick={onClose} disabled={loading}>
              Keep consultation
            </OutlineButton>
            <BrandButton
              onClick={onConfirm}
              loading={loading}
              bg="#b00020"
              color="white"
              _hover={{ bg: "#970019" }}
            >
              <X size={14} />
              Cancel consultation
            </BrandButton>
          </Flex>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

function FeeAgreementPreviewModal({
  open,
  loading,
  preview,
  sending,
  onSend,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  preview: FeeAgreementPreview | null;
  sending: boolean;
  onSend: () => void;
  onClose: () => void;
}) {
  function handleDownload() {
    if (!preview) return;
    const win = window.open("", "_blank", "width=820,height=1000");
    if (!win) return;
    win.document.write(
      `<html><head><title>Fee agreement ${preview.document.docRef}</title></head><body style="margin:24px;">${buildFeeAgreementHtml(
        preview.document,
      )}</body></html>`,
    );
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(d) => {
        if (!d.open) onClose();
      }}
      placement="center"
      lazyMount
      unmountOnExit
    >
      <Dialog.Backdrop bg="rgba(0,0,0,0.46)" />
      <Dialog.Positioner>
        <Dialog.Content
          maxW="760px"
          w="calc(100vw - 48px)"
          maxH="calc(100vh - 72px)"
          borderRadius="14px"
          bg="bg"
          p="0"
          overflow="hidden"
          display="flex"
          flexDirection="column"
        >
          <Flex
            align="center"
            justify="space-between"
            gap="12px"
            p="14px 18px"
            borderBottom="1px solid"
            borderColor="border.subtle"
            flex="0 0 auto"
          >
            <Dialog.Title color="fg" fontSize="15px" fontWeight="600">
              Fee agreement preview
            </Dialog.Title>
            <HStack gap="8px">
              <OutlineButton disabled title="Coming soon">
                <Pencil size={14} />
                Edit
              </OutlineButton>
              <OutlineButton disabled={!preview} onClick={handleDownload}>
                Download
              </OutlineButton>
              <BrandButton
                disabled={!preview}
                loading={sending}
                onClick={onSend}
              >
                <Send size={14} />
                Send to client
              </BrandButton>
              <chakra.button
                type="button"
                aria-label="Close preview"
                onClick={onClose}
                display="grid"
                placeItems="center"
                w="32px"
                h="32px"
                borderRadius="full"
                color="fg.muted"
                _hover={{ bg: "bg.muted" }}
              >
                <X size={16} />
              </chakra.button>
            </HStack>
          </Flex>

          <Box flex="1" overflowY="auto" p="24px" bg="bg.subtle">
            {loading || !preview ? (
              <MutedText>Loading preview\u2026</MutedText>
            ) : (
              <Box
                bg="bg"
                borderRadius="10px"
                p="28px"
                border="1px solid"
                borderColor="border"
                dangerouslySetInnerHTML={{
                  __html: buildFeeAgreementHtml(preview.document),
                }}
              />
            )}
          </Box>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  CONSULTATION SECTION  —  matches consultation-view.tsx's card exactly
// ════════════════════════════════════════════════════════════════════════

export function ConsultationSection({ lead }: { lead: LeadDetail }) {
  const { data: leadDetail } = useQuery({
    queryKey: ["lead", lead.id],
    queryFn: () => getLeadById(lead.id),
  });
  // For the per-lead page, the lead prop already has the data; useLeadById
  // ensures reactivity when the cache updates. If leadDetail is loading
  // we fall back to the prop data which is already available.
  const effectiveLead = leadDetail ?? lead;
  const { data: questionnaire } = useLeadQuestionnaire(
    effectiveLead.questionnaireSendId ? effectiveLead.id : "",
  );
  const { data: staffData } = useStaffList({
    role: "attorney",
    status: "active",
    limit: 1000,
  });
  const { data: firmFeeSettings } = useConsultationSettings();

  const saveNotesMutation = useUpdateConsultation();
  const saveLeadNotes = useUpdateLead();
  const completeMutation = useUpdateConsultation();
  const noShowMutation = useUpdateConsultation();
  const outcomesMutation = useUpdateConsultation();
  const markPaidMutation = useUpdateConsultation();
  const cancelMutation = useCancelConsultation();
  const generateFee = useGenerateFeeAgreement();
  const sendFee = useSendFeeAgreement();
  const markReceived = useMarkFeeAgreementReceived();
  const markPayment = useMarkFeeAgreementPaymentReceived();
  const nudgeClient = useNudgeClient();
  const advanceStage = useAdvanceLeadStage();

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [instantOpen, setInstantOpen] = useState(false);

  const consultation = effectiveLead.consultation;
  const consultationHistory = effectiveLead.consultationHistory ?? [];
  const hasConsultation = Boolean(consultation);
  const feeAgreement = effectiveLead.feeAgreement;
  const awaitingPayment =
    feeAgreement?.details != null &&
    feeAgreement.details.attorneyFee.type !== "contingency" &&
    !feeAgreement.details.paymentReceivedAt;

  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatedPreview, setGeneratedPreview] =
    useState<FeeAgreementPreview | null>(null);
  const draftPreview = useFeeAgreementPreview(
    feeAgreement?.id ?? null,
    previewOpen && !generatedPreview,
  );
  const previewData = generatedPreview ?? draftPreview.data ?? null;
  function closePreview() {
    setPreviewOpen(false);
    setGeneratedPreview(null);
  }

  const discardDraft = useDiscardFeeAgreement();
  const [reusedDetails, setReusedDetails] =
    useState<FeeAgreementDetails | null>(null);
  function handleDiscardDraft() {
    if (!feeAgreement) return;
    const details = feeAgreement.details;
    discardDraft.mutate(feeAgreement.id, {
      onSuccess: () => {
        setReusedDetails(details);
        closePreview();
      },
    });
  }

  const [notes, setNotes] = useState<string | null>(null);
  const baseNotes = hasConsultation
    ? (consultation?.attorneyNotes ?? "")
    : (effectiveLead.notes ?? "");
  const displayNotes = notes !== null ? notes : baseNotes;
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [now, setTime] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const attorneys = staffData?.data ?? [];
  const attorneyName = (() => {
    if (!consultation?.leadAttorneyId) return "Unassigned";
    const a = attorneys.find((s: { id: string }) => s.id === consultation.leadAttorneyId);
    return a ? `${a.firstName} ${a.lastName}`.trim() : "Assigned attorney";
  })();

  const modeLabel = consultation
    ? consultationModeLabel(consultation.mode)
    : null;
  const consultationDate = consultation?.scheduledAt
    ? formatReceivedDate(consultation.scheduledAt)
    : "\u2014";
  const consultationTime = consultation?.scheduledAt
    ? formatIsoTime(consultation.scheduledAt)
    : "\u2014";
  const consultStatusLabel = consultation
    ? CONSULT_STATUS_LABEL[consultation.status] ?? consultation.status
    : null;
  const consultStatusTone: StatusTone = consultation
    ? CONSULT_STATUS_TONE[consultation.status] ?? "neutral"
    : "neutral";

  const consultationCompleted = consultation?.status === "completed";
  const hasCompletedConsultation =
    consultationCompleted ||
    consultationHistory.some((c: Consultation) => c.status === "completed");
  const isCompletable =
    consultation?.status === "scheduled" ||
    consultation?.status === "in_progress";
  const scheduledAt = consultation?.scheduledAt;
  const startTimeReached = scheduledAt
    ? now >= new Date(scheduledAt).getTime()
    : false;
  const canComplete = isCompletable && startTimeReached;

  const canCancel =
    consultation?.status === "pending_payment" ||
    consultation?.status === "awaiting_slot_selection" ||
    consultation?.status === "scheduled" ||
    consultation?.status === "in_progress";

  const caseOpened = Boolean(effectiveLead.convertedCaseId);
  const isReadyToOpen =
    feeAgreement?.status === "signed" && !awaitingPayment;
  const feeStageIndex = caseOpened
    ? 5
    : isReadyToOpen
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
    : isReadyToOpen
      ? { label: "Payment received", tone: "success" }
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
        { id: effectiveLead.id, data: { attorneyNotes: displayNotes } },
        { onSuccess: () => setNotes(null) },
      );
    } else {
      saveLeadNotes.mutate(
        { id: effectiveLead.id, data: { notes: displayNotes } },
        { onSuccess: () => setNotes(null) },
      );
    }
  }
  function handleCompleteConsultation() {
    completeMutation.mutate({ id: effectiveLead.id, data: { status: "completed" } });
  }
  function handleNoShow() {
    noShowMutation.mutate({ id: effectiveLead.id, data: { status: "no_show" } });
  }
  function handleFollowUp() {
    if (!consultation) return;
    outcomesMutation.mutate(
      { id: effectiveLead.id, data: { outcome: "follow_up" } },
      { onSuccess: () => toast.success("Follow-up recorded. Schedule it from the main consultation view.") },
    );
  }
  function handleCloseNoCase() {
    outcomesMutation.mutate({
      id: effectiveLead.id,
      data: { outcome: "close_no_case" },
    });
  }
  function handleReferElsewhere() {
    outcomesMutation.mutate({
      id: effectiveLead.id,
      data: { outcome: "refer_elsewhere" },
    });
  }
  function handleCancelConsultation() {
    cancelMutation.mutate(
      { id: effectiveLead.id, reason: cancelReason.trim() || undefined },
      {
        onSuccess: () => {
          setCancelOpen(false);
          setCancelReason("");
          toast.success("Consultation cancelled");
        },
      },
    );
  }

  const questionnaireComplete =
    questionnaire?.response?.status === "submitted" ||
    questionnaire?.send?.status === "submitted";
  const submittedDate = questionnaire?.response?.submittedAt
    ? formatReceivedDate(questionnaire.response.submittedAt)
    : null;

  return (
    <>
      <SurfaceCard>
        {/* 1. Lead + consultation details */}
        <HStack align="flex-start" justify="space-between" gap="16px" wrap="wrap">
          <HStack gap="12px" minW="0" align="flex-start">
            <Avatar name={effectiveLead.name} />
            <Box minW="0">
              <CardTitle>{effectiveLead.name}</CardTitle>
              <MutedText>{effectiveLead.caseTypeName ?? "Matter type not set"}</MutedText>
            </Box>
          </HStack>
          {consultation ? (
            <HStack gap="10px" wrap="wrap" justify="flex-end" align="center">
              <StatusPill tone={consultStatusTone}>
                {consultStatusLabel}
              </StatusPill>
              {consultation.isEmergency ? (
                <StatusPill tone="danger">
                  Emergency ×{Number(consultation.emergencyMultiplier ?? 2)}
                </StatusPill>
              ) : null}
              <StatusPill
                tone="neutral"
                icon={consultationModeIcon(consultation.mode)}
              >
                {modeLabel}
              </StatusPill>
              <MutedText>
                {consultationDate} · {consultationTime} · {consultation.duration} min
              </MutedText>
              {consultation.paymentTiming === "pay_in_person" &&
              consultation.feeStatus === "unpaid" ? (
                <OutlineButton
                  loading={markPaidMutation.isPending}
                  onClick={() =>
                    markPaidMutation.mutate({
                      id: effectiveLead.id,
                      data: { feeStatus: "paid" },
                    })
                  }
                >
                  <Check size={14} />
                  Mark payment received
                </OutlineButton>
              ) : null}
              {canCancel ? (
                <chakra.button
                  type="button"
                  onClick={() => setCancelOpen(true)}
                  display="inline-flex"
                  alignItems="center"
                  gap="4px"
                  fontSize="12px"
                  fontWeight="500"
                  color="#b00020"
                  _hover={{ textDecoration: "underline" }}
                >
                  <X size={12} />
                  Cancel
                </chakra.button>
              ) : null}
            </HStack>
          ) : (
            <HStack gap="8px" align="center" wrap="wrap">
              <StatusPill tone="warning" icon={<CalendarClock size={11} />}>
                No consultation scheduled
              </StatusPill>
              <OutlineButton onClick={() => setInstantOpen(true)}>
                <Zap size={14} />
                Start consultation now
              </OutlineButton>
              <BrandButton onClick={() => setScheduleOpen(true)}>
                <CalendarDays size={14} />
                Schedule consultation
              </BrandButton>
            </HStack>
          )}
        </HStack>

        {/* 2. Questionnaire row */}
        <SectionRow>
          <HStack justify="space-between" gap="12px" wrap="wrap">
            <HStack gap="12px" minW="0" align="flex-start">
              <Box minW="0">
                <Text m="0" color="fg" fontSize="13px" fontWeight="500">
                  {questionnaireComplete
                    ? "Questionnaire completed"
                    : "Awaiting response"}
                </Text>
                <MutedText>
                  {submittedDate ? `Submitted ${submittedDate}` : ""}
                </MutedText>
              </Box>
            </HStack>
          </HStack>
        </SectionRow>

        {/* 3. Attorney notes */}
        <SectionRow>
          <Box>
            <Text m="0" color="fg" fontSize="13px" fontWeight="500">
              Attorney notes
            </Text>
            <MutedText>
              {hasConsultation
                ? "Notes are internal and not visible to the client."
                : "Capture observations before the consultation \u2014 saved to the lead and internal only."}
            </MutedText>
            <Textarea
              aria-label={`${effectiveLead.name} attorney notes`}
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
        </SectionRow>

        {/* 4. Fee agreement */}
        {hasCompletedConsultation ? (
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
                    Signed & received — case opened successfully
                  </Text>
                </HStack>
              ) : !feeAgreement ? (
                <FeeAgreementWizard
                  lead={effectiveLead}
                  consultationFeeAmount={firmFeeSettings?.defaultAmount ?? null}
                  generating={generateFee.isPending}
                  initialDetails={reusedDetails}
                  onSubmit={(data) =>
                    generateFee.mutate(
                      { id: effectiveLead.id, data },
                      {
                        onSuccess: (preview) => {
                          setGeneratedPreview(preview);
                          setPreviewOpen(true);
                        },
                      },
                    )
                  }
                />
              ) : feeAgreement.status === "draft" ? (
                <Stack gap="10px">
                  <MutedText>Agreement generated — ready to dispatch.</MutedText>
                  <HStack gap="8px" wrap="wrap">
                    <BrandButton onClick={() => setPreviewOpen(true)}>
                      <FileText size={14} />
                      Preview & send
                    </BrandButton>
                    <OutlineButton
                      loading={discardDraft.isPending}
                      onClick={handleDiscardDraft}
                    >
                      <Pencil size={14} />
                      Cancel & edit
                    </OutlineButton>
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
                  <MutedText>
                    {awaitingPayment
                      ? "Signed document received \u2014 awaiting payment. Standard agreements require payment before the case can be opened."
                      : "Signed document received."}
                  </MutedText>
                  <HStack gap="8px" wrap="wrap">
                    {awaitingPayment ? (
                      <>
                        <BrandButton
                          loading={markPayment.isPending}
                          onClick={() => markPayment.mutate(feeAgreement.id)}
                        >
                          <Check size={14} />
                          Mark payment received
                        </BrandButton>
                        <OutlineButton
                          loading={advanceStage.isPending}
                          onClick={() =>
                            advanceStage.mutate({
                              id: effectiveLead.id,
                              stage: "case_opening",
                            })
                          }
                        >
                          <ExternalLink size={14} />
                          Advance to case opening
                        </OutlineButton>
                      </>
                    ) : (
                      <BrandButton
                        loading={advanceStage.isPending}
                        onClick={() =>
                          advanceStage.mutate({
                            id: effectiveLead.id,
                            stage: "case_opening",
                          })
                        }
                      >
                        <ExternalLink size={14} />
                        Advance to case opening
                      </BrandButton>
                    )}
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
                  {!canComplete && consultation?.scheduledAt ? (
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

        {/* Past consultations */}
        {consultationHistory.length > 0 ? (
          <SectionRow>
            <PastConsultations items={consultationHistory} />
          </SectionRow>
        ) : null}

        {/* 5. Footer — outcomes */}
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
                  ? "Closed \u2014 no case opened."
                  : "Referred to outside counsel."}
              </MutedText>
            ) : (
              <HStack gap="8px" wrap="wrap" justify="flex-end">
                {consultationCompleted ? (
                  <OutlineButton
                    loading={outcomesMutation.isPending}
                    onClick={handleFollowUp}
                  >
                    <CalendarDays size={14} />
                    Schedule follow-up
                  </OutlineButton>
                ) : null}
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

        <CancelConsultationDialog
          open={cancelOpen}
          leadName={effectiveLead.name}
          reason={cancelReason}
          onReasonChange={setCancelReason}
          loading={cancelMutation.isPending}
          onConfirm={handleCancelConsultation}
          onClose={() => {
            setCancelOpen(false);
            setCancelReason("");
          }}
        />

        <FeeAgreementPreviewModal
          open={previewOpen}
          loading={draftPreview.isLoading && !generatedPreview}
          preview={previewData}
          sending={sendFee.isPending}
          onSend={() =>
            previewData &&
            sendFee.mutate(previewData.agreement.id, { onSuccess: closePreview })
          }
          onClose={closePreview}
        />

        <ScheduleConsultationDialog
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
          presetLead={lead as unknown as ConsultationSummaryLead}
        />
        <InstantConsultationDialog
          open={instantOpen}
          onOpenChange={setInstantOpen}
        />
      </SurfaceCard>
    </>
  );
}
