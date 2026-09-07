import type { CatalogueField, FieldInput } from "@/api/platform";
import type { QuestionType } from "@/api/questionnaires";
import {
  CheckboxField,
  SearchableSelectField,
  SelectField,
  SubmitWhenValid,
  TextAreaField,
  TextField,
} from "@/components/ui/bound-fields";
import type { SearchableOption } from "@/components/ui/searchable-select";
import { useFieldVocabulary } from "@/hooks/use-field-vocabulary";
import { domainLabel } from "@/utils/field-domains";
import { QUESTION_TYPE_OPTIONS, needsChoices } from "@/utils/question-types";
import { Button, Dialog, Portal, Text, VStack } from "@chakra-ui/react";
import { useEffect, useMemo } from "react";
import { useForm, useWatch, type Control } from "react-hook-form";

/**
 * Write or reword one field on a form.
 *
 * The counterpart of the questionnaire's question dialog, down to the answer
 * types — a form field and a question share one type vocabulary, so "Date" here
 * renders the same control as "Date" there rather than a parallel
 * implementation of one.
 *
 * ─── The field key is chosen, never typed ───────────────────────────────────
 *
 * Giving a new field the key a question already uses is the whole of the
 * wiring: the answer flows onto the form because both name the same datum, with
 * no mapping row in between. Get it right and the field fills itself; get it
 * wrong and it stays blank with nothing to say why — and *nothing can tell the
 * two apart*, because a well-formed key that names nothing looks exactly like
 * one that names something. `populateCaseForms` matches the string, finds no
 * answer, fills no box, and reports nothing.
 *
 * This was the last free-text field key in the app. It is now a picker over
 * `schema_nodes` — the declared vocabulary — with one option that is not a
 * datum: *this form's own box*, which is the honest answer for most boxes and
 * makes the server generate a form-local name rather than inviting a guess at
 * a shared one.
 *
 * The key is still fixed once the field exists — changing it later would
 * silently unfill the field — so an existing one is shown as text.
 *
 * ─── Oravanti's dialog, not a firm's ────────────────────────────────────────
 *
 * A field written here appears on that form for every firm in the deployment.
 * There is no firm-scoped copy to fall back on and no "your version" to
 * restore, which is why the banner that used to explain one is gone rather than
 * reworded: a form is a government blank, and nobody but the government changes
 * what is on it.
 */

type Values = {
  fieldKey: string;
  label: string;
  partLabel: string;
  type: QuestionType;
  helpText: string;
  choices: string;
  isRequired: boolean;
};

/**
 * The picker's one option that is not a datum.
 *
 * Not the empty string: empty reads as "nothing chosen yet", and this is a
 * choice somebody makes on purpose. Cannot collide with a real key, which is
 * lowercase words joined by dots.
 */
const NOT_SHARED = "__not_a_shared_datum__";

/**
 * Lines given to the prose boxes.
 *
 * What a form calls a field is not a word: USCIS labels run to whole
 * sentences — "Have you EVER been arrested, cited, charged, or detained for
 * any reason by any law enforcement officer?" — and a one-line input showed
 * such a label through a slot, with the end of it out of sight while it was
 * being typed. Guidance is the form's own instruction, which is longer again.
 */
const PROSE_ROWS = 5;

export function FieldDefinitionDialog({
  field,
  formCode,
  partLabels,
  defaultPartLabel = null,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  /** Present when rewording; absent when adding. */
  field?: CatalogueField | null;
  formCode: string;
  /** The parts this form already has, so a new field can join one. */
  partLabels: string[];
  /** Where a new field lands: the part on screen when the dialog was opened. */
  defaultPartLabel?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FieldInput) => Promise<unknown>;
  isPending: boolean;
}) {
  const isEdit = Boolean(field);

  /**
   * Re-seeded from the field whenever a different one is opened.
   *
   * `values` is react-hook-form's own re-seed and it applies while rendering,
   * so the boxes are right on the first painted frame instead of flashing the
   * previous field's. Memoized because a fresh object every render would re-seed
   * on every render and throw away what is being typed.
   */
  const values = useMemo<Values>(
    () => ({
      fieldKey: field?.fieldKey ?? "",
      label: field?.label ?? "",
      partLabel: field ? (field.partLabel ?? "") : (defaultPartLabel ?? ""),
      type: (field?.type as QuestionType) ?? "short_text",
      helpText: field?.helpText ?? "",
      choices: (field?.config?.options ?? []).join("\n"),
      isRequired: field?.isRequired ?? false,
    }),
    [field, defaultPartLabel],
  );

  /*
    The parts this form has, as a picker.

    It was a text box with the existing part names listed in the hint, which
    made joining a part a spelling exercise: "Part 3. Biographic Information"
    typed with a comma instead of a full stop is a fifteenth part on the form,
    holding one field, and nothing anywhere says so. A new part is named with
    Add part on the page — that is the one place a part name is written.
  */
  const partOptions = useMemo<SearchableOption[]>(
    () => partLabels.map((label) => ({ value: label, label })),
    [partLabels],
  );

  /*
    The vocabulary, fetched only while a *new* field is being written — an
    existing one's key is settled and shown as text.
  */
  const vocabulary = useFieldVocabulary("platform", open && !isEdit);

  /*
    The datum picker, and the one option that is not a datum.

    A box holds one value, so the lists themselves are left out: a question may
    be wired to `beneficiary.address_history` — one question answering many
    times — but no box can print the whole history. A box that prints *one
    entry* of a list is addressed as `…address_history[2].city`, which comes
    out of extraction and the field-sources JSON rather than out of this dialog.

    NOT_SHARED sits first because it is the common answer. Across the six
    catalogued forms, 1,530 of 1,782 boxes carry the form's own name for
    something nothing else asks — this dialog should not imply that naming a
    shared datum is the default when it is the exception.
  */
  const datumOptions = useMemo<SearchableOption[]>(
    () => [
      {
        value: NOT_SHARED,
        label: "This form's own box",
        sublabel: "Nothing else asks for this — it is only ever on this form",
      },
      ...(vocabulary.data ?? [])
        .filter((entry) => !entry.isRepeating)
        .map((entry) => ({
          value: entry.fieldKey,
          label: entry.fieldKey,
          sublabel: entry.formCodes.length
            ? `${entry.label} · ${entry.formCodes.join(", ")}`
            : `${entry.label} · prints on no form yet`,
          group: entry.category ? domainLabel(entry.category) : undefined,
        })),
    ],
    [vocabulary.data],
  );

  // `onChange` so `SubmitWhenValid` can see validity as it is typed.
  const { control, getValues, reset } = useForm<Values>({
    defaultValues: values,
    values,
    mode: "onChange",
  });

  // Reopening the same field starts from what is stored, not from edits that
  // were abandoned last time. `values` cannot do this on its own: it re-seeds
  // when the field changes, and reopening the same one changes nothing.
  useEffect(() => {
    if (open) reset(values);
  }, [open, reset, values]);

  const handleSave = async () => {
    const draft = getValues();
    const wantsChoices = needsChoices(draft.type);

    await onSubmit({
      // Absence is the claim "this box carries no shared datum"; the server
      // generates the form's own name for it. See `FieldInput`.
      fieldKey:
        draft.fieldKey === NOT_SHARED ? undefined : draft.fieldKey.trim() || undefined,
      label: draft.label.trim(),
      partLabel: draft.partLabel.trim() || null,
      type: draft.type,
      helpText: draft.helpText.trim() || null,
      isRequired: draft.isRequired,
      ...(wantsChoices
        ? {
            config: {
              options: draft.choices
                .split("\n")
                .map((option) => option.trim())
                .filter(Boolean),
            },
          }
        : {}),
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
                {isEdit ? "Edit field" : `Add a field to ${formCode}`}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={3.5} align="stretch">
                {isEdit && (
                  <Text fontSize="12px" color="fg.muted" lineHeight="17px">
                    Every firm on the platform sees this wording. Values already
                    typed into the field on any matter are left alone.
                  </Text>
                )}

                <TextAreaField
                  control={control}
                  name="label"
                  label="What the form calls it"
                  autoFocus
                  rows={PROSE_ROWS}
                  placeholder="Date of Birth (mm/dd/yyyy)"
                  rules={{ required: "A label is needed." }}
                />

                {isEdit ? (
                  <TextField
                    control={control}
                    name="fieldKey"
                    label="Field name"
                    mono
                    disabled
                    hint="Fixed once the field exists — it is what connects this box to the answer that fills it."
                  />
                ) : (
                  <SearchableSelectField
                    control={control}
                    name="fieldKey"
                    label="What goes in this box"
                    options={datumOptions}
                    loading={vocabulary.isLoading}
                    placeholder="Choose the answer that prints here"
                    searchPlaceholder="Search answers"
                    emptyText="Nothing matches"
                    rules={{ required: "Choose an answer, or say this box is only on this form." }}
                    hint="Pick an answer a client already gives and this box fills itself. Choose the first option if nothing else asks for it — most boxes are like that."
                  />
                )}

                <SearchableSelectField
                  control={control}
                  name="partLabel"
                  label="Part of the form (optional)"
                  options={partOptions}
                  placeholder="Fields with no part"
                  searchPlaceholder="Search parts"
                  emptyText="This form has no parts yet"
                  hint="Chosen from the parts this form has. Add part, on the page behind this, is where a new one is named."
                />

                <SelectField
                  control={control}
                  name="type"
                  label="Answer type"
                  options={QUESTION_TYPE_OPTIONS}
                />

                <ChoicesField control={control} />

                <TextAreaField
                  control={control}
                  name="helpText"
                  label="Guidance (optional)"
                  rows={PROSE_ROWS}
                  placeholder="What the form's own instructions say, where it is not obvious."
                />

                <CheckboxField control={control} name="isRequired">
                  Required before the form can be filed
                </CheckboxField>
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
              <SubmitWhenValid
                control={control}
                isPending={isPending}
                onClick={handleSave}
              >
                {isEdit ? "Save changes" : "Add field"}
              </SubmitWhenValid>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

/**
 * The choices box, shown only for the types that need one.
 *
 * Its own component because it is the one control that depends on another: a
 * dropdown with no options cannot be answered, so the type decides both whether
 * this appears and whether the form can be saved. Watching the type here rather
 * than in the dialog keeps that dependency from re-rendering every other box —
 * see the note at the top of `bound-fields`.
 */
function ChoicesField({ control }: { control: Control<Values> }) {
  const type = useWatch({ control, name: "type" });
  if (!needsChoices(type)) return null;

  return (
    <TextAreaField
      control={control}
      name="choices"
      label="Choices, one per line"
      rows={PROSE_ROWS}
      rules={{ required: "This answer type needs at least one choice." }}
    />
  );
}
