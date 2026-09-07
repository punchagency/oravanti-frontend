import type { QuestionType } from "@/api/questionnaires";
import {
  CheckboxField,
  SearchableSelectField,
  SelectField,
  SubmitWhenValid,
  TextAreaField,
} from "@/components/ui/bound-fields";
import type { FormSelectOption } from "@/components/ui/form-select";
import type { SearchableOption } from "@/components/ui/searchable-select";
import { useFieldVocabulary } from "@/hooks/use-field-vocabulary";
import { domainLabel } from "@/utils/field-domains";
import { QUESTION_TYPE_OPTIONS, needsChoices } from "@/utils/question-types";
import { Button, Dialog, Portal, Text, VStack } from "@chakra-ui/react";
import { useEffect, useMemo } from "react";
import { useForm, useWatch, type Control } from "react-hook-form";

/**
 * Write or edit a question.
 *
 * One dialog for four situations — new or existing, firm-wide or one matter —
 * because they differ in two fields and a title, and four dialogs would drift
 * within a week. What varies is declared here rather than discovered:
 *
 * - **firm tier** offers a `fieldKey`, the shared name that fills the same box
 *   on every matter without any per-matter wiring.
 * - **platform tier** is Oravanti's own, and offers a `fieldKey` for the same
 *   reason. What differs is the reach, which the note at the top of the dialog
 *   states plainly: a question written here is asked of every firm's clients.
 * - **case tier** offers neither, because a question written for one matter has
 *   no place in the shared vocabulary. It used to offer a form-field picker,
 *   which read as a per-matter setting and was not one — the row it wrote
 *   decided that box for every firm in the deployment. A firm that needs its
 *   own answer on a form is asking for a change to the form.
 *
 * ─── Structural props, not the API's row types ──────────────────────────────
 *
 * `question` and `sections` are declared as the fields this dialog actually
 * reads rather than as `CaseQuestion`/`CaseSection`. Three callers now pass
 * three different row shapes — a firm's, a matter's, and the platform's — and
 * they agree on exactly this much. Naming that agreement is what lets one
 * dialog serve all three without an adapter at each call site.
 */

/** What this dialog needs of a question. Any tier's row satisfies it. */
export type EditableQuestion = {
  label: string;
  description: string | null;
  type: QuestionType | string;
  sectionId?: string;
  fieldKey: string | null;
  isRequired: boolean;
  config: { options?: string[] } | null;
};

/** What this dialog needs of a section: something to put in the select. */
export type SelectableSection = {
  id: string;
  title: string;
  questions?: { id: string }[];
};

/**
 * How tall the prose boxes are.
 *
 * A question is a sentence somebody reads off a screen and guidance is two or
 * three, and both were single-line boxes you edited through a slot — the end
 * of a long question was simply not visible while you wrote it. Five lines is
 * enough to see one whole.
 */
const PROSE_ROWS = 5;

export type QuestionDialogSubmit = {
  sectionId: string;
  label: string;
  description: string | null;
  type: QuestionType;
  isRequired: boolean;
  fieldKey?: string | null;
  config?: { options?: string[] };
};

type Values = {
  label: string;
  description: string;
  type: QuestionType;
  sectionId: string;
  fieldKey: string;
  isRequired: boolean;
  choices: string;
};

export function QuestionDialog({
  tier,
  sections,
  question,
  defaultSectionId,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  tier: "firm" | "case" | "platform";
  sections: SelectableSection[];
  /** Present when editing; absent when writing a new one. */
  question?: (EditableQuestion & { id: string }) | null;
  defaultSectionId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: QuestionDialogSubmit) => Promise<unknown>;
  isPending: boolean;
}) {
  const isEdit = Boolean(question);

  /**
   * Re-seeded from the question whenever a different one is opened.
   *
   * `values` is react-hook-form's own re-seed and it applies while rendering,
   * so the boxes are right on the first painted frame instead of flashing the
   * previous question's text. Memoized because a fresh object every render
   * would re-seed on every render and throw away what is being typed.
   *
   * The section is resolved here rather than at save time — the question's own
   * when editing, the one the caller was standing in when adding, the first
   * otherwise. Resolving it once means the select shows what will actually be
   * saved, instead of a blank box that saves somewhere.
   */
  const values = useMemo<Values>(
    () => ({
      label: question?.label ?? "",
      description: question?.description ?? "",
      type: (question?.type as QuestionType) ?? "short_text",
      sectionId:
        sectionOfQuestion(sections, question) ??
        defaultSectionId ??
        sections[0]?.id ??
        "",
      fieldKey: question?.fieldKey ?? "",
      isRequired: question?.isRequired ?? false,
      choices: (question?.config?.options ?? []).join("\n"),
    }),
    [question, sections, defaultSectionId],
  );

  // `onChange` so `SubmitWhenValid` can see validity as it is typed.
  const { control, getValues, reset } = useForm<Values>({
    defaultValues: values,
    values,
    mode: "onChange",
  });

  // Reopening the same question starts from what is stored, not from edits that
  // were abandoned last time. `values` cannot do this on its own: it re-seeds
  // when the question changes, and reopening the same one changes nothing.
  useEffect(() => {
    if (open) reset(values);
  }, [open, reset, values]);

  const sectionOptions = useMemo<FormSelectOption[]>(
    () =>
      sections.map((section) => ({ label: section.title, value: section.id })),
    [sections],
  );

  /*
    What a form field can be wired to, fetched only where the field is offered
    and only while the dialog is open. A matter's own question has no field, so
    the case tier never asks — and the two tiers that do reach the list through
    different routes, which is what `tier` picks here.
  */
  const offersFieldKey = tier !== "case";
  const vocabulary = useFieldVocabulary(
    tier === "platform" ? "platform" : "firm",
    offersFieldKey && open,
  );

  /*
    The key is the label and the box is the sublabel, not the other way round.

    The catalogue holds well over a thousand names and dozens of them are
    called "Family Name" — the key is the only half that tells two entries
    apart, and it is what is being chosen. The forms ride along because a name
    three of them share is the one worth picking: answer it once, and the
    I-130, the I-485 and the I-864 are all filled from it.
  */
  const fieldOptions = useMemo<SearchableOption[]>(
    () =>
      (vocabulary.data ?? []).map((entry) => ({
        value: entry.fieldKey,
        label: entry.fieldKey,
        /*
          A declared datum that no box prints yet says so, rather than trailing
          an empty separator. It is a legitimate choice — the questionnaire
          asks eighteen things the six catalogued forms have no box for — and
          "prints on no form yet" is the difference between picking it
          knowingly and picking it by mistake.
        */
        sublabel: entry.formCodes.length
          ? `${entry.label} · ${entry.formCodes.join(", ")}`
          : `${entry.label} · prints on no form yet`,
        /*
          Only the declared half is grouped. The form-local names are one
          form's word for one box — there are fifteen hundred of them and they
          are the long tail below the groups, which is exactly where the server
          puts them.
        */
        group: entry.category ? domainLabel(entry.category) : undefined,
      })),
    [vocabulary.data],
  );

  const handleSave = async () => {
    const draft = getValues();
    const wantsChoices = needsChoices(draft.type);

    await onSubmit({
      sectionId: draft.sectionId,
      label: draft.label.trim(),
      description: draft.description.trim() || null,
      type: draft.type,
      isRequired: draft.isRequired,
      ...(tier === "case" ? {} : { fieldKey: draft.fieldKey.trim() || null }),
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
                {isEdit
                  ? "Edit question"
                  : tier === "platform"
                    ? "Add a standard question"
                    : tier === "firm"
                      ? "Add a firm question"
                      : "Add a question to this matter"}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={3.5} align="stretch">
                {tier === "platform" && (
                  <Text fontSize="12px" color="fg.muted" lineHeight="17px">
                    Every firm on the platform asks this, on every matter of
                    this case type. A firm can add its own questions beside it
                    but cannot change or remove it.
                  </Text>
                )}

                {tier === "firm" && !isEdit && (
                  <Text fontSize="12px" color="fg.muted" lineHeight="17px">
                    This is asked on every matter of this case type, including
                    ones already open.
                  </Text>
                )}

                <TextAreaField
                  control={control}
                  name="label"
                  label="Question"
                  autoFocus
                  rows={PROSE_ROWS}
                  placeholder="Prior H-1B receipt number"
                  rules={{ required: "A question is needed." }}
                />

                <TextAreaField
                  control={control}
                  name="description"
                  label="Guidance (optional)"
                  rows={PROSE_ROWS}
                  placeholder="Where to find it, or what counts as an acceptable answer"
                />

                {!isEdit && (
                  <SelectField
                    control={control}
                    name="sectionId"
                    label="Section"
                    options={sectionOptions}
                    placeholder="Choose a section"
                    rules={{ required: "A section is needed." }}
                  />
                )}

                <SelectField
                  control={control}
                  name="type"
                  label="Answer type"
                  options={QUESTION_TYPE_OPTIONS}
                />

                <ChoicesField control={control} />

                {/*
                  Chosen from the catalogue, never typed.

                  It was a text box, and a text box has exactly one failure
                  mode here: a key one character off the form's matches no box,
                  fills nothing, and says nothing — the form comes out blank
                  weeks later inside a filing. Nothing validates a well-formed
                  key that does not exist, because nothing can; picking from
                  what the forms actually print is what removes the failure
                  rather than warning about it.

                  A name the catalogue does not hold yet is a change to the
                  form, which is the CRM's Field sources screen — not something
                  to invent from a question.
                */}
                {offersFieldKey && (
                  <SearchableSelectField
                    control={control}
                    name="fieldKey"
                    label="Form field it fills (optional)"
                    options={fieldOptions}
                    loading={vocabulary.isLoading}
                    placeholder="Not wired to a form"
                    searchPlaceholder="Search form fields"
                    emptyText="No form field matches"
                    hint="The answer fills every box with this name, on every form and every matter."
                  />
                )}

                <CheckboxField control={control} name="isRequired">
                  Required before the questionnaire counts as complete
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
                {isEdit ? "Save changes" : "Add question"}
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

/**
  * Which section a question currently sits in, for the edit case.
  *
  * Prefers the question's own `sectionId` where the row carries one and falls
  * back to searching the sections, because the three tiers answer this
  * differently: the platform's rows name their section directly, while a
  * matter's are only ever seen nested under one.
  */
function sectionOfQuestion(
  sections: SelectableSection[],
  question?: (EditableQuestion & { id: string }) | null,
) {
  if (!question) return null;
  if (question.sectionId) return question.sectionId;
  return (
    sections.find((section) =>
      (section.questions ?? []).some((q) => q.id === question.id),
    )?.id ?? null
  );
}
