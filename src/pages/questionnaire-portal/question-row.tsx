import type { PortalQuestion } from "@/api/questionnaires";
import {
  fieldName,
  type DraftForm,
} from "@/components/questionnaire/use-draft-form";
import { TypedValueInput } from "@/components/ui/typed-value-input";
import { Badge, Box, Flex, HStack, Text } from "@chakra-ui/react";
import { useController } from "react-hook-form";

import { RepeatGroupField } from "@/components/questionnaire/repeat-group-field";
import { FileUploadField } from "./file-upload-field";

/**
 * One question and the client's answer to it.
 *
 * Shaped like the row a paralegal sees on the case tab — the same box, the same
 * green edge when answered, the same amber one when there is something unsaved
 * — because it is literally the same question. What it deliberately does not
 * carry is the staff chrome: no provenance badge, no edit or delete, no
 * history. A client has no use for where a question came from, and a firm has
 * no interest in showing them.
 *
 * The one genuine difference is uploads. A document belongs to the response
 * rather than to the answer set, so it saves the moment it is chosen instead of
 * waiting for the section's Save.
 */
export function QuestionRow({
  question,
  control,
  disabled,
  required,
  token,
  uploadedFilename,
  ensureResponseId,
  onFileUploaded,
}: {
  question: PortalQuestion;
  /** The questionnaire's draft form. This row binds to its own question id. */
  control: DraftForm["control"];
  disabled?: boolean;
  /**
   * Whether an answer is compulsory — the question’s own flag, or a rule that
   * added one. Passed in rather than read off the question because a branch can
   * make a question required only once it is open.
   */
  required: boolean;
  token: string;
  uploadedFilename: string | null;
  ensureResponseId: () => Promise<string>;
  onFileUploaded: () => void;
}) {
  const isUpload = question.type === "file_upload";

  // Bound to this question alone, so answering one does not re-render the
  // other twenty-nine. See the note in `use-draft-form`.
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
          <HStack gap={1.5} align="baseline" flexWrap="wrap">
            <Text fontSize="13px" color="fg" fontWeight="500">
              {question.label}
            </Text>
            {required && (
              <Text fontSize="11px" color="fg.error" lineHeight="1">
                required
              </Text>
            )}
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
            <Text fontSize="12px" color="fg.muted" lineHeight="16px" mt={0.5}>
              {question.description}
            </Text>
          )}
        </Box>
      </Flex>

      {isUpload ? (
        <FileUploadField
          token={token}
          questionId={question.id}
          initialFilename={uploadedFilename}
          ensureResponseId={ensureResponseId}
          onUploaded={onFileUploaded}
        />
      ) : question.type === "repeat_group" ? (
        /*
          A list, not a value. It binds to the same one form field as every
          other question — the whole list as JSON — so nothing above it has to
          know that some answers repeat. See `RepeatGroupField`.
        */
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
    </Box>
  );
}
