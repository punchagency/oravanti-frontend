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
  VStack,
  chakra,
} from "@chakra-ui/react";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { MINIMUM_CONSULTATION_FEE } from "@/config/constants";
import { Info, UserPlus, Users, X, Zap } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { updateLead, type Lead, type PaymentTiming } from "@/api/leads";
import type { ConsultationSettings } from "@/api/consultation-settings";
import {
  useCreateLead,
  useInitiateConsultation,
  useLeads,
  useRunConflictCheck,
} from "@/hooks/use-leads";
import { useLeadQuestionnaire } from "@/hooks/use-questionnaires";
import { useConsultationStaff } from "@/hooks/use-consultation-staff";
import {
  useConsultationLocations,
  useConsultationSettings,
  useCreateConsultationLocation,
} from "@/hooks/use-consultation-settings";
import { usePublicPracticeAreas } from "@/hooks/use-public-practice-areas";
import { useResetOnOpen } from "@/hooks/use-reset-on-open";
import type { PublicPracticeArea } from "@/pages/contractor-sign-up/types";
import type { APIError } from "@/hooks/types";
import {
  BrandButton,
  MutedText,
  OutlineButton,
  StatusPill,
} from "@/components/ui/intake-ui";
import { FormSelect } from "@/components/ui/form-select";
import {
  CheckOption,
  ScheduleDetailsStep,
  SelectClientStep,
  StepFieldLabel,
  StepProgress,
  SummaryItem,
} from "../shared/consultation-wizard-shared";
import {
  consultationModeLabel,
  fieldStyles,
  invalidColor,
} from "../shared/consultation-wizard-constants";

// Instant consultation wizard ("Start consultation now"): the consultation
// begins immediately (or as soon as the client pays, for "Pay now") instead of
// being scheduled. Reuses the scheduling wizard's steps, with a client chooser
// up front (existing lead vs brand-new client + inline conflict check) and a
// "Fee & confirm" final step (emergency multiplier + payment timing).

type InstantStep = 0 | 1 | 2 | 3;
type ClientMode = "existing" | "new";
type ConflictState =
  | "idle"
  | "running"
  | "pass"
  | "needs_review"
  | "conflict_found";

const LANGUAGE_OPTIONS = [
  { value: "english", label: "English" },
  { value: "spanish", label: "Spanish" },
  { value: "french", label: "French" },
  { value: "portuguese", label: "Portuguese" },
  { value: "mandarin", label: "Mandarin" },
];

const PAYMENT_TIMING_OPTIONS: {
  value: PaymentTiming;
  label: string;
  description: string;
}[] = [
  {
    value: "pay_now",
    label: "Pay now",
    description:
      "Payment link sent to client immediately. Client pays before consultation begins.",
  },
  {
    value: "invoice_after",
    label: "Invoice after consultation",
    description:
      "Consultation starts immediately. Payment link sent after the call ends.",
  },
  {
    value: "pay_in_person",
    label: "Pay in person",
    description:
      "Client pays at the office. Staff marks payment received manually.",
  },
];

function getCaseTypes(
  practiceAreaId: string,
  practiceAreas: PublicPracticeArea[] | undefined,
): { id: string; name: string }[] {
  if (!practiceAreaId || !practiceAreas) return [];
  const area = practiceAreas.find((a) => a.id === practiceAreaId);
  return area ? area.subcategories.flatMap((s) => s.caseTypes) : [];
}

/**
 * Built per-render: the fee rule depends on the firm's settings, exactly as in
 * the scheduling wizard. Under a flat fee the amount is read-only and the
 * backend ignores anything sent for it, so validating it would block a submit
 * over a value that cannot matter.
 */
const makeInstantSchema = (chargesCustomFee: boolean) =>
  z
  .object({
    clientMode: z.enum(["existing", "new"]),
    selectedLeadId: z.string(),
    // New-client fields
    newName: z.string(),
    newEmail: z.string(),
    newPhone: z.string(),
    newLanguage: z.string(),
    newPracticeAreaId: z.string(),
    newCaseTypeId: z.string(),
    // Details (same shape as the scheduling wizard, urgency implied)
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
    // Fee & confirm
    isEmergency: z.boolean(),
    emergencyMultiplier: z.string(),
    paymentTiming: z.enum(["pay_now", "invoice_after", "pay_in_person"]),
    autoSendQuestionnaire: z.boolean(),
  })
  .superRefine((val, ctx) => {
    if (val.clientMode === "existing" && !val.selectedLeadId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["selectedLeadId"],
        message: "Select a lead",
      });
    }
    if (val.clientMode === "new") {
      if (!val.newName.trim())
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["newName"],
          message: "Full name is required",
        });
      if (!z.string().email().safeParse(val.newEmail.trim()).success)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["newEmail"],
          message: "Enter a valid email address",
        });
      if (!val.newPracticeAreaId)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["newPracticeAreaId"],
          message: "Select a practice area",
        });
      if (!val.newCaseTypeId)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["newCaseTypeId"],
          message: "Select a case type",
        });
    }
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
    if (val.isEmergency) {
      const multiplier = Number(val.emergencyMultiplier);
      if (!multiplier || multiplier <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["emergencyMultiplier"],
          message: "Enter a multiplier greater than zero",
        });
      }
    }
    // Checked against the BASE fee, not the surcharged total: the minimum is a
    // floor on the firm's standard fee, and the multiplier is applied on top.
    if (chargesCustomFee) {
      if (!val.feeAmount.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["feeAmount"],
          message: "Enter the consultation fee",
        });
      } else if (Number(val.feeAmount) < MINIMUM_CONSULTATION_FEE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["feeAmount"],
          message: `Minimum consultation fee amount is $${MINIMUM_CONSULTATION_FEE}.00`,
        });
      }
    }
  });

type InstantForm = z.infer<ReturnType<typeof makeInstantSchema>>;

const INSTANT_DEFAULTS: InstantForm = {
  clientMode: "existing",
  selectedLeadId: "",
  newName: "",
  newEmail: "",
  newPhone: "",
  newLanguage: "english",
  newPracticeAreaId: "",
  newCaseTypeId: "",
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
  isEmergency: false,
  emergencyMultiplier: "2",
  paymentTiming: "pay_now",
  autoSendQuestionnaire: false,
};

/**
 * Self-contained consultation dialog. By default it opens from its children
 * (wrapped in a Chakra Trigger) and owns its open state; pass `open` +
 * `onOpenChange` to control it instead (e.g. opened from a menu item,
 * per the Chakra "dialog from menu" docs pattern).
 *
 * Either way the wizard — and therefore its data queries — first mounts when
 * the dialog opens (`lazyMount`), so a never-opened dialog never hits the
 * API. It then stays mounted (hidden) so reopening is instant; the wizard
 * resets itself on each open via `useResetOnOpen`.
 */
export function InstantConsultationDialog({
  children,
  open: controlledOpen,
  onOpenChange,
  presetLeadId,
}: {
  children?: React.ReactNode;
  /** Pass `open` to control the dialog (e.g. opened from a menu item); omit it for a self-contained trigger. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  presetLeadId?: string;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const handleOpenChange = (next: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => handleOpenChange(details.open)}
      lazyMount
      placement="center"
    >
      {children && <Dialog.Trigger asChild>{children}</Dialog.Trigger>}
      <Dialog.Backdrop bg="rgba(0, 0, 0, 0.46)" />
      <Dialog.Positioner px="16px">
        <InstantConsultationWizard
          open={open}
          close={() => handleOpenChange(false)}
          presetLeadId={presetLeadId}
        />
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

/** Everything the consultation wizard needs lives here so nothing runs before the first open. */
function InstantConsultationWizard({
  open,
  close,
  presetLeadId,
}: {
  open: boolean;
  close: () => void;
  presetLeadId?: string;
}) {
  // A preset lead skips straight to the consultation-details step.
  const [step, setStep] = useState<InstantStep>(presetLeadId ? 2 : 0);
  const [createdLeadId, setCreatedLeadId] = useState<string | null>(null);
  const [conflictState, setConflictState] = useState<ConflictState>("idle");

  // Read before `useForm` because the resolver is built from it.
  const { data: feeSettings, isLoading: settingsLoading } =
    useConsultationSettings();
  const chargesFee = Boolean(feeSettings?.chargesFee);
  const chargesCustomFee =
    chargesFee && feeSettings?.feeStructure === "custom_per_case_type";
  const instantSchema = useMemo(
    () => makeInstantSchema(chargesCustomFee),
    [chargesCustomFee],
  );

  const {
    control,
    setValue,
    trigger,
    getValues,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InstantForm>({
    resolver: zodResolver(instantSchema),
    defaultValues: {
      ...INSTANT_DEFAULTS,
      clientMode: "existing",
      selectedLeadId: presetLeadId ?? "",
    },
    mode: "onChange",
  });

  /*
    Stays mounted between opens — restore pristine defaults on each open.
    Besides the form fields, the wizard carries step-local state that an
    unmount used to clear for free.
  */
  const resetWizard = useCallback(() => {
    reset({
      ...INSTANT_DEFAULTS,
      clientMode: "existing",
      selectedLeadId: presetLeadId ?? "",
    });
    setStep(presetLeadId ? 2 : 0);
    setCreatedLeadId(null);
    setConflictState("idle");
  }, [reset, presetLeadId]);
  useResetOnOpen(open, resetWizard);

  const clientMode = useWatch({ control, name: "clientMode" });
  const selectedLeadId = useWatch({ control, name: "selectedLeadId" });
  const newName = useWatch({ control, name: "newName" });
  const newEmail = useWatch({ control, name: "newEmail" });
  const newPhone = useWatch({ control, name: "newPhone" });
  const newLanguage = useWatch({ control, name: "newLanguage" });
  const newPracticeAreaId = useWatch({ control, name: "newPracticeAreaId" });
  const newCaseTypeId = useWatch({ control, name: "newCaseTypeId" });
  const durationChoice = useWatch({ control, name: "durationChoice" });
  const customDuration = useWatch({ control, name: "customDuration" });
  const consultationType = useWatch({ control, name: "consultationType" });
  const attorneyId = useWatch({ control, name: "attorneyId" });
  const participantIds = useWatch({ control, name: "participantIds" });
  const locationId = useWatch({ control, name: "locationId" });
  const feeAmount = useWatch({ control, name: "feeAmount" });
  // Deliberately not watched: a subscription here would re-render the whole
  // dialog on every keystroke. NotesField owns the value and writes through.
  const notifyEmail = useWatch({ control, name: "notifyEmail" });
  const notifySms = useWatch({ control, name: "notifySms" });
  // Firm-wide text messaging switch; the SMS option stays disabled without it.
  const smsEnabled = feeSettings?.smsEnabled ?? false;
  const isEmergency = useWatch({ control, name: "isEmergency" });
  const emergencyMultiplier = useWatch({
    control,
    name: "emergencyMultiplier",
  });
  const paymentTiming = useWatch({ control, name: "paymentTiming" });
  const autoSendQuestionnaire = useWatch({
    control,
    name: "autoSendQuestionnaire",
  });

  // Stable across renders so the memoized step components can skip re-rendering
  // while the user types (setValue is a stable RHF reference).
  const setField = useCallback(
    <K extends keyof InstantForm>(key: K, value: InstantForm[K]) =>
      setValue(key, value as never, { shouldValidate: true }),
    [setValue],
  );

  // Existing candidates: same pool as the scheduling wizard — conflict-cleared
  // leads (questionnaire stage) plus consultation-stage leads without an
  // active consultation.
  const {
    data: questionnaireData,
    isLoading: questionnaireLeadsLoading,
  } = useLeads({ stage: "questionnaire" });
  const {
    data: consultationData,
    isLoading: consultationLeadsLoading,
  } = useLeads({ stage: "consultation" });
  const leads = useMemo(() => {
    const questionnaireLeads = Array.isArray(questionnaireData)
      ? questionnaireData
      : (questionnaireData?.leads ?? []);
    const consultationLeads = Array.isArray(consultationData)
      ? consultationData
      : (consultationData?.leads ?? []);
    return [
      ...questionnaireLeads,
      ...consultationLeads.filter((l) => !l.consultationId),
    ];
  }, [questionnaireData, consultationData]);

  const { allStaff, attorneys, isLoading: staffLoading } =
    useConsultationStaff();

  const {
    data: locations = [],
    isLoading: locationsLoading,
  } = useConsultationLocations();
  const createLocation = useCreateConsultationLocation();
  const {
    data: practiceAreas,
    isLoading: practiceAreasLoading,
  } = usePublicPracticeAreas();

  // The wizard's steps are driven by these lists; while any is in flight,
  // show a skeleton body instead of empty dropdowns that pop in later.
  const isLoadingData =
    questionnaireLeadsLoading ||
    consultationLeadsLoading ||
    staffLoading ||
    settingsLoading ||
    locationsLoading ||
    practiceAreasLoading;

  const createLead = useCreateLead();
  const runCheck = useRunConflictCheck();
  const initiateConsultation = useInitiateConsultation();

  const selectedLead: Lead | undefined = leads.find(
    (l) => l.id === selectedLeadId,
  );
  const { data: questionnaire } = useLeadQuestionnaire(
    clientMode === "existing" ? selectedLeadId : "",
  );
  const existingLanguage = questionnaire?.send?.language ?? "English";

  const caseTypeOptions = useMemo(
    () => getCaseTypes(newPracticeAreaId, practiceAreas),
    [newPracticeAreaId, practiceAreas],
  );

  // The dropdowns are memoized on their handler identity, so these have to
  // survive a keystroke in the name/email/phone/notes fields unchanged.
  const handleAttorneyChange = useCallback(
    (value: string) => {
      setField("attorneyId", value);
      // The lead attorney can't also be an additional attendee: the picker
      // hides their chip and the API drops the id outright, so don't keep
      // carrying it in the payload.
      const current = getValues("participantIds");
      if (current.includes(value)) {
        setField(
          "participantIds",
          current.filter((id) => id !== value),
        );
      }
    },
    [setField, getValues],
  );
  const handleLocationChange = useCallback(
    (value: string) => setField("locationId", value),
    [setField],
  );
  const handleLanguageChange = useCallback(
    (value: string) => setField("newLanguage", value),
    [setField],
  );
  const handlePracticeAreaChange = useCallback(
    (value: string) => {
      setField("newPracticeAreaId", value);
      setField("newCaseTypeId", "");
    },
    [setField],
  );
  const handleCaseTypeChange = useCallback(
    (value: string) => setField("newCaseTypeId", value),
    [setField],
  );
  // No shouldValidate: notes has no rules, and running the resolver per
  // keystroke would re-render the dialog through the formState subscription.
  const handleNotesChange = useCallback(
    (value: string) => setValue("notes", value),
    [setValue],
  );
  const matterType =
    clientMode === "new"
      ? (caseTypeOptions.find((c) => c.id === newCaseTypeId)?.name ??
        "Not specified")
      : (selectedLead?.caseTypeName ?? "Not specified");
  const clientName =
    clientMode === "new" ? newName.trim() || "—" : (selectedLead?.name ?? "—");
  // A questionnaire can only be auto-sent if the lead never received one.
  const questionnaireAlreadySent =
    clientMode === "existing" && Boolean(selectedLead?.questionnaireSendId);

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
  const locationLabel = locations.find((l) => l.id === locationId)?.label ?? "—";

  // Fee math: the emergency fee is standard × multiplier; the multiplied
  // amount is what gets charged (and persisted as feeAmount).
  const standardFee = chargesCustomFee
    ? Number(feeAmount) || 0
    : (feeSettings?.defaultAmount ?? 0);
  const multiplier = Number(emergencyMultiplier) || 0;
  const emergencyFee = Math.round(standardFee * multiplier * 100) / 100;

  function closeDialog() {
    // Closing unmounts the wizard, which resets it for next time.
    close();
  }

  // Creates the lead on first run (a conflict check needs a lead id); re-runs
  // first sync any edited fields onto the created lead.
  async function handleRunConflictCheck() {
    const ok = await trigger([
      "newName",
      "newEmail",
      "newPracticeAreaId",
      "newCaseTypeId",
    ]);
    if (!ok) return;
    const values = getValues();
    const [firstName = "", ...lastParts] = values.newName.trim().split(" ");
    const lastName = lastParts.join(" ");
    const fields = {
      firstName,
      lastName,
      email: values.newEmail.trim(),
      phone: values.newPhone.trim() || undefined,
      language: values.newLanguage,
      practiceAreaId: values.newPracticeAreaId,
      caseTypeId: values.newCaseTypeId,
    };
    setConflictState("running");
    try {
      let leadId = createdLeadId;
      if (!leadId) {
        const lead = await createLead.mutateAsync({
          ...fields,
          source: "walk_in",
        });
        leadId = lead.id;
        setCreatedLeadId(lead.id);
      } else {
        await updateLead(leadId, fields);
      }
      const check = await runCheck.mutateAsync(leadId);
      setConflictState(check.status === "pending" ? "idle" : check.status);
    } catch (error) {
      setConflictState("idle");
      toast.error(
        (error as APIError).response?.data?.message ??
          "Failed to run the conflict check",
      );
    }
  }

  async function handleContinue() {
    if (step === 1) {
      if (clientMode === "existing") {
        if (await trigger(["selectedLeadId"])) setStep(2);
      } else {
        // New client: gated on a passing conflict check, not just field validity.
        if (conflictState === "pass") setStep(2);
      }
      return;
    }
    if (step === 2) {
      if (await trigger(["customDuration", "attorneyId", "locationId"]))
        setStep(3);
    }
  }

  const onValid = (data: InstantForm) => {
    const leadId =
      data.clientMode === "new" ? createdLeadId : data.selectedLeadId;
    if (!leadId) {
      toast.error("Select or create a client first");
      setStep(data.clientMode === "new" ? 1 : 1);
      return;
    }
    if (data.clientMode === "new" && conflictState !== "pass") {
      toast.error("Run the conflict check before starting the consultation");
      setStep(1);
      return;
    }

    const duration =
      data.durationChoice === "custom"
        ? parseInt(data.customDuration, 10)
        : data.durationChoice;

    // Send the BASE fee, never `emergencyFee`. The backend multiplies by
    // `emergencyMultiplier` itself, so sending the multiplied amount here
    // applied the surcharge twice — base x 2 was charged as base x 4, and the
    // invoice line named the wrong base in its description. `emergencyFee` is
    // for display only (the summary below shows the client what they will owe).
    //
    // Presence and the minimum are the schema's job (see `makeInstantSchema`),
    // so an invalid amount shows as a field error on the fee step rather than
    // as a toast.
    //
    // Only sent when the firm's structure lets staff set it. Echoing the firm
    // default back under a flat fee was harmless while the backend accepted an
    // override from any urgent booking; now that it does not, sending it would
    // just be noise.
    const resolvedFee =
      chargesCustomFee && data.feeAmount.trim()
        ? Number(data.feeAmount)
        : undefined;

    initiateConsultation.mutate(
      {
        id: leadId,
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
          feeAmount: resolvedFee,
          preConsultationNotes: data.notes || undefined,
          // An instant consultation with pay_now and an unpaid fee does NOT
          // begin immediately — it sends a payment link and starts once the
          // client pays. That link is worth texting, which is why SMS is
          // offered here at all.
          notifyChannels: [
            ...(data.notifyEmail ? (["email"] as const) : []),
            ...(data.notifySms ? (["sms"] as const) : []),
          ],
          urgent: true,
          startNow: true,
          paymentTiming: data.paymentTiming,
          isEmergency: data.isEmergency || undefined,
          emergencyMultiplier: data.isEmergency
            ? Number(data.emergencyMultiplier) || undefined
            : undefined,
          autoSendQuestionnaire:
            data.autoSendQuestionnaire && !questionnaireAlreadySent
              ? true
              : undefined,
        },
      },
      { onSuccess: () => closeDialog() },
    );
  };

  const onInvalid = () => {
    if (errors.selectedLeadId || errors.newName || errors.newEmail) setStep(1);
    else if (errors.customDuration || errors.attorneyId || errors.locationId)
      setStep(2);
    else if (errors.emergencyMultiplier || errors.feeAmount) setStep(3);
  };

  const handleConfirm = handleSubmit(onValid, onInvalid);

  const stepTitle =
    presetLeadId
      ? step === 2
        ? "Consultation details"
        : "Fee & confirm"
      : step === 0
        ? "Who is this consultation for?"
        : step === 1
          ? clientMode === "new"
            ? "New client details"
            : "Select client"
          : step === 2
            ? "Consultation details"
            : "Fee & confirm";
  const stepDescription =
    presetLeadId
      ? step === 2
        ? "Step 1 of 2 — Consultation details"
        : "Step 2 of 2 — Review & confirm"
      : step === 0
        ? "Select to get started"
        : step === 1
          ? clientMode === "new"
            ? "Enter details and run a conflict check"
            : "Step 1 of 3 — Select lead"
          : step === 2
            ? "Step 2 of 3 — Consultation details"
            : "Review and begin the consultation";

  return (
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
                  <Box mb="8px">
                    <StatusPill tone="gold" icon={<Zap size={11} />}>
                      Instant consultation
                    </StatusPill>
                  </Box>
                  <Dialog.Title
                    color="fg"
                    fontSize="17px"
                    fontWeight="600"
                    lineHeight="1.2"
                  >
                    {stepTitle}
                  </Dialog.Title>
                  <Dialog.Description
                    mt="6px"
                    color="fg.muted"
                    fontSize="12px"
                    lineHeight="1.45"
                  >
                    {stepDescription}
                  </Dialog.Description>
                </Box>
                <Dialog.CloseTrigger asChild>
                  <chakra.button
                    type="button"
                    aria-label="Close instant consultation"
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

              {step > 0 ? (
                <StepProgress
                  step={presetLeadId ? step - 1 : step}
                  total={presetLeadId ? 2 : 3}
                />
              ) : null}
            </Box>

            <Box flex="1" minH="0" px="24px" pb="20px" overflowY="auto">
              {isLoadingData ? (
                <VStack align="stretch" gap="14px" pt="6px">
                  <ThemeSkeleton h="9px" w="90px" />
                  <ThemeSkeleton h="34px" w="full" borderRadius="7px" />
                  <ThemeSkeleton h="9px" w="70px" />
                  <ThemeSkeleton h="34px" w="full" borderRadius="7px" />
                  <ThemeSkeleton h="120px" w="full" borderRadius="8px" />
                </VStack>
              ) : (
                <>
              {step === 0 ? (
                <ClientModeChooser
                  onChoose={(mode) => {
                    setField("clientMode", mode);
                    setStep(1);
                  }}
                />
              ) : null}
              {step === 1 && clientMode === "existing" ? (
                <SelectClientStep
                  leads={leads}
                  selectedLeadId={selectedLeadId}
                  matterType={matterType}
                  language={existingLanguage}
                  touched={Boolean(errors.selectedLeadId)}
                  onSelect={(leadId) => setField("selectedLeadId", leadId)}
                />
              ) : null}
              {step === 1 && clientMode === "new" ? (
                <NewClientStep
                  name={newName}
                  email={newEmail}
                  phone={newPhone}
                  language={newLanguage}
                  practiceAreaId={newPracticeAreaId}
                  caseTypeId={newCaseTypeId}
                  practiceAreas={practiceAreas ?? []}
                  caseTypeOptions={caseTypeOptions}
                  conflictState={conflictState}
                  errors={{
                    name: Boolean(errors.newName),
                    email: Boolean(errors.newEmail),
                    practiceArea: Boolean(errors.newPracticeAreaId),
                    caseType: Boolean(errors.newCaseTypeId),
                  }}
                  onNameChange={(v) => setField("newName", v)}
                  onEmailChange={(v) => setField("newEmail", v)}
                  onPhoneChange={(v) => setField("newPhone", v)}
                  onLanguageChange={handleLanguageChange}
                  onPracticeAreaChange={handlePracticeAreaChange}
                  onCaseTypeChange={handleCaseTypeChange}
                  onRunConflictCheck={handleRunConflictCheck}
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
                  defaultNotes={getValues("notes")}
                  notifyEmail={notifyEmail}
                  notifySms={notifySms}
                  smsEnabled={smsEnabled}
                  urgent
                  hideUrgent
                  touchedField={
                    errors.customDuration
                      ? "duration"
                      : errors.attorneyId
                        ? "attorney"
                        : errors.locationId
                          ? "location"
                          : null
                  }
                  onUrgentChange={() => undefined}
                  onDurationChoiceChange={(value) =>
                    setField("durationChoice", value)
                  }
                  onCustomDurationChange={(value) =>
                    setField("customDuration", value)
                  }
                  onConsultationTypeChange={(value) =>
                    setField("consultationType", value)
                  }
                  onAttorneyChange={handleAttorneyChange}
                  onParticipantsChange={(value) =>
                    setField("participantIds", value)
                  }
                  onLocationChange={handleLocationChange}
                  onCreateLocation={async (label) => {
                    const created = await createLocation.mutateAsync({ label });
                    setField("locationId", created.id);
                  }}
                  creatingLocation={createLocation.isPending}
                  onNotesChange={handleNotesChange}
                  onNotifyEmailChange={(value) =>
                    setField("notifyEmail", value)
                  }
                  onNotifySmsChange={(value) => setField("notifySms", value)}
                />
              ) : null}
              {step === 3 ? (
                <InstantReviewStep
                  clientName={clientName}
                  matterType={matterType}
                  attorney={attorneyName}
                  consultationType={consultationModeLabel(consultationType)}
                  mode={consultationType}
                  locationLabel={locationLabel}
                  duration={durationLabel}
                  feeSettings={feeSettings ?? null}
                  feeAmount={feeAmount}
                  onFeeAmountChange={(value) => setField("feeAmount", value)}
                  feeError={errors.feeAmount?.message}
                  isEmergency={isEmergency}
                  onEmergencyChange={(value) => setField("isEmergency", value)}
                  emergencyMultiplier={emergencyMultiplier}
                  onEmergencyMultiplierChange={(value) =>
                    setField("emergencyMultiplier", value)
                  }
                  multiplierInvalid={Boolean(errors.emergencyMultiplier)}
                  standardFee={standardFee}
                  emergencyFee={emergencyFee}
                  paymentTiming={paymentTiming}
                  onPaymentTimingChange={(value) =>
                    setField("paymentTiming", value)
                  }
                  autoSendQuestionnaire={autoSendQuestionnaire}
                  onAutoSendQuestionnaireChange={(value) =>
                    setField("autoSendQuestionnaire", value)
                  }
                  questionnaireAlreadySent={questionnaireAlreadySent}
                />
              ) : null}
                </>
              )}
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
              {!presetLeadId && step > 0 ? (
                <OutlineButton
                  onClick={() => setStep((s) => (s - 1) as InstantStep)}
                >
                  Back
                </OutlineButton>
              ) : (
                <Box />
              )}
              <HStack gap="10px">
                <OutlineButton onClick={closeDialog}>Cancel</OutlineButton>
                {step > 0 && step < 3 ? (
                  <BrandButton
                    minW="100px"
                    disabled={
                      step === 1 &&
                      clientMode === "new" &&
                      conflictState !== "pass"
                    }
                    onClick={handleContinue}
                  >
                    Next
                  </BrandButton>
                ) : null}
                {step === 3 ? (
                  <BrandButton
                    minW="180px"
                    loading={initiateConsultation.isPending}
                    onClick={handleConfirm}
                  >
                    <Zap size={14} />
                    Begin consultation
                  </BrandButton>
                ) : null}
              </HStack>
            </Flex>
          </Flex>
        </Dialog.Content>
  );
}

function ClientModeChooser({
  onChoose,
}: {
  onChoose: (mode: ClientMode) => void;
}) {
  return (
    <Grid
      templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }}
      gap="12px"
      pt="12px"
    >
      <ChooserCard
        icon={<Users size={18} />}
        title="Existing lead or client"
        subtitle="Already in the system — search by name"
        onClick={() => onChoose("existing")}
      />
      <ChooserCard
        icon={<UserPlus size={18} />}
        title="New client"
        subtitle="Not yet in the system — new intake"
        onClick={() => onChoose("new")}
      />
    </Grid>
  );
}

function ChooserCard({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <chakra.button
      type="button"
      onClick={onClick}
      p="28px 16px"
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      bg="bg"
      textAlign="center"
      transition="border-color 0.15s ease, box-shadow 0.15s ease"
      _hover={{
        borderColor: "brand.solid",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
      }}
    >
      <Stack gap="10px" align="center">
        <Box
          w="44px"
          h="44px"
          borderRadius="full"
          bg="bg.subtle"
          color="fg"
          display="grid"
          placeItems="center"
        >
          {icon}
        </Box>
        <Text m="0" color="fg" fontSize="14px" fontWeight="600">
          {title}
        </Text>
        <Text m="0" color="fg.muted" fontSize="12px">
          {subtitle}
        </Text>
      </Stack>
    </chakra.button>
  );
}

function NewClientStep({
  name,
  email,
  phone,
  language,
  practiceAreaId,
  caseTypeId,
  practiceAreas,
  caseTypeOptions,
  conflictState,
  errors,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onLanguageChange,
  onPracticeAreaChange,
  onCaseTypeChange,
  onRunConflictCheck,
}: {
  name: string;
  email: string;
  phone: string;
  language: string;
  practiceAreaId: string;
  caseTypeId: string;
  practiceAreas: PublicPracticeArea[];
  caseTypeOptions: { id: string; name: string }[];
  conflictState: ConflictState;
  errors: {
    name: boolean;
    email: boolean;
    practiceArea: boolean;
    caseType: boolean;
  };
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onPracticeAreaChange: (value: string) => void;
  onCaseTypeChange: (value: string) => void;
  onRunConflictCheck: () => void;
}) {
  const blocked =
    conflictState === "needs_review" || conflictState === "conflict_found";

  // Memoized so typing the client's name/email doesn't rebuild these dropdowns'
  // collections on every keystroke.
  const practiceAreaOptions = useMemo(
    () => practiceAreas.map((area) => ({ value: area.id, label: area.name })),
    [practiceAreas],
  );
  const caseTypeSelectOptions = useMemo(
    () => caseTypeOptions.map((ct) => ({ value: ct.id, label: ct.name })),
    [caseTypeOptions],
  );

  return (
    <Stack gap="14px" pt="8px">
      <HStack
        align="flex-start"
        gap="10px"
        p="12px"
        border="1px solid"
        borderColor="#377dff"
        borderRadius="7px"
        bg="#e8f1ff"
        color="#0f4aa8"
        fontSize="11px"
        lineHeight="1.45"
      >
        <Info size={13} />
        <Box>
          This client is not in the system. After the consultation you can mark
          it as completed — a questionnaire can be sent to their email and
          their record is added to the intake pipeline automatically.
        </Box>
      </HStack>

      <Grid
        templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }}
        gap="12px"
      >
        <Box>
          <StepFieldLabel required>Full name</StepFieldLabel>
          <Input
            value={name}
            onChange={(e) => onNameChange(e.currentTarget.value)}
            placeholder="Client full name"
            {...fieldStyles}
            borderColor={errors.name ? invalidColor : "border"}
          />
        </Box>
        <Box>
          <StepFieldLabel required>Email</StepFieldLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.currentTarget.value)}
            placeholder="client@email.com"
            {...fieldStyles}
            borderColor={errors.email ? invalidColor : "border"}
          />
        </Box>
        <Box>
          <StepFieldLabel>Phone</StepFieldLabel>
          <Input
            value={phone}
            onChange={(e) => onPhoneChange(e.currentTarget.value)}
            placeholder="+1 (000) 000-0000"
            {...fieldStyles}
          />
        </Box>
        <Box>
          <StepFieldLabel>Language</StepFieldLabel>
          <FormSelect
            ariaLabel="Language"
            value={language}
            onChange={onLanguageChange}
            options={LANGUAGE_OPTIONS}
          />
        </Box>
      </Grid>

      <Grid
        templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }}
        gap="12px"
      >
        <Box>
          <StepFieldLabel required>Practice area</StepFieldLabel>
          <FormSelect
            ariaLabel="Practice area"
            value={practiceAreaId}
            onChange={onPracticeAreaChange}
            invalid={errors.practiceArea}
            placeholder="Select practice area…"
            options={practiceAreaOptions}
          />
        </Box>
        <Box>
          <StepFieldLabel required>Case type</StepFieldLabel>
          <FormSelect
            ariaLabel="Case type"
            value={caseTypeId}
            onChange={onCaseTypeChange}
            invalid={errors.caseType}
            disabled={!practiceAreaId}
            placeholder={
              practiceAreaId ? "Select case type…" : "Pick a practice area first"
            }
            options={caseTypeSelectOptions}
          />
        </Box>
      </Grid>

      <Box borderTop="1px solid" borderColor="border.subtle" pt="12px">
        {conflictState === "pass" ? (
          <HStack
            gap="8px"
            p="10px 12px"
            border="1px solid"
            borderColor="#00785a"
            borderRadius="8px"
            bg="#d9f8ed"
            color="#00785a"
            fontSize="12px"
          >
            <Info size={14} />
            <Text m="0">Conflict check passed — you can proceed.</Text>
          </HStack>
        ) : blocked ? (
          <HStack
            gap="8px"
            p="10px 12px"
            border="1px solid"
            borderColor="#b00020"
            borderRadius="8px"
            bg="#ffe2e4"
            color="#b00020"
            fontSize="12px"
            align="flex-start"
          >
            <Info size={14} />
            <Text m="0">
              {conflictState === "conflict_found"
                ? "A conflict was found. This consultation cannot proceed until the conflict is resolved in the Conflict check tab."
                : "The conflict check needs review. Resolve it in the Conflict check tab before starting this consultation."}
            </Text>
          </HStack>
        ) : (
          <MutedText>
            A conflict check is required before proceeding. Enter the client
            details above first.
          </MutedText>
        )}
        <Box mt="10px">
          <OutlineButton
            w="full"
            color="#00785a"
            borderColor="#00785a"
            loading={conflictState === "running"}
            onClick={onRunConflictCheck}
          >
            {conflictState === "idle"
              ? "Run conflict check"
              : "Re-run conflict check"}
          </OutlineButton>
        </Box>
      </Box>
    </Stack>
  );
}

function InstantReviewStep({
  clientName,
  matterType,
  attorney,
  consultationType,
  mode,
  locationLabel,
  duration,
  feeSettings,
  feeAmount,
  onFeeAmountChange,
  feeError,
  isEmergency,
  onEmergencyChange,
  emergencyMultiplier,
  onEmergencyMultiplierChange,
  multiplierInvalid,
  standardFee,
  emergencyFee,
  paymentTiming,
  onPaymentTimingChange,
  autoSendQuestionnaire,
  onAutoSendQuestionnaireChange,
  questionnaireAlreadySent,
}: {
  clientName: string;
  matterType: string;
  attorney: string;
  consultationType: string;
  mode: "video" | "in_person" | "phone_call";
  locationLabel: string;
  duration: string;
  feeSettings: ConsultationSettings | null;
  feeAmount: string;
  onFeeAmountChange: (value: string) => void;
  feeError?: string;
  isEmergency: boolean;
  onEmergencyChange: (value: boolean) => void;
  emergencyMultiplier: string;
  onEmergencyMultiplierChange: (value: string) => void;
  multiplierInvalid: boolean;
  standardFee: number;
  emergencyFee: number;
  paymentTiming: PaymentTiming;
  onPaymentTimingChange: (value: PaymentTiming) => void;
  autoSendQuestionnaire: boolean;
  onAutoSendQuestionnaireChange: (value: boolean) => void;
  questionnaireAlreadySent: boolean;
}) {
  const charges = Boolean(feeSettings?.chargesFee);
  const structure = feeSettings?.feeStructure;
  const chargedFee = isEmergency ? emergencyFee : standardFee;

  return (
    <Stack gap="16px" pt="12px">
      <Box p="14px 16px" borderRadius="10px" bg="bg.subtle">
        <SummaryItem label="Client">{clientName}</SummaryItem>
        <SummaryItem label="Matter">{matterType}</SummaryItem>
        <SummaryItem label="Attorney">{attorney}</SummaryItem>
        <SummaryItem label="Type">{consultationType}</SummaryItem>
        {mode === "in_person" ? (
          <SummaryItem label="Location">{locationLabel}</SummaryItem>
        ) : null}
        <SummaryItem label="Duration">{duration}</SummaryItem>
        <SummaryItem label="Fee">
          {charges ? `$${chargedFee}` : "No fee"}
        </SummaryItem>
        <SummaryItem label="Started">Now</SummaryItem>
      </Box>

      {charges ? (
        <Box
          border="1px solid"
          borderColor="brand.solid"
          borderRadius="10px"
          bg="brand.subtle"
          p="14px 16px"
        >
          <Flex align="flex-start" justify="space-between" gap="12px">
            <HStack gap="10px" align="flex-start">
              <Box color="brand.contrast" mt="2px">
                <Zap size={14} />
              </Box>
              <Box>
                <Text m="0" fontSize="13px" fontWeight="600" color="brand.contrast">
                  Mark as emergency consultation
                </Text>
                <Text m="2px 0 0" fontSize="12px" color="brand.fg">
                  Applies an emergency rate multiplier to the consultation fee
                </Text>
              </Box>
            </HStack>
            <Switch.Root
              checked={isEmergency}
              onCheckedChange={(e) => onEmergencyChange(e.checked)}
            >
              <Switch.HiddenInput />
              <Switch.Control bg={isEmergency ? "brand.solid" : undefined}>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </Flex>
          {isEmergency ? (
            <HStack
              mt="12px"
              pt="12px"
              borderTop="1px solid"
              borderColor="brand.solid"
              gap="8px"
              wrap="wrap"
            >
              <Text m="0" fontSize="12px" color="brand.fg">
                Multiplier:
              </Text>
              <Input
                type="number"
                min={1}
                step="0.5"
                value={emergencyMultiplier}
                onChange={(e) =>
                  onEmergencyMultiplierChange(e.currentTarget.value)
                }
                maxW="64px"
                textAlign="center"
                {...fieldStyles}
                w="64px"
                borderColor={multiplierInvalid ? invalidColor : "border"}
              />
              <Text m="0" fontSize="12px" color="brand.fg">
                × Standard fee: ${standardFee} → Emergency fee: $
                {emergencyFee.toFixed(2)}
              </Text>
            </HStack>
          ) : null}
        </Box>
      ) : null}

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
              Pre-set in firm settings
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
                {/*
                  The base fee, always. This used to be replaced by the computed
                  emergency figure whenever the surcharge was on, which meant a
                  firm on per-consultation pricing had no field to type the base
                  into: toggling emergency first left `feeAmount` empty and the
                  submit failed complaining about a box that was not on screen.
                  The surcharged total is spelled out by the emergency row above
                  and echoed after "per session" below.
                */}
                {structure === "custom_per_case_type" ? (
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={feeAmount}
                    onChange={(e) => onFeeAmountChange(e.currentTarget.value)}
                    placeholder={
                      feeSettings?.defaultAmount?.toString() ?? "0.00"
                    }
                    maxW="96px"
                    textAlign="right"
                    aria-invalid={feeError ? true : undefined}
                    {...fieldStyles}
                    {...(feeError
                      ? { borderColor: invalidColor, _focus: undefined }
                      : {})}
                  />
                ) : (
                  <Text fontSize="14px" fontWeight="600" color="fg">
                    {(feeSettings?.defaultAmount ?? 0).toFixed(2)}
                  </Text>
                )}
                <Text fontSize="12px" color="fg.muted">
                  per session
                  {isEmergency ? ` → $${emergencyFee.toFixed(2)} charged` : ""}
                </Text>
              </HStack>
            </Flex>

            {feeError ? (
              <Text
                mt="6px"
                textAlign="right"
                fontSize="12px"
                color={invalidColor}
              >
                {feeError}
              </Text>
            ) : null}

            <Box mt="16px">
              <Text m="0 0 10px" fontSize="13px" fontWeight="600" color="fg">
                Payment timing
              </Text>
              <Stack gap="8px">
                {PAYMENT_TIMING_OPTIONS.map((option) => {
                  const active = paymentTiming === option.value;
                  return (
                    <chakra.button
                      key={option.value}
                      type="button"
                      onClick={() => onPaymentTimingChange(option.value)}
                      display="flex"
                      alignItems="flex-start"
                      gap="10px"
                      p="12px 14px"
                      border="1px solid"
                      borderColor={active ? "brand.solid" : "border"}
                      borderRadius="10px"
                      bg={active ? "brand.subtle" : "bg"}
                      textAlign="left"
                    >
                      <Box
                        mt="2px"
                        w="14px"
                        h="14px"
                        flex="0 0 auto"
                        borderRadius="full"
                        border="1px solid"
                        borderColor={active ? "brand.solid" : "border"}
                        bg="bg"
                        display="grid"
                        placeItems="center"
                      >
                        {active ? (
                          <Box
                            w="7px"
                            h="7px"
                            borderRadius="full"
                            bg="brand.solid"
                          />
                        ) : null}
                      </Box>
                      <Box>
                        <Text m="0" fontSize="13px" fontWeight="600" color="fg">
                          {option.label}
                        </Text>
                        <Text m="2px 0 0" fontSize="12px" color="fg.muted">
                          {option.description}
                        </Text>
                      </Box>
                    </chakra.button>
                  );
                })}
              </Stack>
            </Box>
          </>
        ) : null}
      </Box>

      <Box borderTop="1px solid" borderColor="border.subtle" pt="12px">
        {questionnaireAlreadySent ? (
          <MutedText>
            The intake questionnaire has already been sent to this client.
          </MutedText>
        ) : (
          <CheckOption
            checked={autoSendQuestionnaire}
            onToggle={() =>
              onAutoSendQuestionnaireChange(!autoSendQuestionnaire)
            }
            label={
              <>
                Send intake questionnaire when this consultation is completed{" "}
                <chakra.span color="fg.muted">
                  (uses the client's language)
                </chakra.span>
              </>
            }
          />
        )}
      </Box>
    </Stack>
  );
}
