import {
  Box,
  chakra,
  Dialog,
  Flex,
  Grid,
  HStack,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  ChevronDown,
  Info,
  Lock,
  Minus,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type {
  CustomDocumentInput,
  CustomQuestionInput,
  SendQuestionnaireConfig,
} from "@/api/questionnaires";
import {
  useCaseTypeQuestionnairePreview,
  useEligibleLeads,
  useQuestionBank,
  useSendQuestionnaireConfigured,
} from "@/hooks/use-questionnaires";
import {
  BrandButton,
  MutedText,
  OutlineButton,
} from "../../../../components/ui/intake-ui";

type WizardStep = 1 | 2 | 3;
type Channel = "email" | "sms";
type ReminderOption = "2" | "3" | "5" | "7" | "never";

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
} as const;

type DraftCustomQuestion = CustomQuestionInput & { label: string };
type DraftCustomDoc = CustomDocumentInput & { label: string };

export function SendQuestionnaireDialog({
  open,
  onOpenChange,
  presetLeadId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetLeadId?: string | null;
}) {
  const [step, setStep] = useState<WizardStep>(1);
  const [leadId, setLeadId] = useState("");
  const [channels, setChannels] = useState<Channel[]>(["email", "sms"]);
  const [reminder, setReminder] = useState<ReminderOption>("3");
  const [customQuestions, setCustomQuestions] = useState<DraftCustomQuestion[]>(
    [],
  );
  const [customDocs, setCustomDocs] = useState<DraftCustomDoc[]>([]);

  const { data: leads = [], isLoading: leadsLoading } = useEligibleLeads(open);
  const selectedLead = leads.find((l) => l.id === leadId) ?? null;
  const send = useSendQuestionnaireConfigured();

  // Pre-select the lead when the wizard is opened from a specific lead card.
  useEffect(() => {
    if (open && presetLeadId) setLeadId(presetLeadId);
  }, [open, presetLeadId]);

  function reset() {
    setStep(1);
    setLeadId("");
    setChannels(["email", "sms"]);
    setReminder("3");
    setCustomQuestions([]);
    setCustomDocs([]);
  }

  function close() {
    onOpenChange(false);
    // Defer reset so the closing animation doesn't flash an empty form.
    setTimeout(reset, 200);
  }

  function handleContinue() {
    if (step === 1) {
      if (!leadId) {
        toast.error("Select a lead to continue");
        return;
      }
      if (channels.length === 0) {
        toast.error("Choose at least one delivery channel");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) setStep(3);
  }

  function handleSend() {
    const config: SendQuestionnaireConfig = {
      deliveryChannels: channels,
      language: "english",
      autoReminderDays:
        reminder === "never"
          ? null
          : (Number(reminder) as 2 | 3 | 5 | 7),
      customQuestions: customQuestions
        .filter((q) => q.label.trim())
        .map((q) => ({ label: q.label.trim(), saveToFirm: q.saveToFirm })),
      customDocumentRequests: customDocs
        .filter((d) => d.label.trim())
        .map((d) => ({ label: d.label.trim(), saveToFirm: d.saveToFirm })),
    };
    send.mutate({ leadId, config }, { onSuccess: close });
  }

  return (
    <Dialog.Root
      open={open}
      lazyMount
      unmountOnExit
      placement="center"
      onOpenChange={(d) => {
        if (d.open) onOpenChange(true);
        else close();
      }}
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
                    Send questionnaire
                  </Dialog.Title>
                  <Dialog.Description
                    mt="8px"
                    color="fg.muted"
                    fontSize="12px"
                    lineHeight="1.45"
                  >
                    Questionnaires are pre-defined by matter type. You can add
                    custom questions but cannot remove standard ones.
                  </Dialog.Description>
                </Box>
                <Dialog.CloseTrigger asChild>
                  <chakra.button
                    type="button"
                    aria-label="Close send questionnaire"
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
                <RecipientStep
                  leads={leads}
                  leadsLoading={leadsLoading}
                  leadId={leadId}
                  matterType={selectedLead?.caseTypeName ?? null}
                  channels={channels}
                  reminder={reminder}
                  onLeadChange={setLeadId}
                  onToggleChannel={(c) =>
                    setChannels((prev) =>
                      prev.includes(c)
                        ? prev.filter((x) => x !== c)
                        : [...prev, c],
                    )
                  }
                  onReminderChange={setReminder}
                />
              ) : null}
              {step === 2 ? (
                <CustomizeStep
                  caseTypeId={selectedLead?.caseTypeId ?? null}
                  customQuestions={customQuestions}
                  customDocs={customDocs}
                  setCustomQuestions={setCustomQuestions}
                  setCustomDocs={setCustomDocs}
                />
              ) : null}
              {step === 3 ? (
                <ReviewStep
                  lead={selectedLead}
                  channels={channels}
                  reminder={reminder}
                  customQuestionCount={
                    customQuestions.filter((q) => q.label.trim()).length
                  }
                  customDocCount={
                    customDocs.filter((d) => d.label.trim()).length
                  }
                />
              ) : null}
            </Box>

            <Flex
              align="center"
              justify="space-between"
              gap="12px"
              p="16px 24px"
              borderTop="1px solid"
              borderColor="border.subtle"
            >
              {step > 1 ? (
                <OutlineButton
                  onClick={() => setStep((s) => (s - 1) as WizardStep)}
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
                  minW="170px"
                  loading={send.isPending}
                  onClick={handleSend}
                >
                  <Send size={14} />
                  Send questionnaire
                </BrandButton>
              )}
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

function StepProgress({ step }: { step: WizardStep }) {
  const labels = {
    1: "Step 1 of 3 — Select recipient & matter type",
    2: "Step 2 of 3 — Review & customize questions",
    3: "Step 3 of 3 — Review & send",
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

function RecipientStep({
  leads,
  leadsLoading,
  leadId,
  matterType,
  channels,
  reminder,
  onLeadChange,
  onToggleChannel,
  onReminderChange,
}: {
  leads: { id: string; name: string; caseTypeName: string | null }[];
  leadsLoading: boolean;
  leadId: string;
  matterType: string | null;
  channels: Channel[];
  reminder: ReminderOption;
  onLeadChange: (id: string) => void;
  onToggleChannel: (c: Channel) => void;
  onReminderChange: (r: ReminderOption) => void;
}) {
  return (
    <Stack gap="16px" pt="8px">
      <HStack
        align="flex-start"
        gap="10px"
        p="12px"
        border="1px solid"
        borderColor="#1f9e75"
        borderRadius="7px"
        bg="#e7f7f0"
        color="#0c5d44"
        fontSize="11px"
        lineHeight="1.4"
      >
        <Info size={13} />
        <Box>
          Only leads who have passed conflict check (ABA 1.7/1.9) are eligible to
          receive a questionnaire. Conflicted leads are excluded from this list.
        </Box>
      </HStack>

      <Field label="Send to (conflict-cleared leads only)">
        <chakra.select
          {...fieldStyles}
          value={leadId}
          onChange={(e) => onLeadChange(e.target.value)}
        >
          <option value="">
            {leadsLoading ? "Loading…" : "— Select a cleared lead —"}
          </option>
          {leads.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
              {l.caseTypeName ? ` — ${l.caseTypeName}` : ""}
            </option>
          ))}
        </chakra.select>
      </Field>

      {leadId ? (
        <Field label="Matter type (auto-populated)">
          <chakra.input
            {...fieldStyles}
            value={matterType ?? "—"}
            readOnly
            disabled
            bg="bg.muted"
            color="fg.muted"
          />
        </Field>
      ) : null}

      <Field label="Send questionnaire in">
        <chakra.select {...fieldStyles} value="english" disabled>
          <option value="english">English</option>
        </chakra.select>
      </Field>

      <Field label="Deliver via">
        <HStack gap="8px">
          {(["email", "sms"] as Channel[]).map((c) => {
            const active = channels.includes(c);
            return (
              <chakra.button
                key={c}
                type="button"
                onClick={() => onToggleChannel(c)}
                px="14px"
                h="34px"
                borderRadius="999px"
                border="1px solid"
                borderColor={active ? "brand.solid" : "border"}
                bg={active ? "brand.solid" : "bg"}
                color={active ? "brand.fg" : "fg.muted"}
                fontSize="12px"
                fontWeight="500"
                textTransform="capitalize"
              >
                {c === "sms" ? "SMS" : "Email"}
              </chakra.button>
            );
          })}
        </HStack>
      </Field>

      <Field label="Auto-reminder if not completed">
        <chakra.select
          {...fieldStyles}
          value={reminder}
          onChange={(e) => onReminderChange(e.target.value as ReminderOption)}
        >
          <option value="2">After 2 days</option>
          <option value="3">After 3 days</option>
          <option value="5">After 5 days</option>
          <option value="7">After 7 days</option>
          <option value="never">Never</option>
        </chakra.select>
      </Field>
    </Stack>
  );
}

function CustomizeStep({
  caseTypeId,
  customQuestions,
  customDocs,
  setCustomQuestions,
  setCustomDocs,
}: {
  caseTypeId: string | null;
  customQuestions: DraftCustomQuestion[];
  customDocs: DraftCustomDoc[];
  setCustomQuestions: React.Dispatch<React.SetStateAction<DraftCustomQuestion[]>>;
  setCustomDocs: React.Dispatch<React.SetStateAction<DraftCustomDoc[]>>;
}) {
  const { data: preview } = useCaseTypeQuestionnairePreview(caseTypeId);
  const [showBank, setShowBank] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const { data: bank = [], isLoading: bankLoading } = useQuestionBank(showBank);

  const addedLabels = useMemo(
    () => new Set(customQuestions.map((q) => q.label.trim())),
    [customQuestions],
  );

  const addSnippet = (label: string) =>
    setCustomQuestions((prev) => [...prev, { label, saveToFirm: false }]);
  const removeSnippet = (label: string) =>
    setCustomQuestions((prev) => {
      const idx = prev.findIndex((q) => q.label.trim() === label.trim());
      if (idx === -1) return prev;
      return prev.filter((_, i) => i !== idx);
    });
  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const [expandStandard, setExpandStandard] = useState(false);

  const standardQuestions = useMemo(
    () =>
      (preview?.sections ?? [])
        .flatMap((s) => s.questions)
        .filter((q) => q.isLocked && q.type !== "file_upload"),
    [preview],
  );
  const requiredDocs = useMemo(
    () =>
      (preview?.sections ?? [])
        .flatMap((s) => s.questions)
        .filter((q) => q.type === "file_upload"),
    [preview],
  );

  const COLLAPSE_AT = 3;
  const visibleStandard = expandStandard
    ? standardQuestions
    : standardQuestions.slice(0, COLLAPSE_AT);
  const hiddenCount = standardQuestions.length - visibleStandard.length;

  return (
    <Stack gap="18px" pt="8px">
      <HStack
        align="flex-start"
        gap="10px"
        p="12px"
        border="1px solid"
        borderColor="#1f9e75"
        borderRadius="7px"
        bg="#e7f7f0"
        color="#0c5d44"
        fontSize="11px"
        lineHeight="1.4"
      >
        <Info size={13} />
        <Box>
          Standard questions below are pre-defined for this matter type and cannot
          be removed. You may add custom questions at the bottom of each section.
        </Box>
      </HStack>

      {/* Standard (locked) questions */}
      <Box>
        <HStack gap="6px" mb="2px" color="fg" fontSize="12px" fontWeight="600" background="bg.muted" padding="1" paddingInline="2">
          <Lock size={12} />
          <Text color="fg.muted">Standard questions ({standardQuestions.length} — locked)</Text>
        </HStack>
        <Stack gap="2px">
          {visibleStandard.map((q) => (
            <HStack key={q.id} align="flex-start" gap="8px" py="4px" px="8px">
              <Box pt="2px" color="fg.muted">
                <Lock size={10} />
              </Box>
              <Text fontSize="12px" color="fg.muted" lineHeight="1.4">
                {q.label}
              </Text>
            </HStack>
          ))}
        </Stack>
        {hiddenCount > 0 ? (
          <chakra.button
            type="button"
            onClick={() => setExpandStandard(true)}
            mt="4px"
            fontSize="11px"
            fontWeight="500"
            color="fg.subtle"
            textAlign="left"
          >
            … and {hiddenCount} more standard question
            {hiddenCount === 1 ? "" : "s"} (click to expand)
          </chakra.button>
        ) : standardQuestions.length > COLLAPSE_AT ? (
          <chakra.button
            type="button"
            onClick={() => setExpandStandard(false)}
            mt="4px"
            fontSize="11px"
            fontWeight="500"
            color="fg.muted"
            textAlign="left"
          >
            Show fewer
          </chakra.button>
        ) : null}
      </Box>

      {/* Add custom questions */}
      <Box>
        <Text fontSize="12px" fontWeight="600" color="fg" mb="8px">
          Add custom questions
        </Text>
        <Stack gap="8px">
          {customQuestions.map((q, i) => (
            <DraftRow
              key={i}
              value={q.label}
              placeholder="What is your question?"
              saveToFirm={q.saveToFirm ?? false}
              onChange={(label) =>
                setCustomQuestions((prev) =>
                  prev.map((x, idx) => (idx === i ? { ...x, label } : x)),
                )
              }
              onToggleSave={() =>
                setCustomQuestions((prev) =>
                  prev.map((x, idx) =>
                    idx === i ? { ...x, saveToFirm: !x.saveToFirm } : x,
                  ),
                )
              }
              onRemove={() =>
                setCustomQuestions((prev) => prev.filter((_, idx) => idx !== i))
              }
            />
          ))}
          <DashedButton
            onClick={() =>
              setCustomQuestions((prev) => [
                ...prev,
                { label: "", saveToFirm: false },
              ])
            }
          >
            <Plus size={14} />
            Add custom question
          </DashedButton>
          <DashedButton
            milky
            onClick={() => setShowBank((v) => !v)}
          >
            {showBank ? "Hide question snippets" : "Browse question snippets"}
          </DashedButton>
        </Stack>

        {showBank ? (
          <Box
            mt="10px"
            borderRadius="9px"
            bg="bg.muted"
            border="1px solid"
            borderColor="border.subtle"
            p="10px"
          >
            <Text
              fontSize="10px"
              fontWeight="600"
              color="fg.muted"
              textTransform="uppercase"
              letterSpacing="0.06em"
              mb="8px"
            >
              Question snippets — click to add
            </Text>

            {bankLoading ? (
              <HStack justify="center" gap="8px" py="20px" color="fg.muted">
                <Spinner size="sm" />
                <MutedText fontSize="12px">Loading snippets…</MutedText>
              </HStack>
            ) : bank.length === 0 ? (
              <MutedText fontSize="12px">No snippets available.</MutedText>
            ) : (
              <Stack gap="6px" maxH="220px" overflowY="auto">
                {bank.map((entry) => {
                  const isOpen = openGroups.has(entry.caseTypeId);
                  return (
                    <Box
                      key={entry.caseTypeId}
                      borderRadius="7px"
                      bg="bg"
                      border="1px solid"
                      borderColor="border.subtle"
                    >
                      <HStack
                        justify="space-between"
                        gap="8px"
                        px="10px"
                        py="8px"
                      >
                        <Text
                          fontSize="12px"
                          fontWeight="600"
                          color="fg"
                          truncate
                        >
                          {entry.caseTypeName ?? "General"}
                        </Text>
                        <HStack gap="6px" flex="0 0 auto">
                          <chakra.button
                            type="button"
                            onClick={() =>
                              entry.questions.forEach((q) => {
                                if (!addedLabels.has(q.label.trim()))
                                  addSnippet(q.label);
                              })
                            }
                            px="10px"
                            h="26px"
                            borderRadius="6px"
                            border="1px solid"
                            borderColor="border"
                            bg="bg"
                            color="fg"
                            fontSize="11px"
                            fontWeight="500"
                          >
                            Add all
                          </chakra.button>
                          <chakra.button
                            type="button"
                            aria-label="Toggle questions"
                            onClick={() => toggleGroup(entry.caseTypeId)}
                            display="grid"
                            placeItems="center"
                            w="26px"
                            h="26px"
                            borderRadius="6px"
                            border="1px solid"
                            borderColor="border"
                            bg="bg"
                            color="fg.muted"
                          >
                            <ChevronDown
                              size={14}
                              style={{
                                transform: isOpen ? "rotate(180deg)" : undefined,
                                transition: "transform 0.15s",
                              }}
                            />
                          </chakra.button>
                        </HStack>
                      </HStack>

                      {isOpen ? (
                        <Stack
                          gap="0"
                          borderTop="1px solid"
                          borderColor="border.subtle"
                        >
                          {entry.questions.map((q, i) => {
                            const added = addedLabels.has(q.label.trim());
                            return (
                              <HStack
                                key={`${entry.caseTypeId}-${i}`}
                                justify="space-between"
                                gap="8px"
                                px="10px"
                                py="7px"
                                borderTop={i === 0 ? undefined : "1px solid"}
                                borderColor="border.subtle"
                              >
                                <Text
                                  fontSize="12px"
                                  color="fg.muted"
                                  lineHeight="1.35"
                                >
                                  {q.label}
                                </Text>
                                <chakra.button
                                  type="button"
                                  flex="0 0 auto"
                                  onClick={() =>
                                    added
                                      ? removeSnippet(q.label)
                                      : addSnippet(q.label)
                                  }
                                  display="grid"
                                  placeItems="center"
                                  w="24px"
                                  h="24px"
                                  borderRadius="6px"
                                  border="1px solid"
                                  borderColor={added ? "#e0796f" : "brand.solid"}
                                  bg={added ? "#fdecea" : "bg"}
                                  color={added ? "#c0392b" : "brand.solid"}
                                  aria-label={added ? "Remove" : "Add"}
                                >
                                  {added ? (
                                    <Minus size={13} />
                                  ) : (
                                    <Plus size={13} />
                                  )}
                                </chakra.button>
                              </HStack>
                            );
                          })}
                        </Stack>
                      ) : null}
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
        ) : null}
      </Box>

      {/* Required documents (pre-defined) */}
      {requiredDocs.length ? (
        <Box>
          <HStack gap="6px" mb="8px" color="fg" fontSize="12px" fontWeight="600">
            <Lock size={12} />
            <Text>Required documents ({requiredDocs.length})</Text>
          </HStack>
          <Stack gap="2px">
            {requiredDocs.map((d) => (
              <HStack key={d.id} align="flex-start" gap="8px" py="6px">
                <Box pt="2px" color="fg.muted">
                  <Lock size={11} />
                </Box>
                <Text fontSize="12px" color="fg.muted" lineHeight="1.4">
                  {d.label}
                </Text>
              </HStack>
            ))}
          </Stack>
        </Box>
      ) : null}

      {/* Add custom document requests */}
      <Box>
        <Stack gap="8px">
          {customDocs.map((d, i) => (
            <DraftRow
              key={i}
              value={d.label}
              placeholder="e.g. Lease agreement"
              saveToFirm={d.saveToFirm ?? false}
              onChange={(label) =>
                setCustomDocs((prev) =>
                  prev.map((x, idx) => (idx === i ? { ...x, label } : x)),
                )
              }
              onToggleSave={() =>
                setCustomDocs((prev) =>
                  prev.map((x, idx) =>
                    idx === i ? { ...x, saveToFirm: !x.saveToFirm } : x,
                  ),
                )
              }
              onRemove={() =>
                setCustomDocs((prev) => prev.filter((_, idx) => idx !== i))
              }
            />
          ))}
          <DashedButton
            onClick={() =>
              setCustomDocs((prev) => [
                ...prev,
                { label: "", saveToFirm: false },
              ])
            }
          >
            <Plus size={14} />
            Add custom document request
          </DashedButton>
        </Stack>
      </Box>
    </Stack>
  );
}

function DashedButton({
  children,
  milky,
  onClick,
}: {
  children: React.ReactNode;
  milky?: boolean;
  onClick: () => void;
}) {
  return (
    <chakra.button
      type="button"
      onClick={onClick}
      display="flex"
      alignItems="center"
      justifyContent="center"
      gap="6px"
      w="full"
      h="36px"
      borderRadius="8px"
      border="1px dashed"
      borderColor="border"
      bg={milky ? "bg.muted" : "bg"}
      color="fg.muted"
      fontSize="12px"
      fontWeight="500"
      _hover={{ borderColor: "brand.solid", color: "fg" }}
    >
      {children}
    </chakra.button>
  );
}

function DraftRow({
  value,
  placeholder,
  saveToFirm,
  onChange,
  onToggleSave,
  onRemove,
}: {
  value: string;
  placeholder: string;
  saveToFirm: boolean;
  onChange: (v: string) => void;
  onToggleSave: () => void;
  onRemove: () => void;
}) {
  return (
    <HStack gap="8px">
      <chakra.input
        {...fieldStyles}
        flex="1"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <chakra.button
        type="button"
        onClick={onToggleSave}
        title="Save to firm template for future sends"
        h="34px"
        px="10px"
        borderRadius="7px"
        border="1px solid"
        borderColor={saveToFirm ? "brand.solid" : "border"}
        bg={saveToFirm ? "brand.solid" : "bg"}
        color={saveToFirm ? "brand.fg" : "fg.muted"}
        fontSize="11px"
        fontWeight="500"
        whiteSpace="nowrap"
      >
        Save to firm
      </chakra.button>
      <chakra.button
        type="button"
        aria-label="Remove"
        onClick={onRemove}
        display="grid"
        placeItems="center"
        h="34px"
        w="34px"
        borderRadius="7px"
        border="1px solid"
        borderColor="border"
        bg="bg"
        color="fg.muted"
      >
        <Trash2 size={14} />
      </chakra.button>
    </HStack>
  );
}

function ReviewStep({
  lead,
  channels,
  reminder,
  customQuestionCount,
  customDocCount,
}: {
  lead: { name: string; caseTypeName: string | null } | null;
  channels: Channel[];
  reminder: ReminderOption;
  customQuestionCount: number;
  customDocCount: number;
}) {
  const rows: [string, string][] = [
    ["Recipient", lead?.name ?? "—"],
    ["Matter type", lead?.caseTypeName ?? "—"],
    ["Language", "English"],
    [
      "Deliver via",
      channels.map((c) => (c === "sms" ? "SMS" : "Email")).join(", ") || "—",
    ],
    [
      "Auto-reminder",
      reminder === "never" ? "Never" : `After ${reminder} days`,
    ],
    ["Custom questions added", String(customQuestionCount)],
    ["Custom document requests", String(customDocCount)],
  ];

  return (
    <Stack gap="14px" pt="8px">
      <Box border="1px solid" borderColor="border" borderRadius="9px" bg="bg.subtle" overflow="hidden">
        {rows.map(([label, value], i) => (
          <Flex
            key={label}
            justify="space-between"
            gap="16px"
            px="14px"
            py="10px"
            borderTop={i === 0 ? undefined : "1px solid"}
            borderColor="border.subtle"
          >
            <Text fontSize="10px" fontWeight="600" color="fg.muted" textTransform="uppercase">
              {label}
            </Text>
            <Text fontSize="12px" color="fg" textAlign="right">
              {value}
            </Text>
          </Flex>
        ))}
      </Box>

      <Box
        p="12px"
        borderRadius="9px"
        border="1px solid"
        borderColor="border.subtle"
        bg="bg"
      >
        <Text fontSize="10px" fontWeight="600" color="fg.muted" textTransform="uppercase" mb="6px">
          Client notification preview
        </Text>
        <MutedText fontSize="12px">
          Hi {lead?.name ?? "there"}, your attorney's office has sent you an
          intake questionnaire for your {lead?.caseTypeName ?? "matter"}. Please
          complete it via the secure link at your earliest convenience. All
          responses are confidential and secured.
        </MutedText>
      </Box>
    </Stack>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Text fontSize="12px" fontWeight="500" color="fg" mb="6px">
        {label}
      </Text>
      {children}
    </Box>
  );
}
