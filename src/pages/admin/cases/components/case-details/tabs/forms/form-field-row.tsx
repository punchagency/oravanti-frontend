import type { CaseFormField, FormCorrection } from "@/api/case-details";
import {
  fieldName,
  type DraftForm,
} from "@/components/questionnaire/use-draft-form";
import { TypedValueInput } from "@/components/ui/typed-value-input";
import { questionTypeLabel } from "@/utils/question-types";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Text,
} from "@chakra-ui/react";
import { Check, History, Pencil, X } from "lucide-react";
import { useController } from "react-hook-form";
import { paletteFor } from "./review/correction-color";

/**
 * One field on a form: its label, its value, and where that value came from.
 *
 * Provenance is shown on every field rather than only the unusual ones. A
 * paralegal checking a form before filing needs to know at a glance which
 * answers came from the client and which somebody typed, and a badge that only
 * appears sometimes makes its absence ambiguous.
 *
 * A controlled input and nothing more: the form owns the draft, because Save
 * works on a whole form and a form cannot save what its rows are each holding
 * privately. Same division as the questionnaire's `AnswerRow`, which this is
 * deliberately shaped after — the two tabs are the same work on two subjects.
 *
 * ─── Read is the resting state, and one field can leave it alone ────────────
 *
 * The row renders the same control whether or not it accepts typing — see
 * `TypedValueInput`'s `readOnly`. `isEditable` is true either because the
 * whole form is being edited or because this one field was unlocked with the
 * pencil, which is what somebody answering a single correction wants: that
 * field written, nothing else touched.
 */
export function FormFieldRow({
  field,
  control,
  isEditable = false,
  onToggleEdit,
  isMissing = false,
  onHistory,
  disabled,
  corrections,
  onSaveField,
  isSavingField,
  onDiscardField,
}: {
  field: CaseFormField;
  /** The form's draft form. This row binds to `field.fieldKey` within it. */
  control: DraftForm["control"];
  /** Whether this row accepts typing — form-wide editing, or unlocked alone. */
  isEditable?: boolean;
  /**
   * Unlock or re-lock this one field.
   *
   * Absent while the whole form is being edited, where every row already takes
   * typing and a per-row unlock would be a control that does nothing.
   */
  onToggleEdit?: () => void;
  /** Required by USCIS and still empty. Called out rather than left blank. */
  isMissing?: boolean;
  /**
   * History of this field's *values*, which is a record of the matter.
   *
   * The only control left on a row. Edit and Remove used to sit beside it and
   * changed the field itself — its label, whether it exists — which is a
   * property of the form rather than of this matter. A form is a government
   * blank; what is on it is Oravanti's, maintained in its CRM.
   */
  onHistory?: () => void;
  disabled?: boolean;
  /**
   * The reviewing attorney's marks on this field, open ones first.
   *
   * Read here and raised elsewhere, which is the whole shape of the review: an
   * attorney marks a box on the printed page, in *Review on the form*, because
   * a review is reading the filing as it prints. This list is where somebody
   * then fixes what was marked, so the note has to be legible beside the field
   * they are typing into — a note they have to scroll back up to re-read is a
   * note that gets half-remembered.
   */
  corrections?: FormCorrection[];
  /**
   * Save this field alone.
   *
   * Beside the form-wide Save rather than instead of it: a paralegal filling a
   * blank form works down it and commits once, while somebody answering one
   * correction wants that one field written and nothing else touched. Only
   * offered while the row is actually dirty.
   */
  onSaveField?: () => void;
  isSavingField?: boolean;
  /**
   * Throw this field's edit away and close the row.
   *
   * The same thing the ✕ in the corner does, said in a word. An icon is fine
   * for "close" and no good at all for "and lose what I typed", which is the
   * half somebody needs to be sure of before they press it — so the row ends up
   * with the pair the sticky bar already has, Discard beside Save, and the ✕
   * stays for anyone who reaches for it first.
   */
  onDiscardField?: () => void;
}) {
  // Bound to this field alone, so typing here re-renders this row and none of
  // the others. See the note in `use-draft-form`.
  const { field: input, fieldState } = useController({
    control,
    name: fieldName(field.fieldKey),
  });

  const open = (corrections ?? []).filter((c) => c.status === "open");
  const resolvedOnly =
    open.length === 0
      ? (corrections ?? []).filter((c) => c.status === "resolved")
      : [];
  const marked = open[0];

  return (
    <Box
      py={3}
      borderBottom="1px solid"
      borderColor="border"
      _last={{ borderBottom: "none" }}
      // The mark is a stripe down the row rather than a background wash: the
      // row already carries badges in three colours, and a tinted field is
      // read as a disabled one.
      {...(marked
        ? {
            borderLeft: "3px solid",
            borderLeftColor: `${paletteFor(marked.color)}.solid`,
            pl: 3,
          }
        : {})}
    >
      <Flex justify="space-between" align="flex-start" gap={3} mb={1.5}>
        <Box flex={1} minW={0}>
          <HStack gap={1.5} align="baseline" flexWrap="wrap" mb={0.5}>
            <Text fontSize="13px" color="fg" fontWeight="500">
              {field.label}
            </Text>
            {field.isRequired && (
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
              {questionTypeLabel(field.type)}
            </Badge>
            {fieldState.isDirty ? (
              <Badge
                size="sm"
                variant="subtle"
                colorPalette="orange"
                fontSize="10px"
              >
                unsaved
              </Badge>
            ) : (
              <SourceBadge field={field} />
            )}
          </HStack>

          {field.helpText && (
            <Text fontSize="12px" color="fg.muted" lineHeight="16px">
              {field.helpText}
            </Text>
          )}
        </Box>

        <HStack gap={0.5} flexShrink={0}>
          {onToggleEdit && (
            <IconButton
              /*
                "the value of", deliberately.

                A control named "Edit Date of Birth" is what used to sit here
                and it changed the *field* — its label, whether the form has it
                at all — which is Oravanti's to change and not a firm's. This
                one changes what this matter answered. The two would be a click
                apart and indistinguishable by name, so the name says which.
                `form-view.test.tsx` pins both halves.
              */
              aria-label={
                isEditable
                  ? `Discard the change to ${field.label} and stop editing it`
                  : `Edit the value of ${field.label}`
              }
              size="xs"
              variant="ghost"
              color={isEditable ? "fg" : "fg.muted"}
              _hover={{ color: "fg" }}
              onClick={onToggleEdit}
            >
              {isEditable ? <X size={13} /> : <Pencil size={13} />}
            </IconButton>
          )}
          {onHistory && (
            <IconButton
              aria-label={`History of ${field.label}`}
              size="xs"
              variant="ghost"
              color="fg.muted"
              _hover={{ color: "fg" }}
              onClick={onHistory}
            >
              <History size={13} />
            </IconButton>
          )}
        </HStack>
      </Flex>

      <TypedValueInput
        type={field.type}
        value={input.value ?? ""}
        options={field.config?.options}
        onChange={input.onChange}
        readOnly={!isEditable}
        disabled={disabled}
        ariaLabel={field.label}
      />

      {/* A blank on a form somebody is checking is indistinguishable from a
          question that does not apply, and one of those stops a filing. */}
      {isMissing && !input.value && (
        <Badge
          size="sm"
          variant="subtle"
          colorPalette="orange"
          fontSize="10px"
          mt={1.5}
        >
          required — not yet answered
        </Badge>
      )}

      {/* The row's own pair, and only while there is something to commit or
          throw away. The same two words the sticky bar uses for the whole form,
          because this is that decision at the scale of one field. */}
      {fieldState.isDirty && (onSaveField || onDiscardField) && (
        <HStack gap={1.5} mt={1.5}>
          {onSaveField && (
            <Button
              size="xs"
              variant="outline"
              borderColor="border"
              h="28px"
              px={2.5}
              fontSize="12px"
              fontWeight="400"
              color="fg.muted"
              loading={isSavingField}
              onClick={onSaveField}
            >
              <Check size={12} />
              Save this field
            </Button>
          )}

          {onDiscardField && (
            <Button
              // Named for the field, because the sticky bar's Discard says the
              // same word about the whole form and the two must not be confused
              // by anyone reading the page rather than looking at it.
              aria-label={`Discard the change to ${field.label}`}
              size="xs"
              variant="ghost"
              h="28px"
              px={2.5}
              fontSize="12px"
              fontWeight="400"
              color="fg.muted"
              disabled={isSavingField}
              onClick={onDiscardField}
            >
              Discard
            </Button>
          )}
        </HStack>
      )}

      {resolvedOnly.length > 0 && (
        <Text fontSize="11px" color="fg.subtle" mt={1.5}>
          {resolvedOnly.length} correction
          {resolvedOnly.length === 1 ? "" : "s"} resolved on this field
        </Text>
      )}

      {open.map((correction) => (
        <Text
          key={correction.id}
          fontSize="12px"
          color="fg"
          mt={1.5}
          lineHeight="16px"
        >
          <Text as="span" color={`${paletteFor(correction.color)}.solid`}>
            Marked for correction
          </Text>
          {correction.raisedByName ? ` by ${correction.raisedByName}` : ""}:{" "}
          {correction.note}
        </Text>
      ))}

      {field.conflictsWith != null && (
        <Text fontSize="12px" color="fg.warning" mt={1.5} lineHeight="16px">
          The questionnaire now says “{String(field.conflictsWith)}”. Your edit
          has been kept — change it above if theirs is right.
        </Text>
      )}
    </Box>
  );
}

function SourceBadge({ field }: { field: CaseFormField }) {
  if (field.value == null || field.value === "") {
    return (
      <Badge size="sm" variant="subtle" colorPalette="gray" fontSize="10px">
        empty
      </Badge>
    );
  }

  if (field.isManualOverride) {
    return (
      <Badge size="sm" variant="subtle" colorPalette="orange" fontSize="10px">
        edited by hand
      </Badge>
    );
  }

  return (
    <Badge size="sm" variant="subtle" colorPalette="green" fontSize="10px">
      from questionnaire
    </Badge>
  );
}
