import type { LeadNote } from "@/api/lead-workflows";
import { useHasPermission } from "@/hooks/use-has-permission";
import { InvoiceDetailDialog } from "@/pages/admin/finance/components/dialogs/invoice-detail-dialog";
import { formatCurrency } from "@/utils/currency";
import type {
  Consultation,
  FeeAgreementDetails,
  FeeAgreementPreview,
  LeadDetail,
} from "@/api/leads";
import { formatReceivedDate } from "@/api/leads";
import {
  BrandButton,
  CardTitle,
  MutedText,
  OutlineButton,
  StatusPill,
  SurfaceCard,
} from "@/components/ui/intake-ui";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { useConsultationSettings } from "@/hooks/use-consultation-settings";
import { useCurrentStaff } from "@/hooks/use-current-staff";
import {
  useDeleteLeadNote,
  useLeadNotes,
  useUpdateLeadNote,
} from "@/hooks/use-lead-workflows";
import {
  useCancelConsultation,
  useConsultationData,
  useDiscardFeeAgreement,
  useFeeAgreementData,
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
import { useStaffsList } from "@/hooks/use-staff-list";
import { leadStagePath, pipelineOrigin } from "../shared/constants";
import { consultationModeLabel } from "../shared/consultation-wizard-constants";
import { buildFeeAgreementHtml } from "../fee-agreement/fee-agreement-document";
import { FeeAgreementInvoicePanel } from "../fee-agreement/fee-agreement-invoice";
import { awaitingFeePayment } from "../fee-agreement/fee-agreement-payment-state";
import { FeeAgreementWizard } from "../fee-agreement/fee-agreement-wizard";
import { QuestionnaireResponseDialog } from "../dialogs/questionnaire-response-dialog";
import { useConfirmStore } from "@/store/confirm-store";
import { dayjs, formatTime } from "@/utils/date";
import {
  Box,
  Button,
  chakra,
  Dialog,
  Flex,
  HStack,
  IconButton,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import {
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  ExternalLink,
  Eye,
  FileText,
  Info,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Send,
  Trash2,
  UserX,
  Video,
  X,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

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
                color={done ? "brand.contrast" : active ? "brand.solid" : "fg.muted"}
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
        <Box
          ml="auto"
          color="fg.muted"
          transform={open ? "rotate(180deg)" : undefined}
          transition="transform 0.2s"
        >
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

function PastConsultationRow({
  consultation: c,
}: {
  consultation: Consultation;
}) {
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
        <StatusPill tone={tone}>
          {CONSULT_STATUS_LABEL[c.status] ?? c.status}
        </StatusPill>
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


/**
 * What cancelling does to money the client has already paid.
 *
 * The `canRefund` branch is now defensive rather than reachable: cancelling
 * requires `finance:refund`, so whoever opens this dialog can always refund.
 * It is kept because it stays correct if that gate is ever loosened, and
 * because saying "this will refund the client" to someone who cannot would be
 * a promise the system does not keep.
 */
function CancelRefundNotice({
  netPaid,
  canRefund,
}: {
  netPaid: number;
  canRefund: boolean;
}) {
  if (netPaid <= 0) return null;

  return (
    <Box
      mt="12px"
      p="10px 12px"
      borderRadius="8px"
      border="1px solid"
      borderColor={canRefund ? "border" : "#e0b4b4"}
      bg={canRefund ? "bg.subtle" : "#fdf3f3"}
      _dark={{
        bg: canRefund ? "bg.subtle" : "rgba(176, 0, 32, 0.12)",
        borderColor: canRefund ? "border" : "rgba(176, 0, 32, 0.35)",
      }}
    >
      <Text fontSize="12px" lineHeight="1.6">
        {canRefund ? (
          <>
            This consultation has been paid. Cancelling refunds{" "}
            <Text as="span" fontWeight="600">
              {formatCurrency(netPaid)}
            </Text>{" "}
            to the client.
          </>
        ) : (
          <>
            This consultation has been paid. Cancelling does{" "}
            <Text as="span" fontWeight="600">
              not
            </Text>{" "}
            refund it — an administrator will need to issue the{" "}
            {formatCurrency(netPaid)} refund.
          </>
        )}
      </Text>
    </Box>
  );
}

function CancelConsultationDialog({
  open,
  leadName,
  netPaid,
  canRefund,
  reason,
  onReasonChange,
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  leadName: string;
  /** What the firm is holding for this consultation, net of any refund. */
  netPaid: number;
  canRefund: boolean;
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
            <CancelRefundNotice netPaid={netPaid} canRefund={canRefund} />
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
                _focus={{
                  borderColor: "brand.solid",
                  boxShadow: "0 0 0 1px var(--brand-cta)",
                }}
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
        preview.agreement.firmSigner?.name,
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
                  __html: buildFeeAgreementHtml(
                    preview.document,
                    preview.agreement.firmSigner?.name,
                  ),
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
//  SECTION 1 — Consultation info card (status, mode, time, actions)
// ════════════════════════════════════════════════════════════════════════

function ConsultationInfoCard({
  lead,
  consultation,
}: {
  lead: LeadDetail;
  consultation: Consultation | null;
}) {
  const markPaidMutation = useUpdateConsultation();
  const cancelMutation = useCancelConsultation();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  // Presentation only — the server decides. Refunds need `finance:refund`,
  // which is owner/admin, and a cancellation by anyone else leaves the money
  // owed rather than moving it.
  // Reads the session's flattened grants, which `getMyGrants` resolves through
  // `resolveMemberGrants` — so it sees a permission held through a role group
  // or a firm-defined role, which a `memberRole === "owner" | "admin"` test
  // cannot. Presentation only; the backend gates the actual request.
  const canRefund = useHasPermission("finance", "refund");

  // Gated on `canRefund` for the same reason as the route: a cancellation by
  // someone who cannot send money back leaves the client's money owed with
  // nowhere to act on it.
  const canCancel =
    canRefund &&
    (consultation?.status === "pending_payment" ||
      consultation?.status === "awaiting_slot_selection" ||
      consultation?.status === "scheduled" ||
      consultation?.status === "in_progress");

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
    ? (CONSULT_STATUS_LABEL[consultation.status] ?? consultation.status)
    : null;
  const consultStatusTone: StatusTone = consultation
    ? (CONSULT_STATUS_TONE[consultation.status] ?? "neutral")
    : "neutral";

  function handleCancelConsultation() {
    cancelMutation.mutate(
      { id: lead.id, reason: cancelReason.trim() || undefined },
      {
        onSuccess: () => {
          setCancelOpen(false);
          setCancelReason("");
          toast.success("Consultation cancelled");
        },
      },
    );
  }

  return (
    <SurfaceCard>
      <HStack align="flex-start" justify="space-between" gap="16px" wrap="wrap">
        <HStack gap="12px" minW="0" align="flex-start">
          <Avatar name={lead.name} />
          <Box minW="0">
            <CardTitle>{lead.name}</CardTitle>
            <MutedText>
              {(lead as any).caseTypeName ?? "Matter type not set"}
            </MutedText>
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
              {consultationDate} · {consultationTime} · {consultation.duration}{" "}
              min
            </MutedText>
            {consultation.paymentTiming === "pay_in_person" &&
            consultation.feeStatus === "unpaid" ? (
              <OutlineButton
                loading={markPaidMutation.isPending}
                onClick={() =>
                  markPaidMutation.mutate({
                    id: lead.id,
                    data: { feeStatus: "paid" },
                  })
                }
              >
                <Check size={14} />
                Mark payment received
              </OutlineButton>
            ) : null}
            {/* The fee invoice, if one was raised. It is sent automatically when
                a chargeable consultation is scheduled, so this is a way to see
                what the lead received — and, after a cancellation, whether a
                refund is still outstanding. Deliberately view-only: the invoice
                bills a LEAD, and the edit dialog is built around clients. */}
            {consultation.fee?.invoiceId ? (
              <OutlineButton onClick={() => setInvoiceOpen(true)}>
                <FileText size={13} />
                {consultation.fee.invoiceNumber ?? "Fee invoice"}
              </OutlineButton>
            ) : null}
            {consultation.status === "cancelled" &&
            (consultation.fee?.netPaid ?? 0) > 0 ? (
              <StatusPill tone="danger">
                {formatCurrency(consultation.fee!.netPaid)} refund owed
              </StatusPill>
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
          <StatusPill tone="warning" icon={<CalendarClock size={11} />}>
            No consultation scheduled
          </StatusPill>
        )}
      </HStack>

      <InvoiceDetailDialog
        invoiceId={consultation?.fee?.invoiceId ?? null}
        open={invoiceOpen}
        onOpenChange={(d) => setInvoiceOpen(d.open)}
      />

      <CancelConsultationDialog
        open={cancelOpen}
        leadName={lead.name}
        netPaid={consultation?.fee?.netPaid ?? 0}
        canRefund={canRefund}
        reason={cancelReason}
        onReasonChange={setCancelReason}
        loading={cancelMutation.isPending}
        onConfirm={handleCancelConsultation}
        onClose={() => {
          setCancelOpen(false);
          setCancelReason("");
        }}
      />
    </SurfaceCard>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  SECTION 2 — Questionnaire row
// ════════════════════════════════════════════════════════════════════════

function ConsultationQuestionnaireRow({
  leadId,
  questionnaireSendId,
}: {
  leadId: string;
  questionnaireSendId: string | null;
}) {
  const { data: questionnaire, isLoading } = useLeadQuestionnaire(
    questionnaireSendId ? leadId : "",
  );
  const [responseOpen, setResponseOpen] = useState(false);

  if (isLoading) {
    return (
      <SurfaceCard>
        <HStack gap={3}>
          <ThemeSkeleton h="14px" w="140px" borderRadius="4px" />
          <ThemeSkeleton h="14px" w="100px" borderRadius="4px" />
        </HStack>
      </SurfaceCard>
    );
  }

  const questionnaireComplete =
    questionnaire?.response?.status === "submitted" ||
    questionnaire?.send?.status === "submitted";
  const submittedDate = questionnaire?.response?.submittedAt
    ? formatReceivedDate(questionnaire.response.submittedAt)
    : null;
  const responseId = questionnaire?.response?.id ?? null;

  return (
    <SurfaceCard>
      <HStack justify="space-between" gap="12px" wrap="wrap">
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
        {questionnaireComplete && responseId ? (
          <OutlineButton size="sm" onClick={() => setResponseOpen(true)}>
            <Eye size={14} />
            View response
          </OutlineButton>
        ) : null}
      </HStack>
      <QuestionnaireResponseDialog
        responseId={responseOpen ? responseId : null}
        onClose={() => setResponseOpen(false)}
      />
    </SurfaceCard>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  SECTION 3 — Attorney notes + consultation notes
// ════════════════════════════════════════════════════════════════════════

function ConsultationNotesSection({
  lead,
  hasConsultation,
}: {
  lead: LeadDetail;
  hasConsultation: boolean;
}) {
  const saveNotesMutation = useUpdateConsultation();
  const saveLeadNotes = useUpdateLead();
  const [notes, setNotes] = useState<string | null>(null);

  const { data: notesResult, isLoading: isNotesLoading } = useLeadNotes(
    lead.id,
  );
  const allNotes = notesResult?.data ?? [];
  const consultationNotes = useMemo(
    () => allNotes.filter((n) => n.context === "consultation"),
    [allNotes],
  );

  const consultationAttorneyNotes = "";
  const displayNotes = notes !== null ? notes : consultationAttorneyNotes;

  function handleSaveNotes() {
    saveLeadNotes.mutate(
      {
        id: lead.id,
        data: { notes: displayNotes, noteContext: "consultation" },
      },
      { onSuccess: () => setNotes(null) },
    );
  }

  return (
    <SurfaceCard>
      {/* Attorney notes */}
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

      {/* Consultation notes from lead notes */}
      <SectionRow>
        <Box>
          <Text m="0" color="fg" fontSize="13px" fontWeight="500">
            Consultation notes
          </Text>
          <MutedText>
            Notes mirrored from consultation pre/post-consultation fields.
          </MutedText>
          {isNotesLoading ? (
            <Stack gap={3} mt="8px">
              {Array.from({ length: 2 }, (_, i) => (
                <Box
                  key={i}
                  border="1px solid"
                  borderColor="border.muted"
                  borderRadius="lg"
                  bg="bg"
                  p={4}
                >
                  <HStack gap={2} mb={2}>
                    <ThemeSkeleton h="24px" w="24px" borderRadius="full" />
                    <ThemeSkeleton
                      h="12px"
                      w={`${80 + i * 15}px`}
                      borderRadius="4px"
                    />
                    <ThemeSkeleton h="12px" w="60px" borderRadius="4px" />
                  </HStack>
                  <ThemeSkeleton h="12px" w="100%" borderRadius="4px" mb={1} />
                  <ThemeSkeleton
                    h="12px"
                    w={`${200 + i * 30}px`}
                    borderRadius="4px"
                  />
                </Box>
              ))}
            </Stack>
          ) : consultationNotes.length > 0 ? (
            <Stack gap={3} mt="8px">
              {consultationNotes.map((note) => (
                <ConsultationNoteCard
                  key={note.id}
                  note={note}
                  leadId={lead.id}
                />
              ))}
            </Stack>
          ) : null}
        </Box>
      </SectionRow>
    </SurfaceCard>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  SECTION 4 — Fee agreement
// ════════════════════════════════════════════════════════════════════════

function FeeAgreementSection({
  lead,
  hasCompletedConsultation,
  hasConsultation,
}: {
  lead: LeadDetail;
  hasCompletedConsultation: boolean;
  hasConsultation: boolean;
}) {
  const { data: feeAgreementData, isLoading: isFeeLoading } =
    useFeeAgreementData(lead.id);
  const { data: firmFeeSettings } = useConsultationSettings();
  const generateFee = useGenerateFeeAgreement();
  const sendFee = useSendFeeAgreement();
  const markReceived = useMarkFeeAgreementReceived();
  const markPayment = useMarkFeeAgreementPaymentReceived();
  const nudgeClient = useNudgeClient();
  const discardDraft = useDiscardFeeAgreement();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatedPreview, setGeneratedPreview] =
    useState<FeeAgreementPreview | null>(null);
  const [reusedDetails, setReusedDetails] =
    useState<FeeAgreementDetails | null>(null);

  const feeAgreement = feeAgreementData ?? null;
  // Reads the invoice when there is one and only falls back to the legacy
  // `paymentReceivedAt` flag when there is not — see `awaitingFeePayment`.
  const awaitingPayment = awaitingFeePayment(feeAgreement);

  const draftPreview = useFeeAgreementPreview(
    feeAgreement?.id ?? null,
    previewOpen && !generatedPreview,
  );
  const previewData = generatedPreview ?? draftPreview.data ?? null;

  function closePreview() {
    setPreviewOpen(false);
    setGeneratedPreview(null);
  }

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

  const caseOpened = Boolean(lead.convertedCaseId);
  const isReadyToOpen = feeAgreement?.status === "signed" && !awaitingPayment;
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

  if (isFeeLoading) {
    return (
      <SurfaceCard>
        <HStack justify="space-between" gap="12px" mb={3}>
          <ThemeSkeleton h="14px" w="100px" borderRadius="4px" />
          <ThemeSkeleton h="18px" w="80px" borderRadius="full" />
        </HStack>
        <HStack gap="0" mb={3}>
          {Array.from({ length: 5 }, (_, i) => (
            <Fragment key={i}>
              {i > 0 ? (
                <ThemeSkeleton
                  key={`line-${i}`}
                  flex="1"
                  h="2px"
                  mx="-2px"
                  mt="11px"
                  borderRadius="0"
                />
              ) : null}
              <Stack gap="6px" align="center" flex="0 0 auto" w="72px">
                <ThemeSkeleton h="24px" w="24px" borderRadius="full" />
                <ThemeSkeleton h="8px" w="40px" borderRadius="4px" />
              </Stack>
            </Fragment>
          ))}
        </HStack>
        <ThemeSkeleton h="10px" w="70%" borderRadius="4px" mb={2} />
        <ThemeSkeleton h="10px" w="50%" borderRadius="4px" />
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard>
      {hasCompletedConsultation ? (
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
              lead={lead}
              consultationFeeAmount={firmFeeSettings?.defaultAmount ?? null}
              generating={generateFee.isPending}
              initialDetails={reusedDetails}
              onSubmit={(data) =>
                generateFee.mutate(
                  { id: lead.id, data },
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
                  ? "Signed document received \u2014 awaiting payment. The case cannot be opened until this is paid."
                  : "Signed document received."}
              </MutedText>
              <FeeAgreementInvoicePanel agreement={feeAgreement} />
              {/*
               * No "advance to case opening" action here. The backend already
               * moves the lead the moment both gates are satisfied — signed
               * plus payment (see markFeeAgreementReceived /
               * markFeeAgreementPaymentReceived). Forcing the stage from this
               * card either duplicated a transition that had already happened
               * or, worse, jumped the payment gate. Once the lead is through,
               * the card just points at the step that does the work.
               */}
              <HStack gap="8px" wrap="wrap">
                {awaitingPayment ? (
                  <BrandButton
                    loading={markPayment.isPending}
                    onClick={() => markPayment.mutate(feeAgreement.id)}
                  >
                    <Check size={14} />
                    Mark payment received
                  </BrandButton>
                ) : (
                  <BrandButton asChild>
                    <Link
                      to={leadStagePath(lead.id, "case_opening")}
                      state={pipelineOrigin(
                        leadStagePath(lead.id, "consultation"),
                        "Back to consultation",
                      )}
                    >
                      <ExternalLink size={14} />
                      Go to case opening
                    </Link>
                  </BrandButton>
                )}
              </HStack>
            </Stack>
          ) : null}
        </Stack>
      ) : (
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
        </Stack>
      )}

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
    </SurfaceCard>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  SECTION 5 — Consultation outcomes footer
// ════════════════════════════════════════════════════════════════════════

function ConsultationOutcomes({
  lead,
  consultation,
  hasConsultation,
}: {
  lead: LeadDetail;
  consultation: Consultation | null;
  hasConsultation: boolean;
}) {
  const outcomesMutation = useUpdateConsultation();
  const completeMutation = useUpdateConsultation();
  const noShowMutation = useUpdateConsultation();
  const { data: staffData, isLoading: isStaffLoading } = useStaffsList({
    role: "attorney",
    status: "active",
    limit: 1000,
  });

  const [now, setTime] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const attorneys = staffData?.data ?? [];
  const attorneyName = (() => {
    if (!consultation?.leadAttorneyId) return "Unassigned";
    const a = attorneys.find(
      (s: { id: string }) => s.id === consultation.leadAttorneyId,
    );
    return a ? `${a.firstName} ${a.lastName}`.trim() : "Assigned attorney";
  })();

  const consultationCompleted = consultation?.status === "completed";
  const consultationHistory = (consultation as any)?.consultationHistory ?? [];
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

  const alreadySettled =
    consultation?.outcome === "close_no_case" ||
    consultation?.outcome === "refer_elsewhere";

  function handleCompleteConsultation() {
    completeMutation.mutate({ id: lead.id, data: { status: "completed" } });
  }
  function handleNoShow() {
    noShowMutation.mutate({ id: lead.id, data: { status: "no_show" } });
  }
  function handleFollowUp() {
    if (!consultation) return;
    outcomesMutation.mutate(
      { id: lead.id, data: { outcome: "follow_up" } },
      {
        onSuccess: () =>
          toast.success(
            "Follow-up recorded. Schedule it from the main consultation view.",
          ),
      },
    );
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

  if (isStaffLoading) {
    return (
      <SurfaceCard>
        <HStack gap={3}>
          <ThemeSkeleton h="28px" w="28px" borderRadius="full" />
          <ThemeSkeleton h="12px" w="120px" borderRadius="4px" />
        </HStack>
      </SurfaceCard>
    );
  }

  if (!hasConsultation) return null;

  const consultationDate = consultation?.scheduledAt
    ? formatReceivedDate(consultation.scheduledAt)
    : "\u2014";
  const consultationTime = consultation?.scheduledAt
    ? formatIsoTime(consultation.scheduledAt)
    : "\u2014";

  return (
    <SurfaceCard>
      {/* Complete / no-show actions (when fee agreement locked and consultation is completable) */}
      {!hasCompletedConsultation && isCompletable ? (
        <Box mb={hasConsultation ? "14px" : 0}>
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
                Available after the scheduled start time ({consultationDate} ·{" "}
                {consultationTime}).
              </MutedText>
            </Box>
          ) : null}
        </Box>
      ) : null}

      {/* Past consultations */}
      {consultationHistory.length > 0 ? (
        <Box mb="14px">
          <PastConsultations items={consultationHistory} />
        </Box>
      ) : null}

      {/* Footer — outcomes */}
      <HStack
        justify="space-between"
        gap="12px"
        wrap="wrap"
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
    </SurfaceCard>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  CONSULTATION SECTION — orchestrator
// ════════════════════════════════════════════════════════════════════════

export function ConsultationSection({ lead }: { lead: LeadDetail }) {
  const { data: consultationData, isLoading: isConsultLoading } =
    useConsultationData(lead.id);

  if (isConsultLoading) {
    return (
      <Stack gap={4}>
        <SurfaceCard>
          <HStack
            align="flex-start"
            justify="space-between"
            gap="16px"
            wrap="wrap"
          >
            <HStack gap="12px" minW="0" align="flex-start">
              <ThemeSkeleton h="40px" w="40px" borderRadius="full" />
              <Box minW="0">
                <ThemeSkeleton h="14px" w="120px" borderRadius="4px" mb={2} />
                <ThemeSkeleton h="10px" w="90px" borderRadius="4px" />
              </Box>
            </HStack>
            <ThemeSkeleton h="20px" w="100px" borderRadius="full" />
          </HStack>
        </SurfaceCard>
        <SurfaceCard>
          <ThemeSkeleton h="14px" w="140px" borderRadius="4px" mb={2} />
          <ThemeSkeleton h="10px" w="100px" borderRadius="4px" />
        </SurfaceCard>
        <SurfaceCard>
          <ThemeSkeleton h="14px" w="100px" borderRadius="4px" mb={3} />
          <ThemeSkeleton h="96px" w="100%" borderRadius="6px" mb={2} />
          <HStack justify="flex-end">
            <ThemeSkeleton h="28px" w="80px" borderRadius="6px" />
          </HStack>
        </SurfaceCard>
        <SurfaceCard>
          <ThemeSkeleton h="14px" w="100px" borderRadius="4px" mb={3} />
          <ThemeSkeleton h="80px" w="100%" borderRadius="6px" />
        </SurfaceCard>
      </Stack>
    );
  }

  const consultation = consultationData ?? null;
  const hasConsultation = Boolean(consultation);
  const consultationHistory = consultationData?.consultationHistory ?? [];
  const hasCompletedConsultation =
    consultation?.status === "completed" ||
    consultationHistory.some((c: Consultation) => c.status === "completed");

  return (
    <Stack gap={4}>
      <ConsultationInfoCard lead={lead} consultation={consultation} />
      <ConsultationQuestionnaireRow
        leadId={lead.id}
        questionnaireSendId={lead.questionnaireSendId}
      />
      <ConsultationNotesSection lead={lead} hasConsultation={hasConsultation} />
      <FeeAgreementSection
        lead={lead}
        hasCompletedConsultation={hasCompletedConsultation}
        hasConsultation={hasConsultation}
      />
      <ConsultationOutcomes
        lead={lead}
        consultation={consultation}
        hasConsultation={hasConsultation}
      />
    </Stack>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  Helpers
// ════════════════════════════════════════════════════════════════════════

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function ConsultationNoteCard({
  note,
  leadId,
}: {
  note: LeadNote;
  leadId: string;
}) {
  const { data: currentStaff } = useCurrentStaff();
  const deleteNote = useDeleteLeadNote(leadId);
  const updateNote = useUpdateLeadNote(leadId);
  const showConfirm = useConfirmStore((s) => s.showConfirm);
  const [editing, setEditing] = useState(false);
  const isAuthor = currentStaff?.id === note.authorId;
  const [editText, setEditText] = useState(note.content);

  const handleSave = () => {
    if (!editText.trim()) return;
    updateNote.mutate(
      { noteId: note.id, content: editText.trim() },
      { onSuccess: () => setEditing(false) },
    );
  };

  const handleDelete = () => {
    showConfirm({
      title: "Delete note",
      description:
        "Are you sure you want to delete this note? This action cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      onConfirm: () => {
        deleteNote.mutate(note.id);
      },
    });
  };

  return (
    <Box
      border="1px solid"
      borderColor="border.muted"
      borderRadius="lg"
      bg="bg"
      p={4}
    >
      <HStack gap={2} mb={2} wrap="wrap">
        <Avatar name={note.authorName ?? "Unknown"} size={24} />
        <Text fontSize="12px" fontWeight="500" color="fg">
          {note.authorName ?? "Unknown"}
        </Text>
        <Text fontSize="11px" color="fg.subtle">
          {formatDateTime(note.createdAt)}
        </Text>
        <Box ms="auto" />
        {isAuthor && !editing && (
          <HStack gap={1}>
            <IconButton
              variant="outline"
              borderColor="border"
              size="xs"
              color="fg.muted"
              onClick={() => setEditing(true)}
              aria-label="Edit note"
            >
              <Pencil size={12} />
            </IconButton>
            <IconButton
              variant="outline"
              borderColor="border"
              size="xs"
              color="fg.muted"
              onClick={handleDelete}
              loading={deleteNote.isPending}
              aria-label="Delete note"
            >
              <Trash2 size={12} />
            </IconButton>
          </HStack>
        )}
      </HStack>
      {editing ? (
        <Box>
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            minH="60px"
            fontSize="13px"
            variant="outline"
            borderColor="border"
            mb={2}
          />
          <HStack gap={2} justify="flex-end">
            <Button
              size="xs"
              variant="outline"
              borderColor="border"
              onClick={() => {
                setEditing(false);
                setEditText(note.content);
              }}
            >
              <X size={12} />
              Cancel
            </Button>
            <Button
              size="xs"
              bg="brand.solid"
              color="brand.contrast"
              onClick={handleSave}
              loading={updateNote.isPending}
            >
              Save
            </Button>
          </HStack>
        </Box>
      ) : (
        <Text fontSize="13px" color="fg" whiteSpace="pre-wrap">
          {note.content}
        </Text>
      )}
    </Box>
  );
}
