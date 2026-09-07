import type {
  CaseSection,
  QuestionnaireSendReason,
} from "@/api/questionnaires";
import { useSendCaseQuestionnaire } from "@/hooks/use-case-questionnaire";
import { FormSelect, type FormSelectOption } from "@/components/ui/form-select";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  Field,
  Flex,
  Portal,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";

/**
 * Send the matter's questionnaire to its client.
 *
 * Much smaller than the intake send: the recipient is already known — it is the
 * client on the matter — the questions are already written, and there is no
 * pipeline stage to move. All that is left is which sections they see and how
 * long they get, so that is all this asks.
 *
 * Sections already answered in-house are still sendable. A paralegal filling
 * what they know and asking the client to confirm it is the ordinary way this
 * gets used.
 */

const REMINDERS: FormSelectOption[] = [
  { label: "No reminder", value: "0" },
  { label: "Remind after 3 days", value: "3" },
  { label: "Remind after 7 days", value: "7" },
  { label: "Remind after 14 days", value: "14" },
];

/**
 * Why the client is being asked. Shown to them, so the wording is the wording
 * they read — not internal shorthand.
 */
const REASONS: FormSelectOption[] = [
  { label: "New request", value: "new" },
  { label: "Correction needed", value: "correction" },
  { label: "Needs your attention", value: "attention" },
];

/** What the note is for, per reason. Placeholder text, so it is guidance. */
const NOTE_HINT: Record<string, string> = {
  new: "Anything the client should know before they start (optional)",
  correction: "What needs correcting, and why — the client sees this",
  attention: "What they should look at — the client sees this",
};

const DUE: FormSelectOption[] = [
  { label: "No deadline", value: "0" },
  { label: "Due in 7 days", value: "7" },
  { label: "Due in 14 days", value: "14" },
  { label: "Due in 30 days", value: "30" },
];

export function SendQuestionnaireDialog({
  caseId,
  sections,
  answeredBySection,
  open,
  onOpenChange,
}: {
  caseId: string;
  sections: CaseSection[];
  /** Section id → how many of its questions already have an answer. */
  answeredBySection: Map<string, number>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const send = useSendCaseQuestionnaire(caseId);
  const [selected, setSelected] = useState<string[]>([]);
  const [reminder, setReminder] = useState("7");
  const [reason, setReason] = useState("new");
  const [reasonNote, setReasonNote] = useState("");
  const [due, setDue] = useState("14");

  // Nothing is checked when the dialog opens. Which sections a client should
  // see is a decision about that client — a matter part-answered in-house
  // sends three sections, not twelve — and pre-checking everything turned that
  // decision into a default nobody had to look at. Reset on each open rather
  // than left over from last time, so the previous send cannot silently become
  // this one. Cleared during render off the open flag rather than in an
  // effect, so the first painted frame is already right.
  const [seededWhileOpen, setSeededWhileOpen] = useState(false);
  if (open !== seededWhileOpen) {
    setSeededWhileOpen(open);
    if (open) {
      setSelected([]);
      setReason("new");
      setReasonNote("");
    }
  }

  const allSelected = selected.length === sections.length && sections.length > 0;

  const toggle = (id: string, checked: boolean) =>
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((s) => s !== id),
    );

  const handleSend = async () => {
    await send.mutateAsync({
      // Always the explicit list. It used to send `undefined` for "all", which
      // meant the same thing to the backend but made the request depend on how
      // the boxes happened to add up.
      sectionIds: selected,
      reason: reason as QuestionnaireSendReason,
      reasonNote: reasonNote.trim() || null,
      autoReminderDays: Number(reminder) || null,
      dueInDays: Number(due) || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => onOpenChange(details.open)}
      size="sm"
    >
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            w="full"
            maxW="460px"
            border="1px solid"
            borderColor="border"
            borderRadius="lg"
            bg="bg"
          >
            <Dialog.Header>
              <Dialog.Title fontSize="14px" fontWeight="600">
                Send to the client
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={4} align="stretch">
                <Text fontSize="12px" color="fg.muted" lineHeight="17px">
                  The client gets a link to answer in their own time. Anything
                  already filled in here is shown to them to confirm rather than
                  asked again.
                </Text>

                <Box>
                  <Flex justify="space-between" align="center" gap={2} mb={2}>
                    <Text fontSize="12px" color="fg.muted">
                      Sections to send
                    </Text>
                    {/* Nothing starts checked, so picking every section would
                        otherwise be twelve clicks. Deliberate either way —
                        this is a press, not a default. */}
                    <Button
                      variant="plain"
                      h="auto"
                      p={0}
                      fontSize="12px"
                      fontWeight="400"
                      color="fg.muted"
                      _hover={{ color: "fg" }}
                      onClick={() =>
                        setSelected(
                          allSelected ? [] : sections.map((s) => s.id),
                        )
                      }
                    >
                      {allSelected ? "Clear all" : "Select all"}
                    </Button>
                  </Flex>
                  <VStack
                    gap={0}
                    align="stretch"
                    border="1px solid"
                    borderColor="border"
                    borderRadius="md"
                    maxH="220px"
                    overflowY="auto"
                  >
                    {sections.map((section) => {
                      const answered = answeredBySection.get(section.id) ?? 0;
                      return (
                        <Flex
                          key={section.id}
                          justify="space-between"
                          align="center"
                          gap={3}
                          px={3}
                          py={2.5}
                          borderBottom="1px solid"
                          borderColor="border"
                          _last={{ borderBottom: "none" }}
                        >
                          <Checkbox.Root
                            size="sm"
                            checked={selected.includes(section.id)}
                            onCheckedChange={(d) =>
                              toggle(section.id, Boolean(d.checked))
                            }
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label fontSize="13px" fontWeight="400">
                              {section.title}
                            </Checkbox.Label>
                          </Checkbox.Root>
                          <Text
                            fontSize="11px"
                            color="fg.muted"
                            flexShrink={0}
                            whiteSpace="nowrap"
                          >
                            {answered} of {section.questions.length} answered
                          </Text>
                        </Flex>
                      );
                    })}
                  </VStack>
                </Box>

                {/* Why, before when. A client who has had this link before
                    reads the reason first, so staff choose it first. */}
                <Field.Root>
                  <Field.Label fontSize="12px" color="fg.muted">
                    Reason for sending
                  </Field.Label>
                  <FormSelect
                    options={REASONS}
                    value={reason}
                    onChange={setReason}
                    ariaLabel="Reason for sending"
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label fontSize="12px" color="fg.muted">
                    Message to the client
                    {reason === "new" && (
                      <Text as="span" color="fg.subtle" ml={1}>
                        (optional)
                      </Text>
                    )}
                  </Field.Label>
                  <Textarea
                    value={reasonNote}
                    onChange={(e) => setReasonNote(e.target.value)}
                    placeholder={NOTE_HINT[reason]}
                    rows={3}
                    fontSize="13px"
                    resize="vertical"
                  />
                </Field.Root>

                <Flex gap={3}>
                  <Field.Root flex={1}>
                    <Field.Label fontSize="12px" color="fg.muted">
                      Deadline
                    </Field.Label>
                    <FormSelect
                      options={DUE}
                      value={due}
                      onChange={setDue}
                      ariaLabel="Deadline"
                    />
                  </Field.Root>
                  <Field.Root flex={1}>
                    <Field.Label fontSize="12px" color="fg.muted">
                      Reminder
                    </Field.Label>
                    <FormSelect
                      options={REMINDERS}
                      value={reminder}
                      onChange={setReminder}
                      ariaLabel="Reminder"
                    />
                  </Field.Root>
                </Flex>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer gap={2}>
              <Dialog.ActionTrigger asChild>
                <Button
                  variant="outline"
                  borderColor="border"
                  size="sm"
                  fontSize="12px"
                  h="32px"
                >
                  Cancel
                </Button>
              </Dialog.ActionTrigger>
              <Button
                layerStyle="brand-button"
                size="sm"
                fontSize="12px"
                h="32px"
                disabled={selected.length === 0}
                loading={send.isPending}
                onClick={handleSend}
              >
                Send{selected.length > 0 ? ` ${selected.length} section${selected.length === 1 ? "" : "s"}` : ""}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
