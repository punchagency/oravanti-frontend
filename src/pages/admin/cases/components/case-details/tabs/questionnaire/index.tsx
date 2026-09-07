import type { CaseQuestion, CaseSection } from "@/api/questionnaires";
import {
  QuestionDialog,
  type QuestionDialogSubmit,
} from "@/components/questionnaire/question-dialog";
import { SectionDialog } from "@/components/questionnaire/section-dialog";
import { SectionRail } from "@/components/questionnaire/section-rail";
import { useQuestionnaireLogic } from "@/components/questionnaire/use-questionnaire-logic";
import {
  changedEntries,
  useDraftForm,
  type DraftForm,
} from "@/components/questionnaire/use-draft-form";
import { useCaseFieldFeeds } from "@/hooks/use-case-details";
import {
  useAddCaseQuestion,
  useAddCaseSection,
  useCaseQuestionnaire,
  useCaseResponse,
  useDeleteCaseSection,
  useDeleteQuestion,
  useSaveCaseAnswers,
  useUpdateCaseSection,
  useUpdateQuestion,
} from "@/hooks/use-case-questionnaire";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import useUnsavedChangesPrompt from "@/hooks/useUnsavedChangesPrompt";
import { fromInputValue, toInputValue } from "@/utils/answer-value";
import {
  Alert,
  Badge,
  Box,
  Button,
  type ButtonProps,
  Dialog,
  Flex,
  HStack,
  Portal,
  Progress,
  SegmentGroup,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { CheckCircle2, History, Lock, PenLine, Plus, Send } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useFormState } from "react-hook-form";

import { AnswerHistoryDialog } from "./answer-history-dialog";
import { HistoryPanel } from "./history-panel";
import { IntakeAnswers } from "./intake-answers";
import { SectionEditor } from "./section-editor";
import { SendQuestionnaireDialog } from "./send-dialog";

/**
 * How a toolbar control shares the row.
 *
 * `1 1 140px` is a basis wide enough for the longest label — "Lock answers" —
 * so a wrapped row is buttons of a readable width rather than five slivers.
 */
const TOOLBAR_FLEX = { base: "1 1 140px", md: "0 0 auto" };

/**
 * One control in the questionnaire's toolbar.
 *
 * The four outline buttons carried the same eight style props each, which is
 * also why the row had no single answer to what it should do on a phone. Here
 * that answer lives in one place.
 */
function TabAction(props: ButtonProps) {
  return (
    <Button
      size="xs"
      variant="outline"
      borderColor="border"
      h="36px"
      fontSize="13px"
      fontWeight="400"
      color="fg.muted"
      px={4}
      flex={TOOLBAR_FLEX}
      {...props}
    />
  );
}

/**
 * The matter's questionnaire — the substantive one, whose answers fill the
 * forms.
 *
 * Laid out as a working surface rather than a wizard: a section rail on the
 * left, one section's questions on the right, saved a section at a time.
 * Intake's send flow is a wizard because it is composed once and sent; this is
 * opened dozens of times across the life of a matter and edited a field at a
 * time, so stepping through twelve sections to correct one date would be the
 * wrong shape entirely.
 *
 * ─── Where drafts live ──────────────────────────────────────────────────────
 *
 * Here, not in the rows. Two things need to know what is unsaved and neither is
 * a row: the Save button, which works on a whole section, and the navigation
 * guard, which has to answer "is anything unsaved?" before letting someone
 * leave. Keeping the map at this level makes both a read of the same state
 * rather than something reassembled from children.
 */
export function QuestionnaireTab({
  caseId,
  isActive,
}: {
  caseId: string;
  isActive: boolean;
}) {
  const { data, isLoading } = useCaseQuestionnaire(caseId, isActive);
  const { data: response } = useCaseResponse(caseId, isActive);
  const { data: fieldFeeds } = useCaseFieldFeeds(caseId, isActive);
  const saveAnswers = useSaveCaseAnswers(caseId);
  const deleteQuestion = useDeleteQuestion(caseId);
  const addQuestion = useAddCaseQuestion(caseId);
  const updateQuestion = useUpdateQuestion(caseId);
  const addSection = useAddCaseSection(caseId);
  const updateSection = useUpdateCaseSection(caseId);
  const deleteSection = useDeleteCaseSection(caseId);
  const { showConfirm } = useConfirmDialog();

  const [view, setView] = useState("questionnaire");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  /**
   * Whether staff are answering on the client's behalf.
   *
   * Off by default, and deliberately so: the client owns their answers. Staff
   * still need a way in — an intake taken over the phone, or answers read off
   * documents already on file — but it is an explicit act, not the resting
   * state of the screen. The backend records who did it via `filledById`.
   */
  const [fillMode, setFillMode] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [answerHistoryFor, setAnswerHistoryFor] = useState<string | null>(null);


  // Where the person was going when the guard stopped them, so accepting the
  // warning can complete the move rather than merely dismissing the dialog.
  const [pendingNav, setPendingNav] = useState<
    { kind: "section"; id: string } | { kind: "view"; value: string } | null
  >(null);

  // `null` means the dialog is closed; a question means edit, `"new"` means
  // add. One piece of state rather than an open flag plus a target, so the two
  // can never disagree about what is being edited.
  const [questionTarget, setQuestionTarget] = useState<
    CaseQuestion | "new" | null
  >(null);
  const [sectionTarget, setSectionTarget] = useState<CaseSection | "new" | null>(
    null,
  );

  /** Every section on the questionnaire, before any branch has been applied. */
  const allSections = useMemo(() => data?.sections ?? [], [data]);

  const questionsById = useMemo(() => {
    const map = new Map<string, CaseQuestion>();
    for (const section of allSections) {
      for (const question of section.questions) map.set(question.id, question);
    }
    return map;
  }, [allSections]);

  const answers = useMemo(() => {
    const map = new Map<string, unknown>();
    for (const answer of response?.answers ?? []) {
      map.set(answer.questionId, answer.value);
    }
    return map;
  }, [response]);


  /**
   * Every answer on the questionnaire, as one form.
   *
   * The whole questionnaire rather than the open section, so switching
   * sections keeps what has been typed in the others — the guard below is what
   * makes sure none of it is lost quietly.
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
   * The branches, applied here exactly as they are in the client portal.
   *
   * The two are the same document — a paralegal filling in on the phone must
   * see what the client sees, and must not type into a question the rules have
   * withdrawn, because the server would drop that answer at submission and
   * never carry it onto a form.
   */
  const { sections, hidden, isRequired, withdrawn } = useQuestionnaireLogic({
    rules: data?.logicRules,
    sections: allSections,
    saved: answers,
    control: form.control,
  });

  const activeSection: CaseSection | undefined =
    sections.find((s) => s.id === selectedSectionId) ?? sections[0];

  // Only `isDirty`, deliberately. It flips once, so this container re-renders
  // once — reading `dirtyFields` here would re-render it on every keystroke,
  // and the rows with it. The count belongs to `UnsavedBar`, which is a leaf.
  const { isDirty } = useFormState({ control: form.control });

  // Leaving the page is a route change, which the app already guards centrally.
  useUnsavedChangesPrompt({
    when: isDirty,
    title: "Unsaved answers",
    description:
      "Some answers on this questionnaire have not been saved. Leaving now discards them.",
  });

  /** Whether one question has been answered, as stored — not as typed. */
  const isAnswered = useCallback(
    (question: CaseQuestion) => {
      const value = answers.get(question.id);
      return value != null && value !== "";
    },
    [answers],
  );

  /**
   * The rail's own shape — a title and two pairs of numbers, not a section.
   *
   * The required pair is what earns the done mark: a section whose optional
   * questions are still blank is finished as far as filing is concerned.
   */
  const railSections = useMemo(
    () =>
      sections.map((section) => {
        const required = section.questions.filter(isRequired);
        return {
          id: section.id,
          title: section.title,
          answered: section.questions.filter(isAnswered).length,
          total: section.questions.length,
          requiredAnswered: required.filter(isAnswered).length,
          requiredTotal: required.length,
        };
      }),
    [sections, isAnswered, isRequired],
  );

  /**
   * The active section's counts, for the bar above its questions.
   *
   * Taken from the rail's entries rather than counted again, so the bar and
   * the rail can never disagree about the same section.
   */
  const activeCompletion = useMemo(
    () => railSections.find((section) => section.id === activeSection?.id),
    [railSections, activeSection],
  );

  /** The send dialog wants the counts keyed by id; the rail already has them. */
  const answeredBySection = useMemo(
    () => new Map(railSections.map((section) => [section.id, section.answered])),
    [railSections],
  );

  /**
   * What each question fills, keyed by question id.
   *
   * Built from the field map so the questionnaire can say "fills I-485 · Date
   * of Birth" without re-deriving the shared-key rule the backend already
   * applied. One source of truth for a question whose answer has two homes.
   */
  const feedsByQuestion = useMemo(() => {
    const map = new Map<string, string>();
    for (const form of fieldFeeds?.forms ?? []) {
      for (const field of form.fields) {
        if (!field.question) continue;
        const existing = map.get(field.question.id);
        const label = `${form.formCode} · ${field.label}`;
        map.set(field.question.id, existing ? `${existing}, ${label}` : label);
      }
    }
    return map;
  }, [fieldFeeds]);



/*
    Deletions ask first, always.

    Every one of these takes answers with it, and none of them is undoable —
    a section carries its questions, a question carries whatever the client
    already told us. The icons sit inches from Edit on a dense row, which is
    exactly the arrangement a mis-click finds.
  */
  const confirmDeleteSection = (section: CaseSection) =>
    showConfirm({
      title: "Delete section",
      description: `"${section.title}" and its ${section.questions.length} question${section.questions.length === 1 ? "" : "s"} will be removed from this matter, along with any answers already given. This cannot be undone.`,
      confirmLabel: "Delete section",
      cancelLabel: "Cancel",
      onConfirm: () => deleteSection.mutate(section.id),
    });

  const confirmDeleteQuestion = (questionId: string) => {
    const question = questionsById.get(questionId);
    if (!question) return;

    showConfirm({
      title: "Delete question",
      description: `"${question.label}" will be removed from this matter, along with any answer already given. This cannot be undone.`,
      confirmLabel: "Delete question",
      cancelLabel: "Cancel",
      onConfirm: () => deleteQuestion.mutate(questionId),
    });
  };

  /**
   * Leaving fill mode throws away anything typed and not saved, so it asks
   * first — the same courtesy the navigation guard gives, for the same reason.
   */
  const leaveFillMode = () => {
    if (!isDirty) {
      setFillMode(false);
      return;
    }

    showConfirm({
      title: "Discard unsaved answers",
      description:
        "You have answers on this section that have not been saved. Locking the questionnaire now discards them.",
      confirmLabel: "Discard and lock",
      cancelLabel: "Keep editing",
      onConfirm: () => {
        form.reset();
        setFillMode(false);
      },
    });
  };

  /**
   * One submit path for both adding and editing.
   *
   * Mapping happens after creation because a mapping names the question by id,
   * and the id does not exist until the question does. A failure there leaves
   * the question in place, unmapped — recoverable from the Field sources view.
   */
  const saveQuestion = async (values: QuestionDialogSubmit) => {
    if (questionTarget && questionTarget !== "new") {
      await updateQuestion.mutateAsync({
        questionId: questionTarget.id,
        data: {
          label: values.label,
          description: values.description,
          type: values.type,
          isRequired: values.isRequired,
          config: values.config,
        },
      });
      return;
    }

    /*
      No "also fill a form field" any more.

      A question written for one matter used to be wirable straight onto a form
      box, which read as a per-matter setting and was not one: the mapping row
      it wrote decided that box for every firm in the deployment. There is no
      per-matter mapping to replace it with, so the picker is gone rather than
      disabled — a control that cannot do what it says should not be on screen.

      What still works, and covers the ordinary case: give the question the
      `fieldKey` the form field already uses, on the firm's own questionnaire in
      Settings. That is the shared vocabulary and it needs no mapping at all. A
      box with no question behind it is a change to the *form*, which is a
      request to Oravanti.
    */
    await addQuestion.mutateAsync({
      sectionId: values.sectionId,
      label: values.label,
      description: values.description,
      type: values.type,
      isRequired: values.isRequired,
      config: values.config,
    });
  };

  /**
   * Save the active section: only what changed, tagged with the section.
   *
   * `onSaved` runs on success alone, so a save that fails leaves the drafts on
   * screen and the person where they were — the one moment losing them would
   * be least forgivable.
   */
  const saveSection = (onSaved?: () => void) => {
    if (!activeSection) return;

    saveAnswers.mutate(
      {
        sectionId: activeSection.id,
        // What changed, minus anything a closed branch has taken off the
        // screen, plus a null for every answer such a branch has withdrawn.
        // See the same list in the client portal for why the second half
        // matters more than the first.
        answers: [
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
        ],
      },
      {
        onSuccess: () => {
          // Reset to what was just saved, so the fields are clean without a
          // refetch having to land first. The query is invalidated anyway, and
          // `keepDirtyValues` lets the answer come back without disturbing
          // anything typed since.
          form.reset(form.getValues());
          onSaved?.();
        },
      },
    );
  };

  /** Complete whatever move the guard interrupted, then let the drafts go. */
  const proceedWithNav = () => {
    if (!pendingNav) return;
    if (pendingNav.kind === "section") setSelectedSectionId(pendingNav.id);
    else setView(pendingNav.value);
    form.reset();
    setPendingNav(null);
  };

  const goToSection = (id: string) => {
    if (id === activeSection?.id) return;
    if (isDirty) {
      setPendingNav({ kind: "section", id });
      return;
    }
    setSelectedSectionId(id);
  };

  const goToView = (value: string) => {
    if (value === view) return;
    if (isDirty) {
      setPendingNav({ kind: "view", value });
      return;
    }
    setView(value);
  };

  const totals = useMemo(() => {
    const all = sections.flatMap((s) => s.questions);
    const answered = all.filter((q) => {
      const value = answers.get(q.id);
      return value != null && value !== "";
    }).length;
    return { answered, total: all.length };
  }, [sections, answers]);

  if (isLoading) {
    return (
      <Flex justify="center" py={10}>
        <Spinner size="sm" />
      </Flex>
    );
  }

  if (!data?.systemQuestionnaire) {
    return (
      <Box
        border="1px dashed"
        borderColor="border"
        borderRadius="md"
        px={5}
        py={8}
        textAlign="center"
      >
        <Text fontSize="13px" color="fg.muted">
          No case questionnaire has been published for this matter's case type
          yet, so there is nothing to ask. The intake answers this matter came
          from are still on the lead.
        </Text>
      </Box>
    );
  }

  const percentage =
    totals.total === 0 ? 0 : Math.round((totals.answered / totals.total) * 100);
  const isComplete = response?.status === "submitted";

  return (
    <>
      <Flex
        justify="space-between"
        align="flex-start"
        gap={4}
        mb={4}
        flexWrap="wrap"
      >
        <Box>
          <HStack gap={2} align="baseline">
            <Text fontSize="16px" fontWeight="500" color="fg" lineHeight="20px">
              {data.systemQuestionnaire.title}
            </Text>
            {isComplete && (
              <Badge size="sm" variant="subtle" colorPalette="green" fontSize="10px">
                complete
              </Badge>
            )}
          </HStack>
          <Text fontSize="13px" color="fg.muted" mt={0.5}>
            {totals.answered} of {totals.total} answered · saving a section
            fills the forms behind it
          </Text>
        </Box>

        {/*
          The toolbar wraps rather than running off the edge.

          Five 36px controls do not fit a phone on one line, and the row used
          to overflow to the right — which put "Send to client", the thing
          somebody opens this tab to do, past the edge of the screen with no
          scrollbar to say so. Below `md` they share the width in rows; from
          `md` they sit back on one line at their natural size.
        */}
        <Flex
          gap={2}
          flexWrap="wrap"
          w={{ base: "full", md: "auto" }}
          justify={{ base: "flex-start", md: "flex-end" }}
        >
          <TabAction onClick={() => setHistoryOpen(true)}>
            <History size={13} />
            History
          </TabAction>
          <TabAction onClick={() => setSectionTarget("new")}>
            <Plus size={13} />
            Add section
          </TabAction>
          <TabAction onClick={() => setQuestionTarget("new")}>
            <Plus size={13} />
            Add question
          </TabAction>
          {/* The way in to answering, and the way back out. Answers belong to
              the client; this button is staff saying, on the record, that they
              are entering them on the client's behalf. */}
          <TabAction
            borderColor={fillMode ? "border.emphasized" : "border"}
            color={fillMode ? "fg" : "fg.muted"}
            onClick={() => (fillMode ? leaveFillMode() : setFillMode(true))}
          >
            {fillMode ? <Lock size={13} /> : <PenLine size={13} />}
            {fillMode ? "Lock answers" : "Fill on behalf"}
          </TabAction>
          <Button
            layerStyle="brand-button"
            size="xs"
            h="36px"
            fontSize="13px"
            fontWeight="400"
            px={4}
            flex={TOOLBAR_FLEX}
            onClick={() => setSendOpen(true)}
          >
            <Send size={13} />
            Send to client
          </Button>
        </Flex>
      </Flex>

      {fillMode && (
        <Alert.Root status="info" size="sm" mb={4}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description fontSize="12px">
              You are answering on the client's behalf. These answers are
              recorded against your name, not theirs.
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      <Progress.Root
        value={percentage}
        size="xs"
        colorPalette={isComplete ? "green" : "blue"}
        mb={4}
      >
        <Progress.Track>
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>

      <SegmentGroup.Root
        value={view}
        onValueChange={(e) => goToView(e.value ?? "questionnaire")}
        size="sm"
        mb={4}
      >
        <SegmentGroup.Indicator />
        <SegmentGroup.Items
          items={[
            { label: "Case questionnaire", value: "questionnaire" },
            { label: "Intake answers", value: "intake" },
          ]}
        />
      </SegmentGroup.Root>

      {view === "intake" ? (
        <IntakeAnswers caseId={caseId} />
      ) : (
        <Flex gap={5} align="flex-start" direction={{ base: "column", lg: "row" }}>
          <SectionRail
            items={railSections}
            activeId={activeSection?.id ?? null}
            onSelect={goToSection}
          />

          <Box flex={1} minW={0} w="full">
            {activeSection && (
              <SectionEditor
                section={activeSection}
                completion={
                  activeCompletion ?? {
                    answered: 0,
                    total: 0,
                    requiredAnswered: 0,
                    requiredTotal: 0,
                  }
                }
                form={form}
                isRequired={isRequired}
                onSave={() => saveSection()}
                onDiscard={() => form.reset()}
                isSaving={saveAnswers.isPending}
                feedsByQuestion={feedsByQuestion}
                // A firm extends Oravanti's questionnaire; it does not reword
                // it. Both controls are absent on a standard section rather
                // than present and refused by the server.
                onEditSection={
                  activeSection.isLocked
                    ? undefined
                    : () => setSectionTarget(activeSection)
                }
                onDeleteSection={
                  activeSection.isLocked
                    ? undefined
                    : () => confirmDeleteSection(activeSection)
                }
                onEditQuestion={(questionId) =>
                  setQuestionTarget(questionsById.get(questionId) ?? null)
                }
                onDeleteQuestion={confirmDeleteQuestion}
                onAddQuestion={() => setQuestionTarget("new")}
                onQuestionHistory={setAnswerHistoryFor}
                answersReadOnly={!fillMode}
              />
            )}
          </Box>
        </Flex>
      )}

      {/* Marking complete is staff asserting the client's answers are done, so
          it lives behind the same deliberate act as entering them. */}
      {view === "questionnaire" && fillMode && !isComplete && totals.answered > 0 && (
        <Flex justify="flex-end" mt={5}>
          <Button
            size="xs"
            variant="outline"
            borderColor="border"
            h="36px"
            fontSize="13px"
            fontWeight="400"
            color="fg.muted"
            px={4}
            loading={saveAnswers.isPending}
            onClick={() =>
              saveAnswers.mutate({ status: "submitted", answers: [] })
            }
          >
            <CheckCircle2 size={13} />
            Mark complete
          </Button>
        </Flex>
      )}

      <UnsavedSectionDialog
        open={pendingNav !== null}
        control={form.control}
        isSaving={saveAnswers.isPending}
        onGoBack={() => setPendingNav(null)}
        onDiscard={proceedWithNav}
        onSave={() => saveSection(proceedWithNav)}
      />

      <HistoryPanel
        caseId={caseId}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
      <AnswerHistoryDialog
        caseId={caseId}
        questionId={answerHistoryFor}
        questionLabel={
          answerHistoryFor
            ? (questionsById.get(answerHistoryFor)?.label ?? "")
            : ""
        }
        open={answerHistoryFor !== null}
        onOpenChange={(next) => !next && setAnswerHistoryFor(null)}
      />

      {/* The dialogs take the structure, not one client path through it: a
          section a branch has closed is still somewhere a question can be
          added, and still a section the send carries. */}
      <QuestionDialog
        tier="case"
        sections={allSections}
        question={questionTarget === "new" ? null : questionTarget}
        defaultSectionId={activeSection?.id}
        open={questionTarget !== null}
        onOpenChange={(next) => !next && setQuestionTarget(null)}
        isPending={addQuestion.isPending || updateQuestion.isPending}
        onSubmit={saveQuestion}
      />
      <SectionDialog
        section={sectionTarget === "new" ? null : sectionTarget}
        open={sectionTarget !== null}
        onOpenChange={(next) => !next && setSectionTarget(null)}
        isPending={addSection.isPending || updateSection.isPending}
        scopeNote={
          sectionTarget === "new"
            ? "Added to this matter only. Sections every matter of this type should have belong in Settings."
            : undefined
        }
        onSubmit={(values) =>
          sectionTarget === "new"
            ? addSection.mutateAsync(values)
            : updateSection.mutateAsync({
                sectionId: (sectionTarget as CaseSection).id,
                data: values,
              })
        }
      />
      <SendQuestionnaireDialog
        caseId={caseId}
        sections={allSections}
        answeredBySection={answeredBySection}
        open={sendOpen}
        onOpenChange={setSendOpen}
      />
    </>
  );
}

/**
 * The warning shown when a section switch would drop unsaved answers.
 *
 * Offers the save as well as the discard, because losing the work is almost
 * never what the person meant and making them cancel, save, and navigate again
 * is three steps to reach the obvious one.
 */
function UnsavedSectionDialog({
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
                {count} answer{count === 1 ? " has" : "s have"} been changed but
                not saved. Moving on now discards {count === 1 ? "it" : "them"}.
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

