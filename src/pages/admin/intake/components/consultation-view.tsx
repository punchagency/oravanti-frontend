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
  ClipboardCheck,
  Download,
  Info,
  ExternalLink,
  Lock,
  Mail,
  MessageSquare,
  MapPin,
  Monitor,
  Send,
  Video,
  X,
} from "lucide-react";
import { consultations } from "../data";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
  BrandButton,
  CardTitle,
  MutedText,
  OutlineButton,
  StatusPill,
  SurfaceCard,
} from "./intake-ui";

type ScheduleStep = 1 | 2 | 3;
type ScheduleClient = (typeof scheduleClients)[number];

export function ConsultationView() {
  const [scheduleOpen, setScheduleOpen] = useState(false);

  return (
    <>
      <Stack gap="16px" pt="24px" aria-label="Consultation and notes">
        <HStack justify="space-between" gap="16px" wrap="wrap">
          <MutedText fontSize="14px">2 consultations in progress</MutedText>
          <OutlineButton onClick={() => setScheduleOpen(true)}>
            <CalendarDays size={14} />
            Schedule consultation
          </OutlineButton>
        </HStack>

        <Stack gap="16px">
          {consultations.map((consultation) => (
            <SurfaceCard key={consultation.name}>
              <HStack align="center" justify="space-between" gap="16px" wrap="wrap">
                <PersonHeader
                  initials={consultation.initials}
                  avatarTone={consultation.avatarTone}
                  title={consultation.name}
                  subtitle={consultation.matter}
                />
                <HStack gap="8px" wrap="wrap" color="fg.muted" fontSize="12px" justify="flex-end">
                  <StatusPill tone={consultation.statusTone}>{consultation.status}</StatusPill>
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
                    {consultation.mode === "Video call" ? (
                      <Video size={11} />
                    ) : (
                      <MapPin size={11} />
                    )}
                    <Box as="span">{consultation.mode}</Box>
                  </HStack>
                  <Box as="span">{consultation.date}</Box>
                </HStack>
              </HStack>

              <HStack
                align="center"
                justify="space-between"
                gap="16px"
                wrap="wrap"
                mt="16px"
                pt="14px"
                pb="16px"
                borderTop="1px solid"
                borderBottom="1px solid"
                borderColor="border.subtle"
              >
                <HStack gap="12px">
                  <RoundIcon>
                    <ClipboardCheck size={15} />
                  </RoundIcon>
                  <Box>
                    <Text m="0" color="fg" fontSize="13px" fontWeight="500">
                      Questionnaire completed
                    </Text>
                    <MutedText>{consultation.questionnaire}</MutedText>
                  </Box>
                </HStack>
                <LinkButton>View responses</LinkButton>
              </HStack>

              <Box py="16px" borderBottom="1px solid" borderColor="border.subtle">
                <HStack justify="space-between" gap="16px" wrap="wrap">
                  <HStack gap="10px">
                    <Text m="0" color="fg" fontSize="13px" fontWeight="500">
                      Documents
                    </Text>
                    <MutedText>{consultation.documentsReceived}</MutedText>
                  </HStack>
                  <LinkButton>Request missing</LinkButton>
                </HStack>

                <GroupLabel>Uploaded by client</GroupLabel>
                <Stack gap="0">
                  {consultation.uploadedDocuments.map((document) => (
                    <DocumentRow
                      key={document.title}
                      title={document.title}
                      meta={document.meta}
                      received
                      downloadable
                      checkedTone="success"
                    />
                  ))}
                </Stack>

                <GroupLabel>Required — pending receipt</GroupLabel>
                <Stack gap="0">
                  {consultation.requiredDocuments.map((document) => (
                    <DocumentRow
                      key={document.title}
                      title={document.title}
                      meta="Required"
                      received={document.received}
                      checkedTone="warning"
                    />
                  ))}
                </Stack>
                <MutedText>
                  Check the box to manually confirm receipt of documents provided outside the
                  client portal (e.g. in-person, by email, or via scan).
                </MutedText>
              </Box>

              <Stack gap="8px" py="16px" borderBottom="1px solid" borderColor="border.subtle">
                <Box>
                  <Text m="0" color="fg" fontSize="13px" fontWeight="500">
                    Attorney notes
                  </Text>
                  <MutedText>Notes are internal and not visible to the client.</MutedText>
                </Box>
                <Textarea
                  aria-label={`${consultation.name} attorney notes`}
                  defaultValue={consultation.notes}
                  minH="102px"
                  p="12px"
                  borderColor="border"
                  bg="bg"
                  resize="vertical"
                />
                <OutlineButton alignSelf="flex-end">Save notes</OutlineButton>
              </Stack>

              <HStack justify="space-between" gap="16px" wrap="wrap" pt="16px">
                <HStack gap="6px" color="fg.muted" fontSize="12px">
                  <Box
                    display="grid"
                    placeItems="center"
                    w="24px"
                    h="24px"
                    borderRadius="full"
                    bg="bg.subtle"
                    color="fg.muted"
                    fontSize="10px"
                    fontWeight="500"
                  >
                    {consultation.assigneeInitials}
                  </Box>
                  <Box as="span" color="fg.muted">{consultation.assignee}</Box>
                  <Box as="span">(Assigned)</Box>
                </HStack>
                <HStack gap="8px" wrap="wrap" justify="flex-end">
                  <BrandButton>
                    <Send size={14} />
                    Proceed to fee agreement
                  </BrandButton>
                  <OutlineButton>
                    <CalendarDays size={14} />
                    Schedule follow-up
                  </OutlineButton>
                  <OutlineButton>
                    <X size={14} />
                    Close — no case
                  </OutlineButton>
                  <OutlineButton>
                    <ExternalLink size={14} />
                    Refer elsewhere
                  </OutlineButton>
                </HStack>
              </HStack>
            </SurfaceCard>
          ))}
        </Stack>
      </Stack>

      <ScheduleConsultationDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
      />
    </>
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
  const [selectedClientId, setSelectedClientId] = useState("");
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
  const [touchedField, setTouchedField] = useState<"client" | "date" | "attorney" | null>(null);

  const selectedClient = scheduleClients.find((client) => client.id === selectedClientId);
  const selectedDate = date || "2026-06-26";
  const selectedAttorney = attorney || "Sandra Adeyemi";

  function resetDialog() {
    setStep(1);
    setSelectedClientId("");
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

  function showError(message: string) {
    toast.error(message, {
      duration: 3000,
      position: "top-right",
    });
  }

  function handleContinue() {
    if (step === 1) {
      if (!selectedClient) {
        setTouchedField("client");
        showError("Please select a client");
        return;
      }
      setTouchedField(null);
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!date) {
        setTouchedField("date");
        showError("Please select a date");
        return;
      }
      if (!attorney) {
        setTouchedField("attorney");
        showError("Please select an attorney");
        return;
      }
      setTouchedField(null);
      setStep(3);
    }
  }

  function handleConfirm() {
    toast.success(
      `Consultation scheduled for ${selectedClient?.name} on ${selectedDate} at ${startTime}. Client notified. Consultation card created.`,
      {
        duration: 5000,
        position: "top-right",
      },
    );
    closeDialog();
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
                  <Dialog.Title color="fg" fontSize="17px" fontWeight="600" lineHeight="1.2">
                    Schedule consultation
                  </Dialog.Title>
                  <Dialog.Description mt="8px" color="fg.muted" fontSize="12px" lineHeight="1.45">
                    Schedule a consultation with a client who has completed or is completing their questionnaire.
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
                  selectedClientId={selectedClientId}
                  touched={touchedField === "client"}
                  onSelect={(clientId) => {
                    setSelectedClientId(clientId);
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
                    if (value) {
                      setTouchedField(null);
                    }
                  }}
                  onStartTimeChange={setStartTime}
                  onDurationChange={setDuration}
                  onConsultationTypeChange={setConsultationType}
                  onAttorneyChange={(value) => {
                    setAttorney(value);
                    if (value) {
                      setTouchedField(null);
                    }
                  }}
                  onVideoLinkChange={setVideoLink}
                  onNotesChange={setNotes}
                  onNotifyEmailChange={setNotifyEmail}
                  onNotifySmsChange={setNotifySms}
                  onNotifyPortalChange={setNotifyPortal}
                />
              ) : null}
              {step === 3 && selectedClient ? (
                <ReviewStep
                  client={selectedClient}
                  date={selectedDate}
                  startTime={startTime}
                  duration={duration}
                  consultationType={consultationType}
                  attorney={selectedAttorney}
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
                <OutlineButton onClick={() => setStep((currentStep) => (currentStep - 1) as ScheduleStep)}>
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
                <BrandButton minW="180px" onClick={handleConfirm}>
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
    1: "Step 1 of 3 — Select client & matter",
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
  selectedClientId,
  touched,
  onSelect,
}: {
  selectedClientId: string;
  touched: boolean;
  onSelect: (clientId: string) => void;
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
          Only clients who have passed conflict check and are currently in the questionnaire stage are shown. The consultation is the step between questionnaire completion and fee agreement.
        </Box>
      </HStack>

      <Box>
        <Text m="0 0 8px" color="fg" fontSize="12px" fontWeight="500">
          Select client
        </Text>
        <Stack gap="7px">
          {scheduleClients.map((client) => {
            const selected = selectedClientId === client.id;

            return (
              <chakra.button
                key={client.id}
                type="button"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                gap="12px"
                w="full"
                minH="58px"
                p="10px 12px"
                border="1px solid"
                borderColor={selected ? "brand.solid" : touched ? invalidColor : "border"}
                borderRadius="8px"
                bg="bg"
                textAlign="left"
                onClick={() => onSelect(client.id)}
              >
                <HStack gap="12px" minW="0">
                  <SelectionDot selected={selected} />
                  <AvatarPill tone={client.avatarTone}>{client.initials}</AvatarPill>
                  <Box minW="0">
                    <HStack gap="7px" wrap="wrap">
                      <Text m="0" color="fg" fontSize="13px" fontWeight="500">
                        {client.name}
                      </Text>
                      <StatusPill tone={client.practiceTone}>{client.practiceArea}</StatusPill>
                    </HStack>
                    <MutedText>{client.matter}</MutedText>
                  </Box>
                </HStack>
                <HStack gap="5px" justify="flex-end" wrap="wrap">
                  <StatusPill tone={client.statusTone}>{client.status}</StatusPill>
                  {client.language ? <StatusPill tone="neutral">{client.language}</StatusPill> : null}
                </HStack>
              </chakra.button>
            );
          })}
        </Stack>
      </Box>

      {selectedClientId ? (
        <Grid templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }} gap="10px">
          <ReadOnlyField label="Matter type">
            {scheduleClients.find((client) => client.id === selectedClientId)?.matter}
          </ReadOnlyField>
          <ReadOnlyField label="Language">
            {scheduleClients.find((client) => client.id === selectedClientId)?.language || "English"}
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
      <Grid templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }} gap="10px">
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
          <Select value={startTime} onChange={onStartTimeChange} options={["8:00 AM", "9:00 AM", "10:00 AM", "2:00 PM"]} />
        </FormField>
        <FormField label="Duration">
          <Select value={duration} onChange={onDurationChange} options={["30 minutes", "45 minutes", "60 minutes", "90 minutes"]} />
        </FormField>
        <FormField label="Consultation type">
          <Select value={consultationType} onChange={onConsultationTypeChange} options={["Video call", "Phone call", "In-person"]} />
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
        <MutedText>Link will be included in the client's calendar invitation.</MutedText>
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
          <NotifyChip active={notifyEmail} onClick={() => onNotifyEmailChange(!notifyEmail)} icon={<Mail size={12} />}>
            Email
          </NotifyChip>
          <NotifyChip active={notifySms} onClick={() => onNotifySmsChange(!notifySms)} icon={<MessageSquare size={12} />}>
            SMS
          </NotifyChip>
          <NotifyChip active={notifyPortal} onClick={() => onNotifyPortalChange(!notifyPortal)} icon={<Monitor size={12} />}>
            Client portal
          </NotifyChip>
        </HStack>
      </Box>
    </Stack>
  );
}

function ReviewStep({
  client,
  date,
  startTime,
  duration,
  consultationType,
  attorney,
}: {
  client: ScheduleClient;
  date: string;
  startTime: string;
  duration: string;
  consultationType: string;
  attorney: string;
}) {
  return (
    <Stack gap="14px" pt="10px">
      <Box p="14px 16px" borderRadius="8px" bg="bg.subtle">
        <SummaryItem label="Client">{client.name}</SummaryItem>
        <SummaryItem label="Matter type">{client.matter}</SummaryItem>
        <SummaryItem label="Language">{client.language || "English"}</SummaryItem>
        <SummaryItem label="Date">{date}</SummaryItem>
        <SummaryItem label="Time">{startTime}</SummaryItem>
        <SummaryItem label="Duration">{duration}</SummaryItem>
        <SummaryItem label="Consultation type">{consultationType}</SummaryItem>
        <SummaryItem label="Lead attorney">{attorney}</SummaryItem>
      </Box>

      <HStack align="flex-start" gap="10px" p="12px" border="1px solid" borderColor="#377dff" borderRadius="7px" bg="#e8f1ff" color="#0f4aa8" fontSize="12px" lineHeight="1.45">
        <Info size={14} />
        <Box>
          <Text m="0 0 4px" fontSize="12px" fontWeight="500">
            What happens after scheduling:
          </Text>
          <Text m="0">
            1. Client receives a notification via the selected channels.
            <br />
            2. The lead moves to Consultation & Notes stage and a consultation card is created.
            <br />
            3. The assigned attorney sees the consultation in their portal with the client's questionnaire responses and documents ready to review.
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
      <Text m="0 0 5px" color="fg.muted" fontSize="10px" fontWeight="600" textTransform="uppercase">
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
    <Box py="7px" borderBottom="1px solid" borderColor="border.subtle" _last={{ borderBottom: 0 }}>
      <Text m="0 0 4px" color="fg.muted" fontSize="10px" fontWeight="600" textTransform="uppercase">
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

function AvatarPill({ tone, children }: { tone: string; children: ReactNode }) {
  const isBlue = tone === "blue";

  return (
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
      {children}
    </Box>
  );
}

function PersonHeader({
  initials,
  avatarTone,
  title,
  subtitle,
}: {
  initials: string;
  avatarTone: string;
  title: string;
  subtitle: string;
}) {
  return (
    <HStack gap="12px" minW="0">
      <Box
        display="grid"
        placeItems="center"
        flex="0 0 auto"
        w="34px"
        h="34px"
        borderRadius="full"
        bg={avatarTone === "blue" ? "#e5efff" : "#d9f8ed"}
        color={avatarTone === "blue" ? "#1c55b8" : "#00785a"}
        fontSize="11px"
        fontWeight="500"
      >
        {initials}
      </Box>
      <Box>
        <CardTitle>{title}</CardTitle>
        <MutedText>{subtitle}</MutedText>
      </Box>
    </HStack>
  );
}

function RoundIcon({ children }: { children: ReactNode }) {
  return (
    <Box
      display="grid"
      placeItems="center"
      flex="0 0 auto"
      w="32px"
      h="32px"
      borderRadius="full"
      bg="#d9f8ed"
      color="#00785a"
    >
      {children}
    </Box>
  );
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <Text
      mt="14px"
      mb="6px"
      color="fg.muted"
      fontSize="10px"
      fontWeight="500"
      lineHeight="1"
      textTransform="uppercase"
    >
      {children}
    </Text>
  );
}

function LinkButton({ children }: { children: ReactNode }) {
  return (
    <Box
      as="button"
      border="0"
      bg="transparent"
      color="brand.600"
      fontSize="12px"
      fontWeight="500"
    >
      {children}
    </Box>
  );
}

function DocumentRow({
  title,
  meta,
  received,
  downloadable = false,
  checkedTone,
}: {
  title: string;
  meta: string;
  received: boolean;
  downloadable?: boolean;
  checkedTone: "success" | "warning";
}) {
  return (
    <Box
      display="grid"
      gridTemplateColumns={{ base: "auto minmax(0, 1fr) auto", md: "auto minmax(0, 1fr) auto auto" }}
      alignItems="center"
      gap="10px"
      minH="50px"
      py={{ base: "9px", md: "0" }}
      borderBottom="1px solid"
      borderColor="border.subtle"
    >
      <Box
        display="grid"
        placeItems="center"
        w="16px"
        h="16px"
        border="1px solid"
        borderColor={received ? "transparent" : "border"}
        borderRadius="4px"
        bg={received ? (checkedTone === "success" ? "accent.attorney" : "brand.solid") : "bg"}
        color={received && checkedTone === "warning" ? "brand.fg" : "#ffffff"}
      >
        {received ? <Check size={11} /> : null}
      </Box>
      <Box>
        <Text m="0" color="fg" fontSize="13px" fontWeight="500" lineHeight="1.15">
          {title}
        </Text>
        <HStack gap="4px" color="fg.muted" fontSize="12px">
          <Box as="span">{meta}</Box>
          {meta === "Required" ? <Lock size={10} /> : null}
        </HStack>
      </Box>
      <StatusPill tone={received ? "success" : "warning"}>
        {received ? "Received" : "Pending"}
      </StatusPill>
      {downloadable ? (
        <Box
          as="button"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          w="26px"
          h="26px"
          border="0"
          bg="transparent"
          color="fg.muted"
          aria-label={`Download ${title}`}
        >
          <Download size={14} />
        </Box>
      ) : null}
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
  _focus: { borderColor: "brand.solid", boxShadow: "0 0 0 1px var(--brand-cta)" },
};

const scheduleClients = [
  {
    id: "amara-chen",
    initials: "AC",
    avatarTone: "mint",
    name: "Amara Chen",
    practiceArea: "Immigration",
    practiceTone: "success",
    matter: "I-485 — Adjustment of Status",
    status: "Q'naire complete",
    statusTone: "success",
    language: "English",
  },
  {
    id: "david-kim",
    initials: "DK",
    avatarTone: "mint",
    name: "David Kim",
    practiceArea: "Immigration",
    practiceTone: "success",
    matter: "H-1B — Specialty Occupation",
    status: "Q'naire complete",
    statusTone: "success",
    language: "English",
  },
  {
    id: "sofia-reyes",
    initials: "SR",
    avatarTone: "blue",
    name: "Sofia Reyes",
    practiceArea: "Family law",
    practiceTone: "info",
    matter: "Dating Violence Injunction",
    status: "Q'naire in progress",
    statusTone: "warning",
    language: "Español",
  },
  {
    id: "carlos-rivera",
    initials: "CR",
    avatarTone: "blue",
    name: "Carlos Rivera",
    practiceArea: "Family law",
    practiceTone: "info",
    matter: "Child Custody & Parenting Plan",
    status: "Q'naire complete",
    statusTone: "success",
    language: "Español",
  },
] as const;
