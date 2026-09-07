import type { CaseQuestion, CaseSection } from "@/api/questionnaires";
import { CompletionBar } from "@/components/questionnaire/completion-bar";
import type { DraftForm } from "@/components/questionnaire/use-draft-form";
import { UnsavedBar } from "@/components/questionnaire/unsaved-bar";
import {
  Badge,
  Button,
  EmptyState,
  Flex,
  HStack,
  IconButton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ListPlus, Pencil, Plus, Trash2 } from "lucide-react";

import { AnswerRow } from "./answer-row";

/**
 * One section, edited as a unit.
 *
 * Save is explicit and section-wide rather than per field. Two reasons, and the
 * second is the one that matters: a person filling in six related answers
 * expects to finish before anything is committed, and every save is recorded as
 * a version — so saving per keystroke would turn the history into a log of
 * typing rather than a record of work.
 *
 * The component holds no state. The draft form belongs to the tab, which is
 * what has to answer "is there anything unsaved?" when someone navigates away
 * — and passing the form down rather than a value-per-row is what keeps a
 * keystroke from re-rendering the whole section.
 */
export function SectionEditor({
  section,
  completion,
  form,
  isRequired,
  onSave,
  onDiscard,
  isSaving,
  feedsByQuestion,
  onEditSection,
  onDeleteSection,
  onEditQuestion,
  onDeleteQuestion,
  onAddQuestion,
  onQuestionHistory,
  answersReadOnly,
}: {
  section: CaseSection;
  /**
   * How much of this section is answered, counted from what is *stored*.
   *
   * Passed in rather than derived from `draftFor`, which would count what has
   * been typed and not yet saved — the bar would then disagree with the rail
   * beside it, and claim credit for work that is still one refresh from being
   * lost.
   */
  completion: {
    answered: number;
    total: number;
    requiredAnswered: number;
    requiredTotal: number;
  };
  /** The tab's draft form. Rows bind to their own question id within it. */
  form: DraftForm;
  /**
   * Whether a question must be answered — its own flag, or a branch that has
   * made it compulsory. Passed down rather than read off the question, so the
   * asterisk and the submit gate always say the same thing.
   */
  isRequired: (question: CaseQuestion) => boolean;
  onSave: () => void;
  onDiscard: () => void;
  isSaving: boolean;
  feedsByQuestion: Map<string, string>;
  /**
   * Absent for one of Oravanti's sections, which a firm extends but does not
   * reword — see the note rendered under the title.
   */
  onEditSection?: () => void;
  onDeleteSection?: () => void;
  onEditQuestion: (questionId: string) => void;
  onDeleteQuestion: (questionId: string) => void;
  onAddQuestion: () => void;
  onQuestionHistory: (questionId: string) => void;
  /**
   * Whether the *answers* are locked. Authoring is not: staff own the
   * questions, the client owns the answers, and this prop is the line between
   * the two. Everything that shapes the questionnaire — adding, editing and
   * removing questions and sections — stays available regardless. What bounds
   * *that* is ownership, not this flag: Oravanti's rows are never editable
   * here, in fill mode or out of it.
   */
  answersReadOnly: boolean;
}) {
  const hasStandardRows =
    section.isLocked || section.questions.some((question) => question.isLocked);

  return (
    <>
      <Flex justify="space-between" align="flex-start" gap={3} mb={2}>
        <HStack gap={2} align="baseline" flexWrap="wrap" minW={0}>
          <Text fontSize="14px" fontWeight="500" color="fg">
            {section.title}
          </Text>
          {section.isLocked && (
            <Badge
              size="sm"
              variant="subtle"
              colorPalette="gray"
              fontSize="10px"
            >
              Oravanti
            </Badge>
          )}
        </HStack>
        <HStack gap={0.5} flexShrink={0}>
          {/* Both controls are absent on one of Oravanti's sections rather
              than present and refused: the server answers an edit with a 404,
              and a button that 404s is a promise the app cannot keep. */}
          {onEditSection && (
            <IconButton
              aria-label={`Edit ${section.title}`}
              size="xs"
              variant="ghost"
              color="fg.muted"
              _hover={{ color: "fg" }}
              onClick={onEditSection}
            >
              <Pencil size={13} />
            </IconButton>
          )}
          {onDeleteSection && (
            <IconButton
              aria-label={`Remove ${section.title}`}
              size="xs"
              variant="ghost"
              color="fg.muted"
              _hover={{ color: "fg.error" }}
              onClick={onDeleteSection}
            >
              <Trash2 size={13} />
            </IconButton>
          )}
        </HStack>
      </Flex>

      {section.description && (
        <Text fontSize="12px" color="fg.muted" lineHeight="17px" mb={3}>
          {section.description}
        </Text>
      )}

      {/*
        Said once, where somebody would look for the pencil that is not there.

        Oravanti's questions are the same on every firm's matter — they are what
        the form fields are wired to, so rewording one here would change what a
        box on the I-485 is fed. The firm's own rows are marked, and those are
        the ones it edits.
      */}
      {hasStandardRows && (
        <Text fontSize="12px" color="fg.muted" lineHeight="17px" mb={3}>
          Questions provided with the platform are the same for every firm and
          cannot be reworded here. The ones this firm or this matter added are
          marked, and those are yours to edit and remove.
        </Text>
      )}

      <CompletionBar
        filled={completion.answered}
        total={completion.total}
        requiredMissing={completion.requiredTotal - completion.requiredAnswered}
        noun="questions"
      />

      <VStack gap={2} align="stretch">
        {section.questions.map((question) => (
          <AnswerRow
            key={question.id}
            question={question}
            required={isRequired(question)}
            control={form.control}
            disabled={isSaving || answersReadOnly}
            feedsLabel={feedsByQuestion.get(question.id)}
            onHistory={() => onQuestionHistory(question.id)}
            // Edit and remove go together, and only on rows this firm owns.
            // A firm's edit of a standard question used to be stored as a
            // firm-scoped copy that superseded ours for that firm alone; that
            // path is gone, and the server answers such an edit with a 404 —
            // so the pencil goes with it rather than sitting there and
            // failing. Rewording one would also change what a box on the
            // I-485 is fed, for every firm in the deployment.
            onEdit={
              question.isLocked ? undefined : () => onEditQuestion(question.id)
            }
            onDelete={
              question.isLocked
                ? undefined
                : () => onDeleteQuestion(question.id)
            }
          />
        ))}

        {section.questions.length === 0 && (
          <EmptyState.Root size="sm" py={6}>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <ListPlus size={20} />
              </EmptyState.Indicator>
              <VStack gap={1}>
                <EmptyState.Title fontSize="14px" fontWeight="500">
                  No questions in this section
                </EmptyState.Title>
                <EmptyState.Description fontSize="13px" color="fg.muted">
                  Add the questions this section should ask. They become the
                  source for the fields on this matter's forms.
                </EmptyState.Description>
              </VStack>
              <Button
                size="xs"
                h="32px"
                px={4}
                fontSize="13px"
                fontWeight="400"
                layerStyle="brand-button"
                onClick={onAddQuestion}
              >
                <Plus size={13} />
                Add question
              </Button>
            </EmptyState.Content>
          </EmptyState.Root>
        )}
      </VStack>

      {/* No save bar when the answers are locked — there is nothing to save,
          and an inert bar reading "1 unsaved change" would be a lie. */}
      {!answersReadOnly && (
        <UnsavedBar
          control={form.control}
          noun="change"
          saveLabel="Save section"
          isSaving={isSaving}
          onSave={onSave}
          onDiscard={onDiscard}
        />
      )}
    </>
  );
}
