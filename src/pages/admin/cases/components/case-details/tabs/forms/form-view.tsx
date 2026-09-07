import type {
  CaseForm,
  CaseFormField,
  CorrectionColor,
  FormCorrection,
} from "@/api/case-details";
import { ChunkedFields } from "@/components/forms/chunked-fields";
import { partTitle } from "@/components/forms/part-address";
import { PartSelect } from "@/components/forms/part-select";
import { CompletionBar } from "@/components/questionnaire/completion-bar";
import {
  fieldName,
  type DraftForm,
} from "@/components/questionnaire/use-draft-form";
import { UnsavedBar } from "@/components/questionnaire/unsaved-bar";
import { Box, Button, Flex, HStack, IconButton, Text } from "@chakra-ui/react";
import { FileText, Flag, History, Pencil, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

import { FormFieldRow } from "./form-field-row";
import { FormPdfPreview, FormReviewView } from "./form-pdf-view";

/**
 * One form on a matter: the blank, filled in.
 *
 * ─── The form is the form, whether or not it is being edited ────────────────
 *
 * This used to be two screens. Reading a form gave a label-and-value list;
 * pressing Edit replaced it with a page of inputs. They showed the same
 * answers in two different shapes, so checking a form against the paper meant
 * translating between a list and a document, and the two drifted every time
 * one gained a badge the other did not.
 *
 * There is one shape now — the form — and Edit decides whether it accepts
 * typing. A read-only row still looks like the box the answer prints from,
 * which is what makes proofreading possible, and nothing moves when editing
 * starts. See `TypedValueInput`'s `readOnly` for why a read-only input rather
 * than a disabled one.
 *
 * ─── Two ways to fill it, because there are two jobs ────────────────────────
 *
 * Somebody filling a blank form works down it and commits once: that is Edit,
 * and the sticky bar with the unsaved count. Somebody answering one of the
 * reviewing attorney's marks wants that field written and nothing else
 * touched: that is the pencil on the row, which unlocks one field and offers
 * *Save this field*. Both read the same draft and go through the same
 * conversion — two paths that turn a draft string into an answer differently
 * is how a date ends up saved as text on one of them.
 *
 * ─── One part at a time ─────────────────────────────────────────────────────
 *
 * The I-485 is 512 fields across fourteen parts and nobody fills Part 9 while
 * reading Part 1. The part picker is the same control the form rail becomes on
 * a narrow screen, and it carries the same kind of count — what is filled,
 * what is still needed, what is marked — so the part still needing work is
 * findable without opening each one.
 *
 * Holds no draft. Drafts belong to the tab, which is what has to answer "is
 * there anything unsaved?" when someone navigates away.
 */
export function FormView({
  caseId,
  form,
  parts,
  draftForm,
  completion,
  isEditing,
  onEdit,
  onDone,
  onSave,
  onSaveAndDone,
  onDiscard,
  isSaving,
  onRemoveForm,
  onFormHistory,
  onFieldHistory,
  corrections,
  canMark = false,
  isMarking = false,
  onMarkField,
  onComment,
  onSaveField,
  savingFieldKey,
  onDocumentOpen,
}: {
  caseId: string;
  form: CaseForm;
  /** The form's fields grouped into its own parts, in printing order. */
  parts: { partLabel: string | null; fields: CaseFormField[] }[];
  /** The tab's draft for this form. Rows bind to their own field key. */
  draftForm: DraftForm;
  completion: {
    populated: number;
    total: number;
    percentage: number;
    missingRequired: string[];
  };
  /** Whether the whole form accepts typing. Individual fields can too — below. */
  isEditing: boolean;
  onEdit: () => void;
  /**
   * Back to reading. The only way out of editing that does not require saving
   * or discarding first — without it, somebody who opened the editor to look
   * at something is stuck in it until they change the form or leave the tab.
   */
  onDone: () => void;
  onSave: () => void;
  /**
   * Save, and go back to reading.
   *
   * Its own prop rather than `onSave()` then `onDone()` here, because the two
   * have to be sequenced on the *result*: leaving the editor the moment the
   * request goes out drops somebody back into a read-only form that still
   * shows their unsaved values, with nothing on screen saying the save failed.
   */
  onSaveAndDone: () => void;
  onDiscard: () => void;
  isSaving: boolean;
  /** Takes the form off this matter. The catalogue entry is untouched. */
  onRemoveForm: () => void;
  onFormHistory: () => void;
  onFieldHistory: (field: CaseFormField) => void;
  /** Every mark on *this* form. The tab filters the package's list down. */
  corrections?: FormCorrection[];
  /** Whether the viewer may mark a field. Attorneys only. */
  canMark?: boolean;
  isMarking?: boolean;
  /**
   * Raise a mark, which happens on the printed page and nowhere else.
   *
   * *Review on the form* is the review: the attorney reads the filing as it
   * prints, clicks the box that is wrong and writes the note beside it. The
   * field list below is where the mark is then read and answered, so it renders
   * the notes and offers no way to raise one — a review of a government form is
   * a review of the paper, not of a list of keys and values.
   */
  onMarkField?: (
    field: CaseFormField,
    input: { color: CorrectionColor; note: string },
  ) => void;
  /** Answering a mark in the PDF view, where the marks are read beside the page. */
  onComment?: (correction: FormCorrection, body: string) => void;
  /** Save one field rather than the whole form. */
  onSaveField?: (field: CaseFormField) => void;
  savingFieldKey?: string | null;
  /**
   * Whether a document view is on screen, for a parent that gives it room.
   *
   * The tab folds its forms list away on this. Announced rather than owned
   * upward — see `showView`.
   */
  onDocumentOpen?: (isOpen: boolean) => void;
}) {
  const definition = form.definition;
  const marks = useMarks(corrections);
  const missing = useMemo(
    () => new Set(completion.missingRequired),
    [completion.missingRequired],
  );

  /**
   * The whole form, flat.
   *
   * The parts are how the *fields* are read — one at a time, because the I-485
   * is 512 of them — but the PDF is read by page, and a page holds boxes from
   * whatever parts print on it. So the PDF view gets all of them and looks a
   * box's field up by key.
   */
  const allFields = useMemo(
    () => parts.flatMap((part) => part.fields),
    [parts],
  );

  /**
   * Which of the three surfaces is on screen.
   *
   * `fields` is the form itself, `pdf` is the browser's viewer over the filed
   * document, `review` is the page-by-page canvas the marks are placed on. See
   * `form-pdf-view.tsx` for why the last two are not one view.
   *
   * Held here and reset by the `key` this component is given, so choosing to
   * see the I-130's PDF does not open the I-485's the moment somebody switches
   * forms — see the note in `FormPdfView` about state outliving its subject.
   */
  const [view, setView] = useState<"fields" | "pdf" | "review">("fields");
  const showPdf = view !== "fields";

  /*
    Announced rather than lifted.

    The tab folds its forms list away while a document is up, and the state
    that decides that has to live there — but the *view* must not, because it
    would then outlive the form it describes and open the I-130's PDF on the
    I-485. (The same trap the PDF fallback fell into; see `form-pdf-view.tsx`.)
    So the view stays here, where the `key` on this component resets it, and
    the tab is told.

    Computed before the setter rather than inside the updater: React may call an
    updater twice, and telling somebody something is a side effect.
  */
  const showView = (next: typeof view) => {
    setView(next);
    onDocumentOpen?.(next !== "fields");
  };

  /** Which part is on screen, by position — see `groupByPart` on why not label. */
  const [partIndex, setPartIndex] = useState(0);
  const part = parts[partIndex] ?? parts[0] ?? null;

  /**
   * Fields unlocked one at a time, while the rest of the form stays read-only.
   *
   * A set rather than a single key: answering three marks in one part is one
   * piece of work, and making each one re-lock the last would turn it into
   * three. Cleared whenever form-wide editing starts or stops, so the two ways
   * of editing never leave a row in a state neither of them explains.
   */
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const toggleUnlocked = (fieldKey: string) => {
    /*
      Closing a row puts back what is stored.

      The pencil is "this field, and nothing else touched" — so abandoning it
      has to leave nothing behind. Without this, typing in an unlocked row and
      closing it left the value sitting in the draft: invisible, because the
      unsaved bar belongs to form-wide editing, and written by the next Save
      form without anybody having chosen it.

      Outside the state updater deliberately. React may call an updater twice,
      and a reset is a side effect, not a reducer.
    */
    if (unlocked.has(fieldKey)) draftForm.resetField(fieldName(fieldKey));

    setUnlocked((was) => {
      const next = new Set(was);
      if (!next.delete(fieldKey)) next.add(fieldKey);
      return next;
    });
  };

  const startEditing = () => {
    setUnlocked(new Set());
    onEdit();
  };
  const stopEditing = () => {
    setUnlocked(new Set());
    onDone();
  };

  const partOptions = useMemo(
    () =>
      parts.map((entry, index) => ({
        value: String(index),
        label: partTitle(entry.partLabel),
        sublabel: partSublabel(entry, missing, marks),
      })),
    [parts, missing, marks],
  );

  /*
    The fields, as one element, because the PDF view falls back to them.

    A form with no blank on file or no boxes mapped is a normal state — the
    catalogue is maintained per edition and a new form arrives before its
    mapping does — so Preview PDF shows what the form actually says rather
    than an error.
  */
  const body = (
    <>
      <CompletionBar
        filled={completion.populated}
        total={completion.total}
        requiredMissing={completion.missingRequired.length}
        noun="fields"
      />

      <Box mt={3}>
        <PartSelect
          options={partOptions}
          value={String(partIndex)}
          onChange={(next) => setPartIndex(Number(next))}
        />
      </Box>

      {!part && (
        <Text fontSize="13px" color="fg.muted" py={4}>
          Nothing has been catalogued on the {form.formCode} yet, so there is
          nothing to fill in. Oravanti maintains what is on a form.
        </Text>
      )}

      {part && (
        <Box
          border="1px solid"
          borderColor="border"
          borderRadius="md"
          px={3}
          py={1}
        >
          {/* Even one part is more than a browser builds in a single frame —
              the I-485's Part 9 is 172 fields. See `ChunkedFields`. */}
          <ChunkedFields fields={part.fields}>
            {(rows) =>
              rows.map((field) => (
                <FormFieldRow
                  key={field.fieldKey}
                  field={field}
                  control={draftForm.control}
                  isEditable={isEditing || unlocked.has(field.fieldKey)}
                  // In form-wide editing every row already accepts typing, so
                  // a per-row unlock would be a control that does nothing.
                  onToggleEdit={
                    isEditing ? undefined : () => toggleUnlocked(field.fieldKey)
                  }
                  isMissing={missing.has(field.fieldKey)}
                  disabled={isSaving}
                  onHistory={() => onFieldHistory(field)}
                  corrections={marks.all(field.fieldKey)}
                  /*
                    The row's own pair, and only when the row is the way in.

                    While the whole form is editable the sticky bar is the
                    commit, so a per-row Save beside it would be the same two
                    buttons for one change the other way round — and a per-row
                    Discard would throw away one field's typing while the bar
                    above still counted it.
                  */
                  onSaveField={
                    !isEditing && onSaveField
                      ? () => onSaveField(field)
                      : undefined
                  }
                  onDiscardField={
                    isEditing ? undefined : () => toggleUnlocked(field.fieldKey)
                  }
                  isSavingField={savingFieldKey === field.fieldKey}
                />
              ))
            }
          </ChunkedFields>
        </Box>
      )}

      {/*
        The sticky bar belongs to form-wide editing, and only to it.

        Two ways in, two commits: somebody filling a blank works down it and
        commits once — that is Edit, and this bar. Somebody answering one of the
        reviewing attorney's marks wants that field written and nothing else
        touched — that is the row's pencil and its own *Save this field*.
        Rendering both at once offered two buttons for one change, one of which
        quietly meant "and everything else I have touched".
      */}
      {isEditing && (
        <UnsavedBar
          control={draftForm.control}
          noun="change"
          saveLabel="Save"
          isSaving={isSaving}
          onSave={onSave}
          onDiscard={onDiscard}
          // Save keeps you in the form; Save & done commits and hands it back
          // to reading. One commit, two exits — see the bar's own note.
          done={{ onDone: stopEditing, onSaveAndDone }}
        />
      )}
    </>
  );

  return (
    <>
      <Flex justify="space-between" align="flex-start" gap={3} mb={2}>
        <Box flex={1} minW={0}>
          <Text fontSize="14px" fontWeight="500" color="fg">
            {definition ? `${form.formCode} — ${definition.title}` : form.formCode}
          </Text>
          {definition?.description && (
            <Text fontSize="12px" color="fg.muted" lineHeight="17px" mt={0.5}>
              {definition.description}
            </Text>
          )}
        </Box>

        <HStack gap={0.5} flexShrink={0}>
          {/* Seeing the real blank with the matter's answers on it is what
              somebody came here to do, so it carries the brand button rather
              than sitting as one more outline among three. It reverts to an
              outline while a document is up, where the primary thing to do is
              go back to the form. */}
          <Button
            layerStyle={view === "pdf" ? undefined : "brand-button"}
            size="xs"
            variant={view === "pdf" ? "outline" : undefined}
            borderColor={view === "pdf" ? "border" : undefined}
            h="32px"
            px={4}
            mr={1}
            fontSize="13px"
            fontWeight={view === "pdf" ? "400" : undefined}
            color={view === "pdf" ? "fg.muted" : undefined}
            onClick={() => showView(view === "pdf" ? "fields" : "pdf")}
          >
            {view === "pdf" ? <X size={13} /> : <FileText size={13} />}
            {view === "pdf" ? "Back to the form" : "Preview PDF"}
          </Button>

          {/* The other way of looking at the same document: the pages drawn
              here rather than by the browser, so the attorney's marks can sit
              on the boxes. Offered to everyone, not only to whoever may raise
              a mark — reading what has been marked is most of the work, and it
              is the paralegal who does it. */}
          <Button
            size="xs"
            variant="outline"
            borderColor="border"
            h="32px"
            px={4}
            mr={1}
            fontSize="13px"
            fontWeight="400"
            color={view === "review" ? "fg" : "fg.muted"}
            onClick={() => showView(view === "review" ? "fields" : "review")}
          >
            {view === "review" ? <X size={13} /> : <Flag size={13} />}
            {view === "review" ? "Back to the form" : "Review on the form"}
          </Button>

          {!showPdf &&
            (isEditing ? (
              /*
                An indicator, not a control.

                Leaving the editor used to be a ✕ Done editing here, inches
                from Preview PDF and a scroll away from the sticky bar's
                Discard and Save form — three buttons across two levels
                deciding what happens to one draft, and the one furthest from
                the work was the one that threw it away. Every form-state
                action is in the bar now; this says which state you are in.
              */
              <HStack gap={1.5} h="32px" px={3} mr={1}>
                <Pencil size={12} color="currentColor" />
                <Text fontSize="13px" color="fg.muted">
                  Editing
                </Text>
              </HStack>
            ) : (
              <Button
                size="xs"
                variant="outline"
                borderColor="border"
                h="32px"
                px={4}
                mr={1}
                fontSize="13px"
                fontWeight="400"
                color="fg.muted"
                onClick={startEditing}
              >
                <Pencil size={13} />
                Edit
              </Button>
            ))}

          <IconButton
            aria-label={`History of ${form.formCode}`}
            size="xs"
            variant="ghost"
            color="fg.muted"
            _hover={{ color: "fg" }}
            onClick={onFormHistory}
          >
            <History size={13} />
          </IconButton>
          {/* Off this matter, not out of the catalogue — the label says which,
              because the two are a click apart and only one is reversible. */}
          <IconButton
            aria-label={`Take ${form.formCode} off this matter`}
            size="xs"
            variant="ghost"
            color="fg.muted"
            _hover={{ color: "fg.error" }}
            onClick={onRemoveForm}
          >
            <Trash2 size={13} />
          </IconButton>
        </HStack>
      </Flex>

      {view === "fields" && body}

      {view === "pdf" && (
        <FormPdfPreview
          caseId={caseId}
          formCode={form.formCode}
          fallback={body}
        />
      )}

      {view === "review" && (
        <FormReviewView
          caseId={caseId}
          formCode={form.formCode}
          fields={allFields}
          corrections={corrections}
          canMark={canMark}
          isMarking={isMarking}
          onMarkField={onMarkField}
          onComment={onComment}
          fallback={body}
        />
      )}
    </>
  );
}

/**
 * The count under a part's name in the picker.
 *
 * Three facts, and each answers a question somebody actually has about a part
 * they cannot see: how much of it is filled, whether anything required is
 * still missing, and whether the reviewing attorney has marked anything in it.
 * The last is why this is worth building rather than showing a field count —
 * a mark in a part nobody has open is a mark nobody acts on.
 */
function partSublabel(
  part: { partLabel: string | null; fields: CaseFormField[] },
  missing: Set<string>,
  marks: Marks,
) {
  const filled = part.fields.filter(
    (field) => field.value != null && field.value !== "",
  ).length;

  const needed = part.fields.filter((field) =>
    missing.has(field.fieldKey),
  ).length;

  const marked = part.fields.filter(
    (field) => marks.field(field.fieldKey).length > 0,
  ).length;

  return [
    `${filled}/${part.fields.length}`,
    needed > 0 ? `${needed} needed` : null,
    marked > 0 ? `${marked} to correct` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * The form's marks, indexed the ways the screen reads them.
 *
 * Built once per form rather than filtered per row: a form is hundreds of
 * fields, and a `.filter()` inside the row is that many passes over the same
 * list on every render.
 *
 * `field` is the *open* ones — what still needs doing, which is what a stripe
 * and a count are about. `all` is every mark on a field including the resolved
 * ones, because the row renders the thread.
 *
 * Both are keyed by field, because a mark is raised on a box of the printed
 * page and a box is a field. There is no part index: the whole-section mark it
 * served was taken out with the field list's flag.
 */
type Marks = {
  field: (fieldKey: string) => FormCorrection[];
  all: (fieldKey: string) => FormCorrection[];
};

function useMarks(corrections: FormCorrection[] | undefined): Marks {
  return useMemo(() => {
    const byField = new Map<string, FormCorrection[]>();
    const everyField = new Map<string, FormCorrection[]>();

    for (const correction of corrections ?? []) {
      const key = correction.fieldKey;
      if (!key) continue;
      everyField.set(key, [...(everyField.get(key) ?? []), correction]);
      if (correction.status !== "open") continue;
      byField.set(key, [...(byField.get(key) ?? []), correction]);
    }

    return {
      field: (fieldKey) => byField.get(fieldKey) ?? [],
      all: (fieldKey) => everyField.get(fieldKey) ?? [],
    };
  }, [corrections]);
}
