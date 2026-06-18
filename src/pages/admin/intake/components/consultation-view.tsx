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
  CalendarDays,
  Check,
  ExternalLink,
  Info,
  Mail,
  MapPin,
  MessageSquare,
  Monitor,
  Send,
  Video,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { Lead } from "@/api/leads";
import { formatReceivedDate } from "@/api/leads";
import {
  useAdvanceLeadStage,
  useCreateConsultation,
  useLeadById,
  useLeads,
  useUpdateConsultation,
} from "@/hooks/use-leads";
import { usePublicPracticeAreas } from "@/hooks/use-public-practice-areas";
import type { PublicPracticeArea } from "@/pages/contractor-sign-up/types";
import {
  BrandButton,
  CardTitle,
  MutedText,
  OutlineButton,
  StatusPill,
  SurfaceCard,
} from "../../../../components/ui/intake-ui";

type ScheduleStep = 1 | 2 | 3;

function buildPracticeAreaMap(areas: PublicPracticeArea[]) {
  const map = new Map<string, string>();
  for (const area of areas) {
    map.set(area.id, area.name);
  }
  return map;
}

function buildScheduledAt(date: string, timeStr: string): string {
  const [time, period] = timeStr.split(" ");
  const [hourStr, minStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return `${date}T${String(hour).padStart(2, "0")}:${minStr}:00`;
}

function parseDurationMinutes(durationStr: string): number {
  return parseInt(durationStr, 10);
}

function parseMode(consultationType: string): "video" | "in_person" {
  return consultationType === "Video call" ? "video" : "in_person";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ConsultationView() {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const { data, isLoading } = useLeads({ stage: "consultation" });
  const leads = Array.isArray(data) ? data : (data?.leads ?? []);

  return (
    <>
      <Stack gap="16px" pt="24px" aria-label="Consultation and notes">
        <HStack justify="space-between" gap="16px" wrap="wrap">
          <MutedText fontSize="14px">
            {isLoading
              ? "Loading…"
              : `${leads.length} consultation${leads.length === 1 ? "" : "s"} in progress`}
          </MutedText>
          <OutlineButton onClick={() => setScheduleOpen(true)}>
            <CalendarDays size={14} />
            Schedule consultation
          </OutlineButton>
        </HStack>

        {isLoading ? null : leads.length === 0 ? (
          <MutedText>No consultations in progress.</MutedText>
        ) : (
          <Stack gap="16px">
            {leads.map((lead) => (
              <ConsultationCard key={lead.id} lead={lead} />
            ))}
          </Stack>
        )}
      </Stack>

      <ScheduleConsultationDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
      />
    </>
  );
}

function ConsultationCard({ lead }: { lead: Lead }) {
  const navigate = useNavigate();
  const { data: leadDetail } = useLeadById(lead.id);
  const saveNotesMutation = useUpdateConsultation();
  const outcomesMutation = useUpdateConsultation();
  const advanceStage = useAdvanceLeadStage();

  const consultation = leadDetail?.consultation;
  const [notes, setNotes] = useState<string | null>(null);
  const displayNotes = notes !== null ? notes : (consultation?.attorneyNotes ?? "");

  const modeLabel =
    consultation?.mode === "video"
      ? "Video call"
      : consultation?.mode === "in_person"
        ? "In-person"
        : null;

  const dateLabel = consultation?.scheduledAt
    ? formatReceivedDate(consultation.scheduledAt)
    : formatReceivedDate(lead.receivedAt);

  const statusLabel = consultation
    ? ({
        scheduled: "Scheduled",
        in_progress: "In progress",
        completed: "Completed",
        cancelled: "Cancelled",
        no_show: "No show",
      } as const)[consultation.status]
    : "Pending";

  const statusTone =
    consultation?.status === "completed"
      ? "success"
      : consultation?.status === "cancelled" || consultation?.status === "no_show"
        ? "danger"
        : consultation
          ? "warning"
          : "neutral";

  const alreadySettled =
    consultation?.outcome === "close_no_case" ||
    consultation?.outcome === "refer_elsewhere";

  function handleSaveNotes() {
    saveNotesMutation.mutate(
      { id: lead.id, data: { attorneyNotes: displayNotes } },
      { onSuccess: () => setNotes(null) },
    );
  }

  function handleProceedToFeeAgreement() {
    advanceStage.mutate(
      { id: lead.id, stage: "fee_agreement" },
      { onSuccess: () => navigate("/admin/intake/pipeline/fee-agreement") },
    );
  }

  function handleFollowUp() {
    outcomesMutation.mutate({ id: lead.id, data: { outcome: "follow_up" } });
  }

  function handleCloseNoCase() {
    outcomesMutation.mutate({ id: lead.id, data: { outcome: "close_no_case" } });
  }

  function handleReferElsewhere() {
    outcomesMutation.mutate({ id: lead.id, data: { outcome: "refer_elsewhere" } });
  }

  return (
    <SurfaceCard>
      <HStack align="center" justify="space-between" gap="16px" wrap="wrap">
        <Box>
          <CardTitle>{lead.name}</CardTitle>
          {lead.situationSummary ? (
            <MutedText>{lead.situationSummary}</MutedText>
          ) : null}
        </Box>
        <HStack gap="8px" wrap="wrap" color="fg.muted" fontSize="12px" justify="flex-end">
          <StatusPill tone={statusTone as "success" | "danger" | "warning" | "neutral"}>
            {statusLabel}
          </StatusPill>
          {modeLabel ? (
            <HStack
              as="span"
              gap="4px"
              minH="18px"
              px="8px"
              py="2px"
              borderRadius="999px"
              bg="bg.subtle"
              color="fg.muted"
              fontSize="10px"
              fontWeight="500"
              lineHeight="1"
            >
              {consultation?.mode === "video" ? (
                <Video size={11} />
              ) : (
                <MapPin size={11} />
              )}
              <Box as="span">{modeLabel}</Box>
            </HStack>
          ) : null}
          <Box as="span">{dateLabel}</Box>
        </HStack>
      </HStack>

      <Stack
        gap="8px"
        mt="16px"
        pt="14px"
        pb="16px"
        borderTop="1px solid"
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <Box>
          <Text m="0" color="fg" fontSize="13px" fontWeight="500">
            Attorney notes
          </Text>
          <MutedText>Notes are internal and not visible to the client.</MutedText>
        </Box>
        <Textarea
          aria-label={`${lead.name} attorney notes`}
          value={displayNotes}
          onChange={(e) => setNotes(e.currentTarget.value)}
          minH="102px"
          p="12px"
          borderColor="border"
          bg="bg"
          resize="vertical"
        />
        <OutlineButton
          alignSelf="flex-end"
          loading={saveNotesMutation.isPending}
          onClick={handleSaveNotes}
        >
          Save notes
        </OutlineButton>
      </Stack>

      <HStack justify="flex-end" gap="8px" wrap="wrap" pt="16px">
        {alreadySettled ? (
          <MutedText fontSize="12px">
            {consultation?.outcome === "close_no_case"
              ? "Closed — no case opened."
              : "Referred to outside counsel."}
          </MutedText>
        ) : (
          <>
            <BrandButton
              loading={advanceStage.isPending}
              onClick={handleProceedToFeeAgreement}
            >
              <Send size={14} />
              Proceed to fee agreement
            </BrandButton>
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
          </>
        )}
      </HStack>
    </SurfaceCard>
  );
}

function ScheduleConsultationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState<ScheduleStep>(1);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("8:00 AM");
  const [duration, setDuration] = useState("60 minutes");
  const [consultationType, setConsultationType] = useState("Video call");
  const [attorney, setAttorney] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [notes, setNotes] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(true);
  const [notifyPortal, setNotifyPortal] = useState(false);
  const [touchedField, setTouchedField] = useState<
    "client" | "date" | "attorney" | null
  >(null);

  const { data: leadsData } = useLeads({ stage: "questionnaire" });
  const leads = Array.isArray(leadsData)
    ? leadsData
    : (leadsData?.leads ?? []);

  const { data: practiceAreas } = usePublicPracticeAreas();
  const practiceAreaMap = useMemo(
    () => buildPracticeAreaMap(practiceAreas ?? []),
    [practiceAreas],
  );

  const createConsultation = useCreateConsultation();

  const selectedLead = leads.find((l) => l.id === selectedLeadId);
  const selectedDate = date || "2026-06-26";
  const selectedPracticeAreaName = selectedLead?.practiceAreaId
    ? (practiceAreaMap.get(selectedLead.practiceAreaId) ?? "Unknown")
    : "Not specified";

  function resetDialog() {
    setStep(1);
    setSelectedLeadId("");
    setDate("");
    setStartTime("8:00 AM");
    setDuration("60 minutes");
    setConsultationType("Video call");
    setAttorney("");
    setVideoLink("");
    setNotes("");
    setNotifyEmail(true);
    setNotifySms(true);
    setNotifyPortal(false);
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
      if (!attorney) {
        setTouchedField("attorney");
        return;
      }
      setTouchedField(null);
      setStep(3);
    }
  }

  function handleConfirm() {
    if (!selectedLeadId) return;
    createConsultation.mutate(
      {
        id: selectedLeadId,
        data: {
          scheduledAt: buildScheduledAt(selectedDate, startTime),
          duration: parseDurationMinutes(duration),
          mode: parseMode(consultationType),
          videoLink: videoLink || undefined,
          preConsultationNotes: notes || undefined,
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
                    Schedule a consultation with a lead who has passed conflict
                    check and is in the questionnaire stage.
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
                  practiceAreaMap={practiceAreaMap}
                  selectedLeadId={selectedLeadId}
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
                  duration={duration}
                  consultationType={consultationType}
                  attorney={attorney}
                  videoLink={videoLink}
                  notes={notes}
                  notifyEmail={notifyEmail}
                  notifySms={notifySms}
                  notifyPortal={notifyPortal}
                  touchedField={touchedField}
                  onDateChange={(value) => {
                    setDate(value);
                    if (value) setTouchedField(null);
                  }}
                  onStartTimeChange={setStartTime}
                  onDurationChange={setDuration}
                  onConsultationTypeChange={setConsultationType}
                  onAttorneyChange={(value) => {
                    setAttorney(value);
                    if (value) setTouchedField(null);
                  }}
                  onVideoLinkChange={setVideoLink}
                  onNotesChange={setNotes}
                  onNotifyEmailChange={setNotifyEmail}
                  onNotifySmsChange={setNotifySms}
                  onNotifyPortalChange={setNotifyPortal}
                />
              ) : null}
              {step === 3 && selectedLead ? (
                <ReviewStep
                  lead={selectedLead}
                  practiceAreaName={selectedPracticeAreaName}
                  date={selectedDate}
                  startTime={startTime}
                  duration={duration}
                  consultationType={consultationType}
                  attorney={attorney || "Not assigned"}
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
  practiceAreaMap,
  selectedLeadId,
  touched,
  onSelect,
}: {
  leads: Lead[];
  practiceAreaMap: Map<string, string>;
  selectedLeadId: string;
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
          Only leads who have passed conflict check and are currently in the
          questionnaire stage are shown. The consultation is the step between
          questionnaire completion and fee agreement.
        </Box>
      </HStack>

      <Box>
        <Text m="0 0 8px" color="fg" fontSize="12px" fontWeight="500">
          Select lead
        </Text>
        {leads.length === 0 ? (
          <MutedText>No leads in questionnaire stage.</MutedText>
        ) : (
          <Stack gap="7px">
            {leads.map((lead) => {
              const selected = selectedLeadId === lead.id;
              const initials = getInitials(lead.name);
              const isBlue = lead.id.charCodeAt(0) % 2 === 0;
              const practiceAreaName = lead.practiceAreaId
                ? (practiceAreaMap.get(lead.practiceAreaId) ?? "Practice area")
                : "General";

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
                        <StatusPill tone="success">{practiceAreaName}</StatusPill>
                      </HStack>
                      <MutedText>{lead.email}</MutedText>
                    </Box>
                  </HStack>
                  <StatusPill tone={lead.questionnaireSendId ? "success" : "warning"}>
                    {lead.questionnaireSendId ? "Q'naire sent" : "Pending"}
                  </StatusPill>
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
          <ReadOnlyField label="Practice area">
            {(() => {
              const lead = leads.find((l) => l.id === selectedLeadId);
              return lead?.practiceAreaId
                ? (practiceAreaMap.get(lead.practiceAreaId) ?? "Unknown")
                : "Not specified";
            })()}
          </ReadOnlyField>
          <ReadOnlyField label="Email">
            {leads.find((l) => l.id === selectedLeadId)?.email ?? "—"}
          </ReadOnlyField>
        </Grid>
      ) : null}
    </Stack>
  );
}

function ScheduleDetailsStep({
  date,
  startTime,
  duration,
  consultationType,
  attorney,
  videoLink,
  notes,
  notifyEmail,
  notifySms,
  notifyPortal,
  touchedField,
  onDateChange,
  onStartTimeChange,
  onDurationChange,
  onConsultationTypeChange,
  onAttorneyChange,
  onVideoLinkChange,
  onNotesChange,
  onNotifyEmailChange,
  onNotifySmsChange,
  onNotifyPortalChange,
}: {
  date: string;
  startTime: string;
  duration: string;
  consultationType: string;
  attorney: string;
  videoLink: string;
  notes: string;
  notifyEmail: boolean;
  notifySms: boolean;
  notifyPortal: boolean;
  touchedField: "client" | "date" | "attorney" | null;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onConsultationTypeChange: (value: string) => void;
  onAttorneyChange: (value: string) => void;
  onVideoLinkChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onNotifyEmailChange: (value: boolean) => void;
  onNotifySmsChange: (value: boolean) => void;
  onNotifyPortalChange: (value: boolean) => void;
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
            onChange={(event) => onDateChange(event.currentTarget.value)}
            {...fieldStyles}
            borderColor={touchedField === "date" ? "danger.500" : "border"}
          />
        </FormField>
        <FormField label="Start time">
          <Select
            value={startTime}
            onChange={onStartTimeChange}
            options={["8:00 AM", "9:00 AM", "10:00 AM", "2:00 PM"]}
          />
        </FormField>
        <FormField label="Duration">
          <Select
            value={duration}
            onChange={onDurationChange}
            options={["30 minutes", "45 minutes", "60 minutes", "90 minutes"]}
          />
        </FormField>
        <FormField label="Consultation type">
          <Select
            value={consultationType}
            onChange={onConsultationTypeChange}
            options={["Video call", "Phone call", "In-person"]}
          />
        </FormField>
      </Grid>

      <FormField label="Lead attorney conducting consultation">
        <Select
          value={attorney}
          onChange={onAttorneyChange}
          options={["Sandra Adeyemi", "Ayo Osei", "Rachel Abubakar"]}
          placeholder="— Select attorney —"
          invalid={touchedField === "attorney"}
        />
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
          <NotifyChip
            active={notifyPortal}
            onClick={() => onNotifyPortalChange(!notifyPortal)}
            icon={<Monitor size={12} />}
          >
            Client portal
          </NotifyChip>
        </HStack>
      </Box>
    </Stack>
  );
}

function ReviewStep({
  lead,
  practiceAreaName,
  date,
  startTime,
  duration,
  consultationType,
  attorney,
}: {
  lead: Lead;
  practiceAreaName: string;
  date: string;
  startTime: string;
  duration: string;
  consultationType: string;
  attorney: string;
}) {
  return (
    <Stack gap="14px" pt="10px">
      <Box p="14px 16px" borderRadius="8px" bg="bg.subtle">
        <SummaryItem label="Lead">{lead.name}</SummaryItem>
        <SummaryItem label="Email">{lead.email}</SummaryItem>
        <SummaryItem label="Practice area">{practiceAreaName}</SummaryItem>
        <SummaryItem label="Date">{date}</SummaryItem>
        <SummaryItem label="Time">{startTime}</SummaryItem>
        <SummaryItem label="Duration">{duration}</SummaryItem>
        <SummaryItem label="Consultation type">{consultationType}</SummaryItem>
        <SummaryItem label="Lead attorney">{attorney}</SummaryItem>
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

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Text m="0 0 6px" color="fg" fontSize="12px" fontWeight="500">
        {label}
      </Text>
      {children}
    </Box>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
  invalid = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <chakra.select
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      {...fieldStyles}
      borderColor={invalid ? invalidColor : "border"}
      cursor="pointer"
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </chakra.select>
  );
}

function NotifyChip({
  active,
  icon,
  children,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <chakra.button
      type="button"
      display="inline-flex"
      alignItems="center"
      gap="6px"
      minH="28px"
      px="10px"
      border="1px solid"
      borderColor={active ? "brand.solid" : "border"}
      borderRadius="999px"
      bg="bg"
      color={active ? "fg" : "fg.muted"}
      fontSize="12px"
      onClick={onClick}
    >
      {icon}
      <Box as="span">{children}</Box>
    </chakra.button>
  );
}

function ReadOnlyField({ label, children }: { label: string; children: ReactNode }) {
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

function SummaryItem({ label, children }: { label: string; children: ReactNode }) {
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
