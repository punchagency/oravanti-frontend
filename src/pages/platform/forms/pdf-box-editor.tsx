import type { CatalogueField, CatalogueForm, FormPdfBox } from "@/api/platform";
import { CompletionBar } from "@/components/questionnaire/completion-bar";
import { UnsavedBar } from "@/components/questionnaire/unsaved-bar";
import {
  fieldName,
  type DraftForm,
} from "@/components/questionnaire/use-draft-form";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ChunkedFields } from "@/components/forms/chunked-fields";
import { filterFields } from "@/components/forms/field-filter";
import { FormSearch } from "@/components/forms/form-search";
import { partTitle } from "@/components/forms/part-address";
import {
  buildBoxIndex,
  mappingKey,
  mappingOptions,
  mappingTargets,
  rankBoxes,
  selectedBoxOption,
  UNMAPPED_BOX,
  type BoxIndex,
} from "./pdf-box-matching";
import { Badge, Box, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import { useDebounce } from "@uidotdev/usehooks";
import { useMemo, useState } from "react";
import { useController } from "react-hook-form";

/**
 * Which box on the official blank each field prints into.
 *
 * ─── Why this screen exists ─────────────────────────────────────────────────
 *
 * A field key names a *datum* — `beneficiary.date_of_birth` — and says nothing
 * about paper. The blank has 438 boxes with names like
 * `form1[0].#subform[1].Pt4Line9_DateOfBirth[0]`. Something has to say which is
 * which, once per form edition, and it has to be a person: the names are close
 * enough to guess wrongly, and a date in the wrong box is a rejected filing
 * rather than a visible bug.
 *
 * So the machine ranks and the person decides. Boxes whose names resemble the
 * field are offered first, which turns 438 options into two or three worth
 * reading, and nothing is chosen automatically.
 *
 * ─── Most rows arrive already mapped ────────────────────────────────────────
 *
 * Since catalogues are extracted from the blank, a field generated from a box
 * comes with that box already set — this screen is no longer where the mapping
 * is *done*, it is where a shared datum is attached to a box the extractor
 * could only name form-locally. That is still a judgement, and still a person's.
 *
 * ─── A choice is several rows ───────────────────────────────────────────────
 *
 * USCIS prints one checkbox per option, so a choice field is mapped one answer
 * at a time and appears here as a row per option under its question. See
 * `mappingOptions` for why a dropdown is not one of these.
 */
export function PdfBoxEditor({
  form,
  partLabel,
  fields,
  boxes,
  sharedBoxes,
  draftForm,
  onSave,
  onDiscard,
  isSaving,
}: {
  form: CatalogueForm;
  /** The part on screen. Null is the part whose fields carry no label. */
  partLabel: string | null;
  fields: CatalogueField[];
  /**
   * Every box on the blank, not only this part's.
   *
   * Deliberately not narrowed: a field in Part 1 legitimately prints into a
   * box in Part 14 — that is what a continuation sheet is — so narrowing the
   * targets to the part would make the overflow mappings unreachable.
   */
  boxes: FormPdfBox[];
  /**
   * The targets that print into more than one box, keyed by `mappingKey`.
   * Those rows list their boxes instead of offering a select — see `BoxRow`.
   */
  sharedBoxes: Record<string, string[]>;
  /** The page's mapping draft. Rows bind to their own field key within it. */
  draftForm: DraftForm;
  onSave: () => void;
  onDiscard: () => void;
  isSaving: boolean;
}) {
  // Every target on the part, not the searched subset: the bar reports how
  // much of the *part* is mapped, which is not a thing a search should change.
  // Across parts, the picker above carries the same count for each.
  const targets = fields.flatMap(mappingTargets);

  // Once per form: the word frequencies are a property of the whole box list,
  // so rebuilding them per row would be four hundred passes over 736 names for
  // the same answer.
  const boxIndex = useMemo(() => buildBoxIndex(boxes), [boxes]);

  /*
    Debounced, not immediate.

    Filtering is cheap; re-rendering the rows behind it is not, and a keystroke
    that rebuilds them is the lag this tab has already been through once. 200ms
    is long enough that a typed word costs one pass rather than one per letter.
  */
  const [search, setSearch] = useState("");
  const query = useDebounce(search, 200);

  // A choice's options are searched too — this screen is the one place a
  // person is looking for the row that holds "Spouse" rather than for the
  // question it belongs to.
  const shown = useMemo(
    () =>
      filterFields(
        fields,
        query,
        (field) =>
          `${field.label} ${field.fieldKey} ${(mappingOptions(field) ?? []).join(" ")}`,
      ),
    [fields, query],
  );

  /*
    The rows, built only when what they show changes.

    Debouncing settles what is *filtered*; it does nothing about what is
    *rendered*. Every keystroke still sets `search`, which re-renders this
    component, and building the rows inline rebuilt all of them for React to
    reconcile — and a choice field is a row per option here, each with its own
    combobox over the form's several hundred boxes. Held as elements, the same
    array comes back and React skips the subtree.
  */
  const rows = useMemo(
    () =>
      shown.map((field) => (
        <FieldRows
          key={field.id}
          field={field}
          boxIndex={boxIndex}
          sharedBoxes={sharedBoxes}
          control={draftForm.control}
          disabled={isSaving}
        />
      )),
    [shown, boxIndex, sharedBoxes, draftForm.control, isSaving],
  );

  return (
    <>
      <Flex justify="space-between" align="flex-start" gap={3} mb={1}>
        <Box minW={0}>
          <Text fontSize="14px" fontWeight="500" color="fg">
            {form.formCode} — {partTitle(partLabel)}
          </Text>
          <Text fontSize="12px" color="fg.muted" lineHeight="17px" mt={0.5}>
            Where each answer prints on the official {form.formCode}. The blank
            is the same document for everyone, so this is set once per edition
            and applies to every matter on every firm.
          </Text>
        </Box>
        <Badge size="sm" variant="subtle" colorPalette="gray" fontSize="10px">
          {boxes.length} boxes
        </Badge>
      </Flex>

      <MappedCount targets={targets} draftForm={draftForm} />

      <FormSearch
        value={search}
        onChange={setSearch}
        placeholder="Find a field in this part, a key or an answer…"
        matches={shown.length}
        total={fields.length}
      />

      {/* A choice is a row per option here, so a part's mapping rows outnumber
          even its fields — see `ChunkedFields`. The rows come from the memo
          above, so a keystroke in the search box costs one input render rather
          than a rebuild of every mapping row on the part. */}
      <ChunkedFields fields={shown}>
        {(built) => (
          <VStack gap={0} align="stretch">
            {rows.slice(0, built.length)}
          </VStack>
        )}
      </ChunkedFields>

      {shown.length === 0 && (
        <Text fontSize="13px" color="fg.muted" py={4}>
          No field on this part matches “{query}”.
        </Text>
      )}

      <UnsavedBar
        control={draftForm.control}
        noun="mapping"
        saveLabel="Save mappings"
        isSaving={isSaving}
        onSave={onSave}
        onDiscard={onDiscard}
      />
    </>
  );
}

/**
 * How much of the form can actually print, counted from the draft.
 *
 * Unlike the completion bars elsewhere this counts what is *typed*, because
 * mapping is the work being done on this screen — a person wants to watch the
 * unmapped count fall as they go.
 */
function MappedCount({
  targets,
  draftForm,
}: {
  targets: { field: CatalogueField; value: string | null }[];
  draftForm: DraftForm;
}) {
  const values = draftForm.watch();
  const mapped = targets.filter((target) => {
    const value =
      values[fieldName(mappingKey(target.field.fieldKey, target.value))];
    return value && value !== UNMAPPED_BOX;
  }).length;

  return (
    <CompletionBar
      filled={mapped}
      total={targets.length}
      requiredMissing={targets.length - mapped}
      noun="boxes mapped"
    />
  );
}

/**
 * One field's mapping rows.
 *
 * A whole-datum field is a single row and reads exactly as it always has. A
 * choice becomes a heading for the question and a row per answer, because that
 * is the shape of the decision: each of its options has its own checkbox on the
 * blank, and each has to be pointed at one.
 */
function FieldRows({
  field,
  boxIndex,
  sharedBoxes,
  control,
  disabled,
}: {
  field: CatalogueField;
  boxIndex: BoxIndex;
  sharedBoxes: Record<string, string[]>;
  control: DraftForm["control"];
  disabled?: boolean;
}) {
  const options = mappingOptions(field);

  if (!options) {
    return (
      <BoxRow
        field={field}
        fieldValue={null}
        label={field.label}
        boxIndex={boxIndex}
        sharedBoxes={sharedBoxes}
        control={control}
        disabled={disabled}
      />
    );
  }

  return (
    <Box
      py={3}
      borderBottom="1px solid"
      borderColor="border.muted"
      _last={{ borderBottom: "none" }}
    >
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
      <Text fontSize="11px" color="fg.subtle" fontFamily="mono" mt={0.5} mb={1}>
        {field.fieldKey} · one box per answer
      </Text>

      <VStack gap={0} align="stretch" pl={{ base: 0, md: 4 }}>
        {options.map((option) => (
          <BoxRow
            key={option}
            field={field}
            fieldValue={option}
            label={option}
            boxIndex={boxIndex}
            sharedBoxes={sharedBoxes}
            control={control}
            disabled={disabled}
          />
        ))}
      </VStack>
    </Box>
  );
}

function BoxRow({
  field,
  fieldValue,
  label,
  boxIndex,
  sharedBoxes,
  control,
  disabled,
}: {
  field: CatalogueField;
  /** The answer that marks this box, or null when the box holds the datum. */
  fieldValue: string | null;
  /** What the left column reads — the field, or the answer. */
  label: string;
  boxIndex: BoxIndex;
  /** See `PdfBoxEditor`. This row's entry, if it has one, is its box list. */
  sharedBoxes: Record<string, string[]>;
  control: DraftForm["control"];
  disabled?: boolean;
}) {
  const { field: input, fieldState } = useController({
    control,
    name: fieldName(mappingKey(field.fieldKey, fieldValue)),
  });

  /**
   * Whether this row has ever been opened.
   *
   * Ranking is per row, because the ordering is relative to *this* field — but
   * a form catalogued from its blank has four hundred rows, and ranking every
   * one of them upfront builds three hundred thousand options that nobody has
   * asked to see. So a closed row carries only the option it is displaying, and
   * the full list is built the first time somebody opens it.
   */
  const [hasOpened, setHasOpened] = useState(false);
  const value = input.value ?? UNMAPPED_BOX;

  /** The boxes this datum prints into, when there is more than one of them. */
  const shared = sharedBoxes[mappingKey(field.fieldKey, fieldValue)];

  const options = useMemo(
    () =>
      hasOpened
        ? rankBoxes(field, boxIndex, fieldValue)
        : [selectedBoxOption(value, boxIndex)],
    [hasOpened, field, boxIndex, fieldValue, value],
  );

  return (
    <Flex
      gap={4}
      py={3}
      borderBottom="1px solid"
      borderColor="border.muted"
      _last={{ borderBottom: "none" }}
      align={{ base: "stretch", md: "center" }}
      direction={{ base: "column", md: "row" }}
    >
      <Box flex={{ base: "none", md: "0 0 38%" }} minW={0}>
        <HStack gap={1.5} align="baseline" flexWrap="wrap">
          <Text
            fontSize="13px"
            color={fieldValue === null ? "fg" : "fg.muted"}
            lineHeight="17px"
          >
            {label}
          </Text>
          {fieldValue === null && field.isRequired && (
            <Text fontSize="11px" color="fg.error" lineHeight="1">
              required
            </Text>
          )}
        </HStack>
        {fieldValue === null && (
          <Text fontSize="11px" color="fg.subtle" fontFamily="mono" mt={0.5}>
            {field.fieldKey}
          </Text>
        )}
      </Box>

      <Flex flex={1} minW={0} gap={2} align="center">
        {shared ? (
          <SharedBoxes boxes={shared} />
        ) : (
          <>
            <Box flex={1} minW={0}>
              <SearchableSelect
                options={options}
                value={value}
                onOpenChange={(open) => {
                  if (open) setHasOpened(true);
                }}
                onChange={input.onChange}
                placeholder="Prints nowhere"
                disabled={disabled}
                clearable={false}
                ariaLabel={`Box for ${label}`}
              />
            </Box>
            {fieldState.isDirty && (
              <Badge
                size="sm"
                variant="subtle"
                colorPalette="orange"
                fontSize="10px"
                flexShrink={0}
              >
                unsaved
              </Badge>
            )}
          </>
        )}
      </Flex>
    </Flex>
  );
}

/**
 * The boxes a datum prints into, where there is more than one — read-only.
 *
 * A blank asks the same thing twice. The I-130 wants the date of the marriage
 * in Part 2, from the petitioner, and again in Part 4, from the beneficiary;
 * one date, two boxes, and `fillForCase` prints both, so both are mapped.
 *
 * A select can name exactly one box. Offering one here would save that box and
 * delete the others — `setMapping` addresses the *datum*, so it clears every
 * row for the key before writing — and the second box would stop printing with
 * nothing on screen having said so. That is the failure this whole screen
 * exists to prevent, so the row shows the boxes and offers no control.
 *
 * The pairing is made by giving two extracted fields the same `fieldKey`,
 * which is done — and undone — on the Fields view. Both doors are open
 * everywhere else on this screen; this is the one row that has to send you
 * somewhere else.
 */
function SharedBoxes({ boxes }: { boxes: string[] }) {
  return (
    <Box flex={1} minW={0}>
      <VStack gap={0.5} align="stretch">
        {boxes.map((box) => (
          <Text
            key={box}
            fontSize="12px"
            fontFamily="mono"
            color="fg.muted"
            lineHeight="16px"
            wordBreak="break-all"
          >
            {box}
          </Text>
        ))}
      </VStack>
      <Text fontSize="11px" color="fg.subtle" lineHeight="15px" mt={1}>
        Prints into {boxes.length} boxes, so no single box can be chosen here.
        Change what each of those fields holds on the Fields view.
      </Text>
    </Box>
  );
}
