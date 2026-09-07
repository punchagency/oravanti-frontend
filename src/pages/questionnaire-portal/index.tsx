import {
  getQuestionnaireByToken,
  saveDraftByToken,
  submitByToken,
  type PortalQuestion,
  type PortalSection,
} from "@/api/questionnaires";
import { SectionRail } from "@/components/questionnaire/section-rail";
import { SubmitGate } from "@/components/questionnaire/submit-gate";
import { UnsavedBar } from "@/components/questionnaire/unsaved-bar";
import {
  changedEntries,
  useDraftForm,
  type DraftForm,
} from "@/components/questionnaire/use-draft-form";
import { useQuestionnaireLogic } from "@/components/questionnaire/use-questionnaire-logic";
import type { APIError } from "@/hooks/types";
import { fromInputValue, toInputValue } from "@/utils/answer-value";
import {
  Badge,
  Box,
  Button,
  Container,
  Dialog,
  Flex,
  Heading,
  HStack,
  Portal,
  Progress,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useFormState } from "react-hook-form";
import { useParams } from "react-router";
import { toast } from "sonner";

import { QuestionRow } from "./question-row";
import { SendReasonBanner } from "./send-reason-banner";

/**
 * The questionnaire a client fills in.
 *
 * Laid out exactly like the case tab a paralegal works in: a section rail on
 * the left, one section at a time on the right, an explicit Save per section.
 * That is deliberate and it is not only cosmetic — the two are the same
 * document, and every save from either side lands in the same answer set and
 * the same history. A client who saves "Beneficiary details" produces a version
 * the firm reads under that name.
 *
 * Saving a section at a time also matters more here than on the staff side. A
 * client fills this on a phone, in one sitting or six, and the thing that must
 * never happen is finishing a section and losing it. Progress is theirs to keep
 * long before the questionnaire is complete.
 */
export function QuestionnairePortalPage() {
  const { token } = useParams<{ firmSlug: string; token: string }>();
  const queryClient = useQueryClient();

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  /** Answers as typed, keyed by question id. Cleared on save and on discard. */
  const [pendingSectionId, setPendingSectionId] = useState<string | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  // The response row is created lazily by the first save. Tracking the id we
  // get back lets an upload proceed without waiting for a refetch.
  const [savedResponseId, setSavedResponseId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["portal-questionnaire", token],
    queryFn: () => getQuestionnaireByToken(token as string),
    enabled: Boolean(token),
  });

  /** Every section the send carried, before any branch has been applied. */
  const allSections = useMemo(
    () => data?.questionnaire?.sections ?? [],
    [data],
  );

  const questionsById = useMemo(() => {
    const map = new Map<string, PortalSection["questions"][number]>();
    for (const section of allSections) {
      for (const question of section.questions) map.set(question.id, question);
    }
    return map;
  }, [allSections]);

  /** What the server holds, which is what a draft is measured against. */
  const answers = useMemo(() => {
    const map = new Map<string, unknown>();
    for (const answer of data?.response?.answers ?? []) {
      map.set(answer.questionId, answer.value);
    }
    return map;
  }, [data]);

  const uploadedFiles = useMemo(() => {
    const map = new Map<string, string>();
    for (const file of data?.response?.files ?? []) {
      map.set(file.questionId, file.originalFilename);
    }
    return map;
  }, [data]);

  /**
   * Every answer, as one form.
   *
   * Seeded from what is stored, so answers from an earlier sitting appear
   * without a hydration flag deciding when — and a client answering on a
   * phone re-renders one question per keystroke rather than the whole
   * section. See `useDraftForm`.
   *
   * Built from every section, branches included. A field that unregistered
   * itself when its branch closed would lose what the client had typed the
   * moment they changed their mind back, and the rules could no longer read
   * the answer they are conditioned on.
   */
  const stored = useMemo(() => {
    const values: Record<string, string> = {};
    for (const section of allSections) {
      for (const question of section.questions) {
        values[question.id] = toInputValue(answers.get(question.id));
      }
    }
    return values;
  }, [allSections, answers]);

  const form = useDraftForm(stored);

  /**
   * The branches, live as the client types.
   *
   * Everything below counts, gates and renders from `sections` — the sections
   * this set of answers actually puts on screen — so a closed branch is absent
   * from the progress count, from the rail and from the submit gate at the same
   * instant it leaves the page.
   */
  const { sections, hidden, isRequired, withdrawn } = useQuestionnaireLogic({
    rules: data?.questionnaire?.logicRules,
    sections: allSections,
    saved: answers,
    control: form.control,
  });

  // Only `isDirty`, which flips once. The count belongs to `UnsavedBar`.
  const { isDirty } = useFormState({ control: form.control });

  const activeSection: PortalSection | undefined =
    sections.find((s) => s.id === selectedSectionId) ?? sections[0];

  /** Whether one question has been answered. Uploads live outside `answers`. */
  const isAnswered = useCallback(
    (question: PortalQuestion) => {
      if (question.type === "file_upload") return uploadedFiles.has(question.id);
      const value = answers.get(question.id);
      // A repeating answer is a list, and an empty one is not an answer — the
      // progress count is the thing a client reads to decide whether they are
      // finished, so it must not count a question they have not touched.
      if (Array.isArray(value)) return value.length > 0;
      return value != null && value !== "";
    },
    [answers, uploadedFiles],
  );

  const answeredCount = useCallback(
    (section: PortalSection) => section.questions.filter(isAnswered).length,
    [isAnswered],
  );

  const railSections = useMemo(
    () =>
      sections.map((section) => {
        const required = section.questions.filter(isRequired);
        return {
          id: section.id,
          title: section.title,
          answered: answeredCount(section),
          total: section.questions.length,
          requiredAnswered: required.filter(isAnswered).length,
          requiredTotal: required.length,
        };
      }),
    [sections, answeredCount, isAnswered, isRequired],
  );

  /**
   * Every required question on the questionnaire, across all sent sections.
   *
   * Submission is one act for the whole questionnaire, so the gate spans every
   * section rather than the open one — otherwise the button would go live on a
   * finished section while another still had blanks.
   */
  const requiredKeys = useMemo(
    () =>
      sections.flatMap((section) =>
        section.questions
          // Uploads are not draft values — they are files already on the
          // server — so they are counted separately, below.
          .filter((q) => isRequired(q) && q.type !== "file_upload")
          .map((q) => q.id),
      ),
    [sections, isRequired],
  );

  /**
   * Required uploads still missing.
   *
   * Read from what the server holds rather than the form, because an upload
   * lands on the response the moment it finishes rather than waiting for a
   * save. It changes on upload, not on keystroke, so counting it here costs
   * nothing.
   */
  const missingUploads = useMemo(
    () =>
      sections.reduce(
        (sum, section) =>
          sum +
          section.questions.filter(
            (q) =>
              isRequired(q) &&
              q.type === "file_upload" &&
              !uploadedFiles.has(q.id),
          ).length,
        0,
      ),
    [sections, uploadedFiles, isRequired],
  );

  const totals = useMemo(() => {
    const total = sections.reduce((sum, s) => sum + s.questions.length, 0);
    const answered = sections.reduce((sum, s) => sum + answeredCount(s), 0);
    return { answered, total };
  }, [sections, answeredCount]);

  /**
   * The answers a save should carry.
   *
   * What the person changed — minus anything a closed branch has taken off the
   * screen, plus a null for every answer such a branch has withdrawn.
   *
   * The second half is the one that matters. A client who says yes, names an
   * ex-spouse, saves, and then changes to no has left a name on the response;
   * nothing downstream would ever ask why, and `populateCaseForms` matches on
   * field key and would print it on the I-130. The server clears withdrawn
   * answers at submission for exactly this reason — doing it on every save as
   * well is what keeps the firm from reading one in the meantime.
   */
  const changedAnswers = () => [
    ...changedEntries(form)
      .filter(({ key }) => !hidden.has(key))
      .map(({ key, value }) => ({
        questionId: key,
        value: fromInputValue(
          value,
          questionsById.get(key)?.type ?? "short_text",
        ),
      })),
    ...withdrawn.map((questionId) => ({ questionId, value: null })),
  ];

  const refetch = () =>
    queryClient.invalidateQueries({ queryKey: ["portal-questionnaire", token] });

  const saveDraft = useMutation({
    mutationFn: () =>
      saveDraftByToken(token as string, {
        // Named so the firm's history reads "The client saved Beneficiary
        // details" rather than an anonymous count.
        currentSectionId: activeSection?.id ?? null,
        answers: changedAnswers(),
      }),
    onSuccess: (result) => {
      setSavedResponseId(result.id);
      // Clean against what was just sent, so the bar clears immediately
      // instead of waiting on the refetch below.
      form.reset(form.getValues());
      refetch();
      toast.success("Progress saved");
    },
    onError: (err: APIError) =>
      toast.error(err.response?.data?.message ?? "Could not save your progress"),
  });

  const submit = useMutation({
    mutationFn: () =>
      submitByToken(token as string, {
        currentSectionId: activeSection?.id ?? null,
        answers: changedAnswers(),
      }),
    onSuccess: () => {
      form.reset(form.getValues());
      setSubmitted(true);
      setConfirmSubmit(false);
      refetch();
    },
    onError: (err: APIError) => {
      setConfirmSubmit(false);
      toast.error(
        err.response?.data?.message ??
          "Please answer every required question before submitting",
      );
    },
  });

  // A file can only be attached to an existing response, and the response row
  // is only created by a save. So if nothing has been saved yet, create one
  // empty and use the response that comes back. The in-flight promise is held
  // in a ref so two uploads started at once share one save rather than racing
  // to create two responses — read and written inside the callback, never
  // during render.
  const pendingSave = useRef<Promise<string> | null>(null);
  const currentResponseId = data?.response?.id ?? savedResponseId;

  const ensureResponseId = useCallback(async () => {
    if (currentResponseId) return currentResponseId;

    pendingSave.current ??= saveDraftByToken(token as string, { answers: [] })
      .then((result) => {
        setSavedResponseId(result.id);
        return result.id;
      })
      .catch((err) => {
        pendingSave.current = null;
        throw err;
      });

    return pendingSave.current;
  }, [token, currentResponseId]);

  const goToSection = (id: string) => {
    if (id === activeSection?.id) return;
    if (isDirty) {
      setPendingSectionId(id);
      return;
    }
    setSelectedSectionId(id);
  };

  const proceedWithNav = () => {
    if (!pendingSectionId) return;
    setSelectedSectionId(pendingSectionId);
    form.reset();
    setPendingSectionId(null);
  };

  if (isLoading) {
    return (
      <Center>
        <Spinner size="md" />
        <Text mt={3} color="fg.muted" fontSize="14px">
          Loading your questionnaire…
        </Text>
      </Center>
    );
  }

  if (isError || !data) {
    return (
      <Center>
        <Heading size="md">Link not found or expired</Heading>
        <Text mt={2} color="fg.muted" fontSize="14px">
          This questionnaire link is invalid, expired, or has already been
          submitted. Please contact your attorney's office for assistance.
        </Text>
      </Center>
    );
  }

  if (submitted || data.response?.status === "submitted") {
    return (
      <Center>
        <Flex justify="center" color="green.fg">
          <CheckCircle2 size={44} />
        </Flex>
        <Heading size="md" mt={4}>
          Thank you — your answers were submitted
        </Heading>
        <Text mt={2} color="fg.muted" fontSize="14px">
          Your attorney's office has received your questionnaire and will be in
          touch. You can close this window.
        </Text>
      </Center>
    );
  }

  const percentage =
    totals.total === 0
      ? 0
      : Math.round((totals.answered / totals.total) * 100);

  return (
    <Box minH="100dvh" bg="bg.subtle" py={{ base: 6, md: 10 }}>
      <Container maxW="1040px">
        <Flex
          justify="space-between"
          align="flex-start"
          gap={4}
          mb={4}
          flexWrap="wrap"
        >
          <Box>
            <Heading size="lg" color="fg">
              {data.questionnaire?.title ?? "Questionnaire"}
            </Heading>
            <Text fontSize="13px" color="fg.muted" mt={1}>
              {totals.answered} of {totals.total} answered · your answers are
              confidential, and you can save and come back at any time
            </Text>
          </Box>

          <HStack gap={2}>
            <Badge size="sm" variant="subtle" colorPalette="gray" fontSize="10px">
              {percentage}% complete
            </Badge>
            <SubmitGate
              control={form.control}
              requiredKeys={requiredKeys}
              extraMissing={missingUploads}
              isSubmitting={submit.isPending}
              onSubmit={() => setConfirmSubmit(true)}
            />
          </HStack>
        </Flex>

        {data.send && (
          <SendReasonBanner
            reason={data.send.reason}
            note={data.send.reasonNote}
          />
        )}

        <Progress.Root value={percentage} size="xs" colorPalette="blue" mb={5}>
          <Progress.Track>
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>

        <Flex gap={5} align="flex-start" direction={{ base: "column", lg: "row" }}>
          <SectionRail
            items={railSections}
            activeId={activeSection?.id ?? null}
            onSelect={goToSection}
          />

          <Box flex={1} minW={0} w="full">
            {activeSection && (
              <>
                <Text fontSize="14px" fontWeight="500" color="fg" mb={2}>
                  {activeSection.title}
                </Text>
                {activeSection.description && (
                  <Text
                    fontSize="12px"
                    color="fg.muted"
                    lineHeight="17px"
                    mb={3}
                  >
                    {activeSection.description}
                  </Text>
                )}

                <VStack gap={2} align="stretch">
                  {activeSection.questions.map((question) => (
                    <QuestionRow
                      key={question.id}
                      question={question}
                      required={isRequired(question)}
                      control={form.control}
                      disabled={saveDraft.isPending}
                      token={token as string}
                      uploadedFilename={uploadedFiles.get(question.id) ?? null}
                      ensureResponseId={ensureResponseId}
                      onFileUploaded={refetch}
                    />
                  ))}
                </VStack>

                <UnsavedBar
                  control={form.control}
                  noun="answer"
                  saveLabel="Save progress"
                  surface="bg.subtle"
                  isSaving={saveDraft.isPending}
                  onSave={() => saveDraft.mutate()}
                  onDiscard={() => form.reset()}
                />
              </>
            )}
          </Box>
        </Flex>
      </Container>

      <UnsavedAnswersDialog
        open={pendingSectionId !== null}
        control={form.control}
        isSaving={saveDraft.isPending}
        onGoBack={() => setPendingSectionId(null)}
        onDiscard={proceedWithNav}
        onSave={() =>
          saveDraft.mutate(undefined, { onSuccess: proceedWithNav })
        }
      />

      <ConfirmSubmitDialog
        open={confirmSubmit}
        control={form.control}
        remaining={totals.total - totals.answered}
        isSubmitting={submit.isPending}
        onCancel={() => setConfirmSubmit(false)}
        onConfirm={() => submit.mutate()}
      />
    </Box>
  );
}

/**
 * The warning shown when moving between sections would drop unsaved answers.
 *
 * Offers the save as well as the discard: losing the work is almost never what
 * the person meant, and on a phone, mid-form, it is the least recoverable thing
 * this screen can do to somebody.
 */
function UnsavedAnswersDialog({
  open,
  control,
  isSaving,
  onGoBack,
  onDiscard,
  onSave,
}: {
  open: boolean;
  /** The draft form, so the dialog counts what is unsaved itself. */
  control: DraftForm["control"];
  isSaving: boolean;
  onGoBack: () => void;
  onDiscard: () => void;
  onSave: () => void;
}) {
  const { dirtyFields } = useFormState({ control });
  const count = Object.keys(dirtyFields).length;

  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && onGoBack()} size="sm">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header pb={2}>
              <Dialog.Title fontSize="15px" fontWeight="500">
                Unsaved answers
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body pb={4}>
              <Text fontSize="13px" color="fg.muted" lineHeight="18px">
                You have {count} answer{count === 1 ? "" : "s"} here that
                {count === 1 ? " has" : " have"} not been saved. Moving to
                another section now discards {count === 1 ? "it" : "them"}.
              </Text>
            </Dialog.Body>
            <Dialog.Footer pt={0} pb={5}>
              <VStack align="stretch" gap={2} w="full">
                <Button layerStyle="brand-button" size="sm" fontSize="13px" loading={isSaving} onClick={onSave}>
                  Save and continue
                </Button>
                <HStack gap={2} justify="flex-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    fontSize="13px"
                    fontWeight="400"
                    color="fg.error"
                    onClick={onDiscard}
                  >
                    Discard changes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor="border"
                    fontSize="13px"
                    fontWeight="400"
                    onClick={onGoBack}
                  >
                    Go back
                  </Button>
                </HStack>
              </VStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

/**
 * Confirming the submission.
 *
 * Submitting closes the questionnaire to further editing, so it is worth one
 * question — and worth saying plainly how much is still blank, since the count
 * on the rail is easy to miss from the bottom of a long section.
 */
function ConfirmSubmitDialog({
  open,
  control,
  remaining,
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  /** The draft form, so the dialog counts what is unsaved itself. */
  control: DraftForm["control"];
  remaining: number;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { dirtyFields } = useFormState({ control });
  const unsavedCount = Object.keys(dirtyFields).length;

  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && onCancel()} size="sm">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header pb={2}>
              <Dialog.Title fontSize="15px" fontWeight="500">
                Submit your questionnaire
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body pb={4}>
              <VStack align="stretch" gap={2}>
                <Text fontSize="13px" color="fg.muted" lineHeight="18px">
                  Your answers go to your attorney's office and this form closes
                  for editing. If something needs changing afterwards, they can
                  reopen it for you.
                </Text>
                {unsavedCount > 0 && (
                  <Text fontSize="13px" color="fg" lineHeight="18px">
                    The {unsavedCount} answer{unsavedCount === 1 ? "" : "s"} you
                    have just typed {unsavedCount === 1 ? "is" : "are"} included.
                  </Text>
                )}
                {remaining > 0 && (
                  <Text fontSize="13px" color="fg.warning" lineHeight="18px">
                    {remaining} question{remaining === 1 ? " is" : "s are"} still
                    blank. If any of them are required, submitting will tell you
                    which.
                  </Text>
                )}
              </VStack>
            </Dialog.Body>
            <Dialog.Footer pt={0} pb={5} gap={2}>
              <Button
                size="sm"
                variant="outline"
                borderColor="border"
                fontSize="13px"
                fontWeight="400"
                onClick={onCancel}
              >
                Not yet
              </Button>
              <Button
                layerStyle="brand-button"
                size="sm"
                fontSize="13px"
                loading={isSubmitting}
                onClick={onConfirm}
              >
                Submit
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <Flex
      minH="100dvh"
      direction="column"
      align="center"
      justify="center"
      bg="bg.subtle"
      px={6}
    >
      <Box maxW="420px" textAlign="center">
        {children}
      </Box>
    </Flex>
  );
}
