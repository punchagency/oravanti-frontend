import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Text,
} from "@chakra-ui/react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";

import type { CatalogueField, CatalogueForm } from "@/api/platform";
import { ChunkedFields } from "@/components/forms/chunked-fields";
import { filterFields } from "@/components/forms/field-filter";
import { FormSearch } from "@/components/forms/form-search";
import { partTitle } from "@/components/forms/part-address";
import { PlatformSectionHeader } from "../page-header";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { questionTypeLabel } from "@/utils/question-types";

/**
 * What is *on* a form — the counterpart of the firm's Contents view.
 *
 * The two look alike and answer opposite questions. A firm opens Contents to
 * fill a form in: it sees inputs, and a value in each. This shows the same list
 * with no inputs at all, because what is being edited here is the form itself —
 * which fields exist, what they are called, which part they sit in.
 *
 * That is the governing rule made visible: a form is a government blank. The
 * firm types into it; only Oravanti says what the boxes are.
 *
 * One part's worth, because that is what the page fetched — see the note on
 * `PartSelect`. A field added here lands in the part on screen, which is why
 * the dialog is given its label.
 *
 * ─── No draft, no Save ──────────────────────────────────────────────────────
 *
 * Unlike every other editor in this tier, edits here go through a dialog and
 * commit one at a time. Adding a field is not a keystroke — it is a decision
 * about a government form that every firm will see — and batching those behind
 * a Save would make an accidental one as cheap as a typo. The wiring screens
 * batch because a person really does work down a form setting fifty sources in
 * one sitting; nobody adds fifty fields in one sitting.
 */
export function FieldListEditor({
  form,
  partLabel,
  fields,
  onAdd,
  onEdit,
  onDelete,
  isBusy,
}: {
  form: CatalogueForm;
  /** The part on screen. Null is the part whose fields carry no label. */
  partLabel: string | null;
  fields: CatalogueField[];
  onAdd: () => void;
  onEdit: (field: CatalogueField) => void;
  onDelete: (field: CatalogueField) => void;
  isBusy: boolean;
}) {
  const { showConfirm } = useConfirmDialog();

  const [search, setSearch] = useState("");
  const query = useDebounce(search, 200);

  const shown = useMemo(
    () =>
      filterFields(
        fields,
        query,
        (field) => `${field.label} ${field.fieldKey}`,
      ),
    [fields, query],
  );

  /*
    The widest blast radius on this screen, so it says so in those words.

    "Every firm" is the part somebody needs to read before pressing it — this
    is not a field on a matter, it is a field on the form itself.
  */
  const confirmRemove = useCallback(
    (field: CatalogueField) =>
      showConfirm({
        title: "Remove field",
        description: `Every firm loses "${field.label}" from the ${form.formCode}. Values already typed into it on any matter stay in that matter's record — the field simply stops printing.`,
        confirmLabel: "Remove field",
        cancelLabel: "Cancel",
        onConfirm: () => onDelete(field),
      }),
    // Stable, because the rows below are memoized and a handler rebuilt on
    // every render would rebuild all of them with it. `showConfirm` is a
    // zustand selector, so it is stable to begin with.
    [showConfirm, form.formCode, onDelete],
  );

  /*
    The rows, built only when what they show changes.

    Debouncing settles what is *filtered*; it does nothing about what is
    *rendered*. Every keystroke still sets `search`, which re-renders this
    component and rebuilt every row for React to reconcile — while the list was
    identical to the letter before. Held as elements, the same array comes back
    and React skips the subtree.
  */
  const rows = useMemo(
    () =>
      shown.map((field) => (
        <Flex
          key={field.id}
          gap={3}
          py={2.5}
          align="center"
          borderBottom="1px solid"
          borderColor="border"
          _last={{ borderBottom: "none" }}
        >
          <Box flex="1" minW={0}>
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
            <HStack gap={2} mt={0.5}>
              <Text fontSize="11px" color="fg.subtle" fontFamily="mono">
                {field.fieldKey}
              </Text>
              <Badge
                size="sm"
                variant="subtle"
                colorPalette="gray"
                fontSize="10px"
              >
                {questionTypeLabel(field.type)}
              </Badge>
            </HStack>
          </Box>

          <HStack gap={1} flexShrink={0}>
            <IconButton
              size="xs"
              variant="ghost"
              aria-label={`Edit ${field.label}`}
              disabled={isBusy}
              onClick={() => onEdit(field)}
            >
              <Pencil size={13} />
            </IconButton>
            <IconButton
              size="xs"
              variant="ghost"
              colorPalette="red"
              aria-label={`Remove ${field.label}`}
              disabled={isBusy}
              onClick={() => confirmRemove(field)}
            >
              <Trash2 size={13} />
            </IconButton>
          </HStack>
        </Flex>
      )),
    [shown, isBusy, onEdit, confirmRemove],
  );

  return (
    <>
      {/* No form code and no title here: the page header two rows up already
          says both, and repeating them made the page look like it had two
          headings and no section. */}
      <PlatformSectionHeader
        title={partTitle(partLabel)}
        description={
          fields.length === 0
            ? "Nothing here yet. Add a field, or extract them from the blank."
            : `${fields.length} field${fields.length === 1 ? "" : "s"}, in the order they print. Every firm sees this list.`
        }
        actions={
          <Button
            size="xs"
            layerStyle="brand-button"
            onClick={onAdd}
            disabled={isBusy}
          >
            <Plus size={13} />
            Add field
          </Button>
        }
      />

      {fields.length > 0 && (
        <FormSearch
          value={search}
          onChange={setSearch}
          placeholder="Find a field in this part…"
          matches={shown.length}
          total={fields.length}
        />
      )}

      <ChunkedFields fields={shown}>
        {(built) => rows.slice(0, built.length)}
      </ChunkedFields>

      {fields.length > 0 && shown.length === 0 && (
        <Text fontSize="13px" color="fg.muted" py={4}>
          No field on {form.formCode} matches “{query}”.
        </Text>
      )}
    </>
  );
}
