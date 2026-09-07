import type { CatalogueForm, FieldMapEntry } from "@/api/platform";
import { UnsavedBar } from "@/components/questionnaire/unsaved-bar";
import {
  fieldName,
  type DraftForm,
} from "@/components/questionnaire/use-draft-form";
import { useDebounce } from "@uidotdev/usehooks";
import { useMemo, useState } from "react";
import { useController } from "react-hook-form";

import { ChunkedFields } from "@/components/forms/chunked-fields";
import { filterFields } from "@/components/forms/field-filter";
import { FormSearch } from "@/components/forms/form-search";
import { partTitle } from "@/components/forms/part-address";
import {
  SearchableSelect,
  type SearchableOption,
} from "@/components/ui/searchable-select";
import { Badge, Box, Checkbox, Flex, HStack, Text } from "@chakra-ui/react";

/**
 * Where every field on *one* form gets its answer.
 *
 * The form's Contents view shows what a form asks; this shows what will fill
 * it. It is the view to open when a box came out blank, or came out wrong, and
 * someone needs to know which question is behind it.
 *
 * ─── One row here decides it for every firm ─────────────────────────────────
 *
 * This screen used to be reachable from a matter, which made a global decision
 * look like a local one — a mapping was never scoped to the case it was edited
 * from. Addressing it by form code is the honest shape: what is being wired is
 * the I-485, not one firm's copy of it, and there are no copies.
 *
 * ─── One part at a time, saved on a press ───────────────────────────────────
 *
 * The I-485 is 512 fields; rendering them all at once gave a wall nobody could
 * work through, and a select that wrote on change meant a mis-click was already
 * saved. So the page fetches and shows one part, and the Save commits that
 * part — same shape as the Contents editor, rows and a sticky Save with the
 * unsaved count.
 *
 * The cross-form question this view exists to answer — "where are the fields
 * nothing fills?" — moved up to the part picker, which carries a sourced count
 * per part. That is a better answer than the filter below ever was: it shows
 * the holes without anybody having to search for them.
 *
 * Holds no state beyond its own filters: drafts belong to the page, which is
 * what answers "is there anything unsaved?" when someone navigates away.
 */

/** The select's value for "nothing fills this". Not a question id, so it cannot collide. */
export const UNMAPPED = "__none__";

export function FieldMapEditor({
  form,
  partLabel,
  draftForm,
  fields,
  questionOptions,
  onSave,
  onDiscard,
  isSaving,
}: {
  form: CatalogueForm;
  /** The part on screen. Null is the part whose fields carry no label. */
  partLabel: string | null;
  /** The page's draft form for this view. Rows bind to their own field key. */
  draftForm: DraftForm;
  fields: FieldMapEntry[];
  /** Every platform question a field can be filled from, plus "Nothing". */
  questionOptions: SearchableOption[];
  onSave: () => void;
  onDiscard: () => void;
  isSaving: boolean;
}) {
  const unfed = fields.filter((f) => f.source === "none").length;
  const broken = fields.filter((f) => f.isBroken).length;

  /*
    Debounced, not immediate.

    Filtering is cheap; re-rendering the rows behind it is not, and a keystroke
    that rebuilds them is the lag this view has already been through once. 200ms
    is long enough that a typed word costs one pass rather than one per letter.
  */
  const [search, setSearch] = useState("");
  const query = useDebounce(search, 200);

  /*
    The whole job, most days.

    Maintaining a catalogue is a matter of closing the gap between "fields on
    the form" and "fields something fills", and on a 512-field form the twenty
    that are still unfed are invisible in the list. This is the difference
    between scrolling the I-485 looking for holes and being handed them.
  */
  const [unfedOnly, setUnfedOnly] = useState(false);

  // The question behind a field is as good a way to find it as its own name —
  // "which fields does the date of birth question fill?" is the question this
  // view exists to answer.
  const shown = useMemo(() => {
    const narrowed = unfedOnly
      ? fields.filter((f) => f.source === "none" || f.isBroken)
      : fields;

    return filterFields(
      narrowed,
      query,
      (field) =>
        `${field.label} ${field.fieldKey} ${field.question?.label ?? ""}`,
    );
  }, [fields, query, unfedOnly]);

  /*
    The rows, built only when what they show changes.

    Debouncing settles what is *filtered*; it does nothing about what is
    *rendered*. Every keystroke still sets `search`, which re-renders this
    component, and building the rows inline rebuilt every one of them for React
    to reconcile — each carrying an Ark combobox of its own — while the list was
    identical to the letter before. Held as elements, the same array comes back
    and React skips the subtree.

    The same reasoning the file's note on `FieldMapRow` gives for binding each
    row to its own field, one level up: this is the render nobody asked for.
  */
  const rows = useMemo(
    () =>
      shown.map((field) => (
        <FieldMapRow
          key={field.fieldKey}
          field={field}
          formCode={form.formCode}
          questionOptions={questionOptions}
          control={draftForm.control}
          disabled={isSaving}
        />
      )),
    [shown, form.formCode, questionOptions, draftForm.control, isSaving],
  );

  return (
    <>
      <Box mb={4}>
        <Text fontSize="14px" fontWeight="500" color="fg">
          {form.formCode} — {partTitle(partLabel)}
        </Text>
        <Text fontSize="12px" color="fg.muted" lineHeight="17px" mt={0.5}>
          {fields.length} field{fields.length === 1 ? "" : "s"} ·{" "}
          {unfed > 0 ? (
            <Text as="span" color="fg.warning">
              {unfed} with nothing to fill {unfed === 1 ? "it" : "them"}
            </Text>
          ) : (
            "every field has a source"
          )}
          {broken > 0 && (
            <Text as="span" color="fg.error">
              {" "}
              · {broken} pointing at a deleted question
            </Text>
          )}
        </Text>
      </Box>

      <FormSearch
        value={search}
        onChange={setSearch}
        placeholder="Find a field in this part, or the question behind it…"
        matches={shown.length}
        total={fields.length}
      />

      <Checkbox.Root
        size="sm"
        mb={3}
        checked={unfedOnly}
        onCheckedChange={(details) => setUnfedOnly(details.checked === true)}
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label fontSize="12px" color="fg.muted">
          Show only fields nothing fills
        </Checkbox.Label>
      </Checkbox.Root>

      {/* This view puts a dropdown of every question into every row, so even
          one part is more than a browser will build in a single frame — see
          `ChunkedFields`. The rows come from the memo above, so a keystroke in
          the search box costs one input render rather than ninety-six. */}
      <ChunkedFields fields={shown}>
        {(built) => rows.slice(0, built.length)}
      </ChunkedFields>

      {fields.length === 0 && (
        <Text fontSize="13px" color="fg.muted" py={4}>
          Nothing on this part of {form.formCode}, so there is nothing to wire
          up here.
        </Text>
      )}

      {fields.length > 0 && shown.length === 0 && (
        <Text fontSize="13px" color="fg.muted" py={4}>
          No field on this part matches the current filters.
        </Text>
      )}

      <UnsavedBar
        control={draftForm.control}
        noun="change"
        saveLabel="Save sources"
        isSaving={isSaving}
        onSave={onSave}
        onDiscard={onDiscard}
      />
    </>
  );
}

/**
 * One field and the question that fills it.
 *
 * This view puts a dropdown on every field and a form has dozens of them, so
 * the row binds to its own field through `useController` — choosing a source
 * in one row re-renders that row and leaves the rest alone. It used to be a
 * memoized component fed a value and a callback, which worked only for as long
 * as every prop upstream stayed referentially stable; one inline arrow at the
 * call site was enough to undo it silently.
 */
function FieldMapRow({
  field,
  formCode,
  questionOptions,
  control,
  disabled,
}: {
  field: FieldMapEntry;
  formCode: string;
  questionOptions: SearchableOption[];
  /** The form's draft form. This row binds to `field.fieldKey` within it. */
  control: DraftForm["control"];
  disabled?: boolean;
}) {
  const { field: input, fieldState } = useController({
    control,
    name: fieldName(field.fieldKey),
  });

  return (
    <Flex
      gap={4}
      py={3}
      borderBottom="1px solid"
      borderColor="border"
      _last={{ borderBottom: "none" }}
      align={{ base: "stretch" }}
      direction={{ base: "column" }}
    >
      <Box flex={{ base: "none", md: "0 0 38%" }} minW={0}>
        <HStack gap={1.5} align="baseline" flexWrap="wrap">
          <Text fontSize="13px" color="fg" lineHeight="17px">
            {field.label}
          </Text>

          {field.isRequired && (
            <Text fontSize="11px" color="fg.error" lineHeight="1">
              required
            </Text>
          )}
        </HStack>

        <Text fontSize="11px" color="fg.subtle" fontFamily="mono" mt={0.5}>
          {field.fieldKey}
        </Text>

        <Box>
          {fieldState.isDirty ? (
            <Badge
              size="sm"
              variant="subtle"
              colorPalette="orange"
              fontSize="10px"
              flexShrink={0}
            >
              unsaved
            </Badge>
          ) : (
            <SourceBadge field={field} />
          )}
        </Box>
      </Box>

      {/*
        Searchable, because the list is the whole questionnaire.

        Around 250 questions can feed a field, and a plain select answers "which
        one is the date of birth?" with a scroll through all of them. The
        section rides along as each row's sublabel and is searched with the
        label, so a half-remembered question is still findable.

        Not clearable: "nothing fills this" is an option in the list, and it is
        a decision — clearing would leave the draft holding an empty string,
        which is neither a question nor that decision.
      */}
      <SearchableSelect
        options={questionOptions}
        value={input.value ?? UNMAPPED}
        onChange={input.onChange}
        placeholder="Nothing fills this"
        searchPlaceholder="Search questions"
        emptyText="No question matches"
        disabled={disabled}
        clearable={false}
        ariaLabel={`Source for ${formCode} ${field.label}`}
      />
    </Flex>
  );
}

/**
 * How the connection was made, not whether one exists — the select beside it
 * already shows that. "Standard" is the case that needs no thought; the other
 * two are the ones worth a second look before filing.
 */
function SourceBadge({ field }: { field: FieldMapEntry }) {
  if (field.isBroken) {
    return (
      <Badge
        size="sm"
        variant="subtle"
        colorPalette="red"
        fontSize="10px"
        flexShrink={0}
      >
        broken
      </Badge>
    );
  }

  if (field.source === "mapping") {
    return (
      <Badge
        size="sm"
        variant="subtle"
        colorPalette={field.overridesSharedKey ? "orange" : "purple"}
        fontSize="10px"
        flexShrink={0}
      >
        {field.overridesSharedKey ? "override" : "mapped"}
      </Badge>
    );
  }

  if (field.source === "shared_key") {
    return (
      <Badge
        size="sm"
        variant="subtle"
        colorPalette="gray"
        fontSize="10px"
        flexShrink={0}
      >
        standard
      </Badge>
    );
  }

  return (
    <Badge
      size="sm"
      variant="subtle"
      colorPalette="yellow"
      fontSize="10px"
      flexShrink={0}
    >
      unfed
    </Badge>
  );
}
