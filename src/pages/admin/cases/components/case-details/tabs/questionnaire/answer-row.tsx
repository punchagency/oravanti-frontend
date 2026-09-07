import type { CaseQuestion } from "@/api/questionnaires";
import {
  fieldName,
  type DraftForm,
} from "@/components/questionnaire/use-draft-form";
import { RepeatGroupField } from "@/components/questionnaire/repeat-group-field";
import { TypedValueInput } from "@/components/ui/typed-value-input";
import { questionTypeLabel } from "@/utils/question-types";
import { Badge, Box, Flex, HStack, IconButton, Text } from "@chakra-ui/react";
import { History, Link2, Pencil, Trash2 } from "lucide-react";
import { useController } from "react-hook-form";

/**
 * One question and its answer.
 *
 * The section owns the draft, because Save works on a section and a section
 * cannot save what its rows are each holding privately. What the row does own
 * is context a plain form would not carry — where the question came from,
 * whether answering it fills a form, and whether what is on screen has been
 * saved yet.
 *
 * ─── One subscription, this row wide ───────────────────────────────────────
 *
 * `useController` binds the row to its own field and nothing else, so typing
 * here re-renders this row and leaves the other twenty-nine alone. That is the
 * whole reason these surfaces moved off a container-owned `useState` map: with
 * one, every keystroke re-rendered every row on the page.
 *
 * It also means the row no longer needs `draft`, `isDirty` or a change
 * handler passed down — all three come from the form, which is the single
 * thing that knows them.
 */
export function AnswerRow({
  question,
  required,
  control,
  onEdit,
  onDelete,
  onHistory,
  disabled,
  feedsLabel,
}: {
  question: CaseQuestion;
  /**
   * Whether an answer is compulsory — the question’s own flag, or a branch that
   * has made it so. Passed in because a rule can only be read against the
   * answers, which the row does not have.
   */
  required: boolean;
  /** The section's form. This row binds to `question.id` within it. */
  control: DraftForm["control"];
  onEdit?: () => void;
  onDelete?: () => void;
  onHistory?: () => void;
  disabled?: boolean;
  /** What this answer fills, e.g. "I-485 · Date of Birth". */
  feedsLabel?: string | null;
}) {
  const { field, fieldState } = useController({
    control,
    name: fieldName(question.id),
  });

  return (
    <Box
      py={3.5}
      px={4}
      // One border for every state. The "unsaved" badge already names the one
      // state worth calling out, and outlining every answered question in
      // green made a form that was going well look like a form full of
      // errors.
      border="1px solid"
      borderColor="border"
      bg="bg.panel"
      borderRadius="sm"
    >
      <Flex justify="space-between" align="flex-start" gap={3} mb={2}>
        <Box flex={1} minW={0}>
          <HStack gap={1.5} align="baseline" flexWrap="wrap" mb={0.5}>
            <Text fontSize="13px" color="fg" fontWeight="500">
              {question.label}
            </Text>
            {required && (
              <Text fontSize="11px" color="fg.error" lineHeight="1">
                required
              </Text>
            )}
            <Badge
              size="sm"
              variant="outline"
              colorPalette="gray"
              fontSize="10px"
            >
              {questionTypeLabel(question.type)}
            </Badge>
            <ProvenanceBadge question={question} />
            {fieldState.isDirty && (
              <Badge
                size="sm"
                variant="subtle"
                colorPalette="orange"
                fontSize="10px"
              >
                unsaved
              </Badge>
            )}
          </HStack>

          {question.description && (
            <Text fontSize="12px" color="fg.muted" lineHeight="16px">
              {question.description}
            </Text>
          )}
        </Box>

        <HStack gap={0.5} flexShrink={0}>
          {onHistory && (
            <IconButton
              aria-label={`History of ${question.label}`}
              size="xs"
              variant="ghost"
              color="fg.muted"
              _hover={{ color: "fg" }}
              onClick={onHistory}
            >
              <History size={13} />
            </IconButton>
          )}
          {onEdit && (
            <IconButton
              aria-label={`Edit ${question.label}`}
              size="xs"
              variant="ghost"
              color="fg.muted"
              _hover={{ color: "fg" }}
              onClick={onEdit}
            >
              <Pencil size={13} />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              aria-label={`Remove ${question.label}`}
              size="xs"
              variant="ghost"
              color="fg.muted"
              _hover={{ color: "fg.error" }}
              onClick={onDelete}
            >
              <Trash2 size={13} />
            </IconButton>
          )}
        </HStack>
      </Flex>

      {/*
        A repeating answer is a list, and a paralegal editing one edits the same
        list the client sees. The staff row and the portal row deliberately share
        the control rather than the staff one rendering the JSON read-only —
        correcting a client's second address is ordinary work, and a text box
        full of braces is not a way to do it.
      */}
      {question.type === "repeat_group" ? (
        <RepeatGroupField
          value={field.value ?? ""}
          onChange={field.onChange}
          config={question.config ?? null}
          disabled={disabled}
        />
      ) : (
        <TypedValueInput
          type={question.type}
          value={field.value ?? ""}
          options={question.config?.options}
          onChange={field.onChange}
          disabled={disabled}
          ariaLabel={question.label}
        />
      )}

      {feedsLabel && (
        <HStack gap={1} mt={2} color="fg.muted">
          <Link2 size={11} />
          <Text fontSize="11px">Fills {feedsLabel}</Text>
        </HStack>
      )}
    </Box>
  );
}

/**
 * Where this question came from.
 *
 * Two states now, and unlabelled is the third. There used to be a "reworded"
 * badge for a platform question a firm had edited — a row that looked standard
 * but was not — and it is gone because that row cannot exist any more: a firm
 * extends the questionnaire rather than editing it, so a standard question is
 * the same question on every matter in the deployment. Unlabelled means
 * standard, which is now a claim that holds.
 */
function ProvenanceBadge({ question }: { question: CaseQuestion }) {
  if (question.scope === "system") return null;

  return (
    <Badge size="sm" variant="subtle" colorPalette="purple" fontSize="10px">
      {question.scope === "case" ? "this matter" : "firm"}
    </Badge>
  );
}
