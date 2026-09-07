import {
  Badge,
  Box,
  Button,
  HStack,
  SegmentGroup,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";

import type { CatalogueField, FormPart } from "@/api/platform";
import {
  changedEntries,
  useDraftForm,
} from "@/components/questionnaire/use-draft-form";
import {
  partLabelOf,
  partTitle,
  partValue,
} from "@/components/forms/part-address";
import {
  PartSelect,
  type PartOption,
} from "@/components/forms/part-select";
import type { SearchableOption } from "@/components/ui/searchable-select";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  useAddCatalogueField,
  useCatalogueFields,
  useCatalogueForm,
  useDeleteCatalogueField,
  useDeleteCatalogueForm,
  useFormFieldMap,
  useFormPdfBoxes,
  useFormPdfMappings,
  useFormSourceQuestions,
  useDeleteFormPart,
  useRenameFormPart,
  useSaveFormPart,
  useSetFormFieldMappings,
  useSetFormPdfMappings,
  useUpdateCatalogueField,
  useUpdateCatalogueForm,
} from "@/hooks/use-platform";
import { FieldDefinitionDialog } from "./field-definition-dialog";
import { FiledOn } from "./filed-on";
import { FieldListEditor } from "./field-list-editor";
import { FieldMapEditor, UNMAPPED } from "./field-map-editor";
import { FormDefinitionDialog } from "./form-definition-dialog";
import { FormPdfPreview } from "./pdf-preview";
import { PartDialog } from "./part-dialog";
import { FormMapView } from "./form-map-view";
import { EditionsView } from "./editions-view";
import { PdfBoxEditor } from "./pdf-box-editor";
import { PlatformPageHeader } from "../page-header";
import {
  mappingKey,
  mappingTargets,
  parseMappingKey,
  UNMAPPED_BOX,
} from "./pdf-box-matching";

/**
 * One form, and the three questions worth asking about it.
 *
 * **Fields** — what fields the form has. **Field sources** — which question
 * fills each. **PDF boxes** — where each prints on the blank. They are three
 * views rather than three pages because they are one job done in order, and
 * because the answer to each is only legible next to the others: a field with
 * no source and a field with no box look identical on a rendered PDF, and
 * telling them apart is most of the maintenance work.
 *
 * ─── One part at a time, fetched as such ────────────────────────────────────
 *
 * All three used to read the whole form and hide the size behind an accordion:
 * 512 field definitions, their sources, their box mappings and the 250
 * questions that could feed them, every time the page opened. A part is what a
 * screen shows now, and it is also what it asks the server for — `?part=` on
 * each of the three reads. What stays whole-form is the index above (names and
 * counts) and the list of boxes a mapping may name, because a field in Part 1
 * legitimately prints into a box in Part 14.
 *
 * The index doubles as the overview the accordion's row of counts used to
 * give: each part carries the number its view cares about, so "which part
 * still has holes in it" is answered in the picker rather than by opening all
 * fourteen.
 *
 * ─── Where the firm's version of this went ──────────────────────────────────
 *
 * All three used to live in a matter's Forms tab, addressed by `caseId`, which
 * made a global change look like a local one — none of the three writes was
 * ever scoped to the case it was made from. `PUT
 * /cases/:caseId/forms/:formCode/pdf-mappings` was reachable with
 * `cases:update` and rewrote which box a datum prints into for every firm in
 * the deployment. The firm's tab is about *values*.
 */
type View = "fields" | "sources" | "boxes" | "map" | "preview" | "editions";

const VIEWS: { value: View; label: string }[] = [
  { value: "fields", label: "Fields" },
  { value: "sources", label: "What fills each field" },
  { value: "boxes", label: "PDF boxes" },
  /*
    The last two views are the paper the other three describe. PDF boxes is a
    list of names, and two adjacent boxes on a USCIS form have names that
    differ by one character — nothing on that list says what the box asks or
    where it sits. They are siblings rather than buttons because they belong to
    the same job: read the blank, map, fix.

    `map` is that list and this paper at once — the page with its boxes drawn
    on it, wired by clicking. It sits *before* the blank because it is the one
    you work in; the blank is the one you check against. Both stay: the list
    answers "what is still unwired on this form?", which is the question that
    finishes a form, and the mapper answers "what is this box?", which is the
    question that starts one.
  */
  { value: "map", label: "Map on the form" },
  { value: "preview", label: "The blank PDF" },
  /*
    Last, because it is where the form comes from rather than where it is
    worked on. Everything the other five views read — the fields, the parts,
    the boxes and the blank itself — is read off a PDF uploaded here, so this
    is the view somebody opens once when a form arrives and once again when
    USCIS publishes an edition.
  */
  { value: "editions", label: "Versions & PDF" },
];

export function PlatformFormDetailPage() {
  const { formCode = "" } = useParams();
  const navigate = useNavigate();
  const { showConfirm } = useConfirmDialog();

  useDocumentTitle(`${formCode} · Oravanti`);

  const [view, setView] = useState<View>("fields");

  const { data, isLoading } = useCatalogueForm(formCode);
  const form = data?.form ?? null;
  const parts = useMemo(() => data?.parts ?? [], [data]);

  /**
   * The part on screen, or null before the index has arrived.
   *
   * Kept as the picker's own value rather than the label, so it can be handed
   * straight to the control and to the reads. Unset falls through to the first
   * part — which is what somebody opening a form expects to see — rather than
   * being resolved into state, where a form whose index arrives second would
   * leave it pointing at nothing.
   */
  const [chosenPart, setChosenPart] = useState<string | null>(null);
  const currentPart =
    chosenPart ?? (parts.length > 0 ? partValue(parts[0].partLabel) : null);
  /** What the three reads take. `undefined` until there is a part to ask about. */
  const partLabel = currentPart === null ? undefined : partLabelOf(currentPart);

  // ─── What the dialogs are about ───────────────────────────────────────────

  const [editingForm, setEditingForm] = useState(false);
  /** `"new"` while adding; a field while rewording; null while closed. */
  const [editingField, setEditingField] = useState<
    CatalogueField | "new" | null
  >(null);
  /** `"new"` while naming a part; `"edit"` for the open one; null while closed. */
  const [partDialog, setPartDialog] = useState<"new" | "edit" | null>(null);

  const updateForm = useUpdateCatalogueForm(formCode);
  const deleteForm = useDeleteCatalogueForm();
  const addField = useAddCatalogueField(formCode);
  const updateField = useUpdateCatalogueField(formCode);
  const deleteField = useDeleteCatalogueField(formCode);
  const renamePart = useRenameFormPart(formCode);
  const savePart = useSaveFormPart(formCode);
  const deletePart = useDeleteFormPart(formCode);

  // ─── Fields, and the rows the PDF boxes view is built from ────────────────

  const { data: partFields, isLoading: isLoadingFields } = useCatalogueFields(
    formCode,
    partLabel,
  );
  const fields = useMemo(() => partFields ?? [], [partFields]);

  // ─── Field sources ────────────────────────────────────────────────────────

  const { data: fieldMap } = useFormFieldMap(formCode, partLabel);
  const { data: sourceQuestions } = useFormSourceQuestions(formCode);
  const saveSources = useSetFormFieldMappings(formCode);
  const mapFields = useMemo(() => fieldMap?.form.fields ?? [], [fieldMap]);

  const mapByKey = useMemo(
    () => new Map(mapFields.map((field) => [field.fieldKey, field])),
    [mapFields],
  );

  /**
   * Every platform question, plus "Nothing". Ordered by section, then label.
   *
   * The section is the *sublabel* rather than a prefix on the label. Both are
   * searched, so "marriage date" still finds the question in the Marriage
   * section — but a list of two hundred entries all beginning "Beneficiary —"
   * pushes the part that tells them apart off the end of the row.
   */
  const questionOptions: SearchableOption[] = useMemo(() => {
    const questions = [...(sourceQuestions?.questions ?? [])].sort(
      (a, b) =>
        a.sectionTitle.localeCompare(b.sectionTitle) ||
        a.label.localeCompare(b.label),
    );
    return [
      { label: "Nothing fills this", value: UNMAPPED },
      ...questions.map((question) => ({
        label: question.label,
        sublabel: question.sectionTitle,
        value: question.id,
      })),
    ];
  }, [sourceQuestions]);

  const storedSources = useMemo(() => {
    const values: Record<string, string> = {};
    for (const field of mapFields) {
      values[field.fieldKey] = field.question?.id ?? UNMAPPED;
    }
    return values;
  }, [mapFields]);

  // ─── PDF boxes ────────────────────────────────────────────────────────────

  const { data: pdfBoxes, isLoading: isLoadingBoxes } =
    useFormPdfBoxes(formCode);
  const { data: pdfMappings } = useFormPdfMappings(formCode, partLabel);
  const saveBoxes = useSetFormPdfMappings(formCode);

  /**
   * Keyed by mapping *target* rather than by field — a choice is one row per
   * answer, because USCIS gives each answer its own checkbox. See
   * `mappingTargets`.
   */
  const storedBoxes = useMemo(() => {
    const values: Record<string, string> = {};
    for (const field of fields) {
      for (const target of mappingTargets(field)) {
        values[mappingKey(field.fieldKey, target.value)] = UNMAPPED_BOX;
      }
    }
    for (const mapping of pdfMappings?.mappings ?? []) {
      values[mappingKey(mapping.fieldKey, mapping.fieldValue)] =
        mapping.pdfFieldName;
    }
    return values;
  }, [fields, pdfMappings]);

  /**
   * The targets printing into more than one box, and which boxes those are.
   *
   * `storedBoxes` above keeps one box per target because a select holds one
   * value — the last mapping read wins, and the others would be invisible.
   * That is fine for the count and wrong for the row, so those rows are given
   * the whole list and render it instead of a select. See `SharedBoxes`.
   */
  const sharedBoxes = useMemo(() => {
    const byTarget: Record<string, string[]> = {};
    for (const mapping of pdfMappings?.mappings ?? []) {
      const key = mappingKey(mapping.fieldKey, mapping.fieldValue);
      byTarget[key] = [...(byTarget[key] ?? []), mapping.pdfFieldName];
    }
    return Object.fromEntries(
      Object.entries(byTarget)
        .filter(([, boxes]) => boxes.length > 1)
        .map(([key, boxes]) => [key, [...boxes].sort()]),
    );
  }, [pdfMappings]);

  const sourcesForm = useDraftForm(storedSources);
  const boxesForm = useDraftForm(storedBoxes);

  const isDraftView = view === "sources" || view === "boxes";
  const draftForView = view === "sources" ? sourcesForm : boxesForm;

  /**
   * Moving to another part, with whatever is unsaved said out loud.
   *
   * A draft belongs to the part it was typed into: that part is what gets
   * fetched again when somebody comes back, and nothing carries edits across.
   * So leaving one with changes in it asks first, and names the part and the
   * count — an unsaved change on these screens is a change to a government
   * form for every firm in the deployment, and dropping one silently is worse
   * than the interruption.
   */
  const changePart = (next: string) => {
    if (next === currentPart) return;

    const unsaved = isDraftView ? changedEntries(draftForView).length : 0;
    if (unsaved === 0) {
      setChosenPart(next);
      return;
    }

    showConfirm({
      title: "Discard changes?",
      description: `${unsaved} unsaved change${unsaved === 1 ? "" : "s"} in ${partTitle(partLabel ?? null)}. Leaving this part discards ${unsaved === 1 ? "it" : "them"}.`,
      confirmLabel: "Discard",
      cancelLabel: "Cancel",
      onConfirm: () => {
        draftForView.reset();
        setChosenPart(next);
      },
    });
  };

  /** The picker's options, counted in the terms of whichever view is open. */
  const partOptions: PartOption[] = useMemo(
    () =>
      parts.map((part) => ({
        value: partValue(part.partLabel),
        label: partTitle(part.partLabel),
        sublabel: partSublabel(part, view),
      })),
    [parts, view],
  );

  /** The open part's own entry, for its description and its emptiness. */
  const openPart = useMemo(
    () => parts.find((part) => partValue(part.partLabel) === currentPart),
    [parts, currentPart],
  );

  /**
   * Naming a part, and describing one.
   *
   * One handler for both because it is one decision: what this part is called
   * and what it is for. A name that changed is a rename first — that is the
   * call that moves the fields — and the description follows onto whatever the
   * part is now called. Naming the unlabelled part goes through the same two
   * steps, which is how those fields end up somewhere describable.
   */
  const savePartDetails = async ({
    name,
    description,
  }: {
    name: string;
    description: string | null;
  }) => {
    const from = partDialog === "edit" ? (partLabel ?? null) : null;

    if (partDialog === "edit" && from !== name) {
      await renamePart.mutateAsync({ from, to: name });
    }

    await savePart.mutateAsync({ partLabel: name, description });
    setChosenPart(partValue(name));
  };

  /**
   * Removing a part, which only ever means an empty one.
   *
   * A part with fields is emptied field by field, each with its own
   * confirmation — the server refuses this outright rather than trusting the
   * button to be the only door.
   */
  const confirmDeletePart = () => {
    if (!openPart?.partLabel) return;
    const label = openPart.partLabel;

    showConfirm({
      title: "Remove part",
      description: `"${label}" is removed from ${formCode} for every firm. It has no fields in it, so nothing on the blank changes.`,
      confirmLabel: "Remove part",
      cancelLabel: "Cancel",
      onConfirm: () =>
        deletePart.mutate(label, { onSuccess: () => setChosenPart(null) }),
    });
  };

  const totalFields = useMemo(
    () => parts.reduce((sum, part) => sum + part.fieldCount, 0),
    [parts],
  );

  const saveSourcesChanges = () =>
    saveSources.mutate(
      changedEntries(sourcesForm).map(({ key, value: next }) => {
        const current = mapByKey.get(key);
        return {
          fieldKey: key,
          sourceQuestionId: next === UNMAPPED ? null : next,
          // Displacing a question the shared vocabulary already provides has to
          // say why. Naming what is being replaced is the honest answer, and a
          // prompt per row would make a batch save a sequence of interruptions.
          overrideRationale: current?.question
            ? `Replaced ${current.question.label}`
            : null,
        };
      }),
      { onSuccess: () => sourcesForm.reset(sourcesForm.getValues()) },
    );

  const saveBoxesChanges = () =>
    saveBoxes.mutate(
      changedEntries(boxesForm).map(({ key, value }) => ({
        ...parseMappingKey(key),
        // "Prints nowhere" is a real choice — it clears the mapping rather than
        // leaving the previous box quietly in place.
        pdfFieldName: value === UNMAPPED_BOX ? null : value,
      })),
      { onSuccess: () => boxesForm.reset(boxesForm.getValues()) },
    );

  const confirmDeleteForm = () => {
    if (!form) return;
    showConfirm({
      title: "Remove form",
      description: `${form.formCode} and its ${totalFields} field${totalFields === 1 ? "" : "s"} are removed for every firm. Matters that already have the form keep it, and everything typed into it stays in their record — but nobody can add it to a new matter.`,
      confirmLabel: "Remove form",
      cancelLabel: "Cancel",
      onConfirm: () =>
        deleteForm.mutate(form.id, {
          onSuccess: () => navigate("/platform/forms"),
        }),
    });
  };

  if (isLoading) {
    return (
      <HStack gap={2} py={6}>
        <Spinner size="sm" />
        <Text fontSize="13px" color="fg.muted">
          Loading {formCode}…
        </Text>
      </HStack>
    );
  }

  if (!form) {
    return (
      <Box maxW="640px">
        <PlatformPageHeader
          trail={[{ label: "Forms", to: "/platform/forms" }]}
          title="Not found"
        />
        <Text fontSize="14px" color="fg">
          No form in the catalogue is called {formCode}.
        </Text>
        <Text fontSize="13px" color="fg.muted" mt={1}>
          It may have been removed, or the code may be mistyped.
        </Text>
      </Box>
    );
  }

  return (
    <Box maxW="1000px">
      <PlatformPageHeader
        trail={[{ label: "Forms", to: "/platform/forms" }]}
        title={
          <HStack gap={2} align="center" flexWrap="wrap">
            <Text as="span">{form.formCode}</Text>
            <Badge size="sm" variant="subtle" colorPalette="gray">
              {totalFields} fields
            </Badge>
          </HStack>
        }
        description={form.title}
        actions={
          <>
            {/* Labelled, like NodeActions on every taxonomy page. A bare
                pencil and a bare bin beside a title were the one place in the
                CRM where a destructive control had no word on it. */}
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setEditingForm(true)}
            >
              <Pencil size={13} />
              Edit
            </Button>
            <Button
              size="xs"
              variant="ghost"
              colorPalette="red"
              loading={deleteForm.isPending}
              onClick={confirmDeleteForm}
            >
              <Trash2 size={13} />
              Delete
            </Button>
          </>
        }
      />

      {/*
        Above the views rather than inside one. All three views change this form
        for every firm on the platform, so how far that reaches is context for
        all of them and not a fourth thing to go and look at.
      */}
      <FiledOn rows={data?.filedOn ?? []} />

      {/*
        Two views have no part to choose, for the same reason from two ends.
        The blank is one document; the editions are what that document *is*,
        and a form's parts are read off it rather than being a way through it.
        Everywhere else the picker carries the two controls that act on the
        parts themselves — Oravanti names a form's divisions, the same way it
        names its fields, and this is where a part is on screen.
      */}
      {view !== "preview" && view !== "editions" && (
        <>
          <PartSelect
            options={partOptions}
            value={currentPart ?? ""}
            onChange={changePart}
            actions={
              <HStack gap={1} flexWrap="wrap">
                <Button
                  size="xs"
                  variant="ghost"
                  color="fg.muted"
                  onClick={() => setPartDialog("new")}
                >
                  <Plus size={13} />
                  Add part
                </Button>
                {currentPart !== null && (
                  <Button
                    size="xs"
                    variant="ghost"
                    color="fg.muted"
                    loading={renamePart.isPending || savePart.isPending}
                    onClick={() => setPartDialog("edit")}
                  >
                    <Pencil size={13} />
                    Edit part
                  </Button>
                )}
                {/* Only ever an empty one — see `confirmDeletePart`. A part
                    with fields in it has no such button rather than one that
                    is refused. */}
                {openPart?.partLabel && openPart.fieldCount === 0 && (
                  <Button
                    size="xs"
                    variant="ghost"
                    colorPalette="red"
                    loading={deletePart.isPending}
                    onClick={confirmDeletePart}
                  >
                    <Trash2 size={13} />
                    Remove part
                  </Button>
                )}
              </HStack>
            }
          />

          {/* What the part is for, above whichever view is reading it — the
              same sentence answers "should this field be here?" and "what
              should fill it?". */}
          {openPart?.description && (
            <Text fontSize="12px" color="fg.muted" lineHeight="17px" mb={3}>
              {openPart.description}
            </Text>
          )}
        </>
      )}

      
      <SegmentGroup.Root
        size="sm"
        value={view}
        onValueChange={(details) => setView(details.value as View)}
        mb={4}
      >
        <SegmentGroup.Indicator />
        <SegmentGroup.Items items={VIEWS} />
      </SegmentGroup.Root>

    

      {view === "fields" &&
        (isLoadingFields ? (
          <PartSpinner />
        ) : (
          <FieldListEditor
            form={form}
            partLabel={partLabel ?? null}
            fields={fields}
            onAdd={() => setEditingField("new")}
            onEdit={setEditingField}
            onDelete={(field) => deleteField.mutate(field.id)}
            isBusy={addField.isPending || deleteField.isPending}
          />
        ))}

      {view === "sources" &&
        (fieldMap ? (
          <FieldMapEditor
            form={form}
            partLabel={partLabel ?? null}
            fields={mapFields}
            draftForm={sourcesForm}
            questionOptions={questionOptions}
            onSave={saveSourcesChanges}
            onDiscard={() => sourcesForm.reset()}
            isSaving={saveSources.isPending}
          />
        ) : (
          <PartSpinner />
        ))}

      {view === "map" && <FormMapView formCode={form.formCode} />}

      {view === "preview" && <FormPdfPreview formCode={form.formCode} />}

      {view === "editions" && <EditionsView formCode={form.formCode} />}

      {view === "boxes" &&
        (isLoadingBoxes || isLoadingFields ? (
          <PartSpinner label="Reading the boxes off the blank…" />
        ) : (
          <PdfBoxEditor
            form={form}
            partLabel={partLabel ?? null}
            fields={fields}
            boxes={pdfBoxes?.boxes ?? []}
            sharedBoxes={sharedBoxes}
            draftForm={boxesForm}
            onSave={saveBoxesChanges}
            onDiscard={() => boxesForm.reset()}
            isSaving={saveBoxes.isPending}
          />
        ))}

      <FormDefinitionDialog
        form={form}
        practiceAreas={data?.practiceAreas ?? []}
        open={editingForm}
        onOpenChange={setEditingForm}
        isPending={updateForm.isPending}
        onSubmit={async (values) => {
          await updateForm.mutateAsync({
            definitionId: form.id,
            patch: {
              title: values.title,
              description: values.description,
              providedBy: values.providedBy,
              // The whole set, every time: the picker shows what is stored and
              // sends back what is on screen. Sending only additions would
              // leave no way to take one off.
              practiceAreaIds: values.practiceAreaIds ?? [],
            },
          });
          setEditingForm(false);
        }}
      />

      <PartDialog
        // `undefined` means "naming a new one". The distinction matters
        // because `partLabel: null` is a real part — the one whose fields
        // carry no label — and renaming it is how those fields get placed.
        part={
          partDialog === "edit"
            ? (openPart ?? { partLabel: partLabel ?? null, description: null })
            : undefined
        }
        formCode={form.formCode}
        open={partDialog !== null}
        onOpenChange={(open) => !open && setPartDialog(null)}
        isPending={renamePart.isPending || savePart.isPending}
        onSubmit={savePartDetails}
      />

      <FieldDefinitionDialog
        field={editingField === "new" ? null : editingField}
        formCode={form.formCode}
        // The part on screen is where a new field lands, so the dialog opens on
        // it rather than on nothing — adding a field to the part you are
        // looking at is the case, and choosing another is the exception.
        defaultPartLabel={partLabel ?? null}
        partLabels={partOptions
          .map((option) => partLabelOf(option.value))
          .filter((label): label is string => label !== null)}
        open={editingField !== null}
        onOpenChange={(open) => !open && setEditingField(null)}
        isPending={addField.isPending || updateField.isPending}
        onSubmit={async (values) => {
          if (editingField && editingField !== "new") {
            const { fieldKey: _unused, ...patch } = values;
            await updateField.mutateAsync({
              definitionId: editingField.id,
              patch,
            });
          } else {
            await addField.mutateAsync(values);
          }
          setEditingField(null);
        }}
      />
    </Box>
  );
}

function PartSpinner({ label = "Loading this part…" }: { label?: string }) {
  return (
    <HStack gap={2} py={6}>
      <Spinner size="sm" />
      <Text fontSize="13px" color="fg.muted">
        {label}
      </Text>
    </HStack>
  );
}

/**
 * The count under a part's name, in the terms of the view that is open.
 *
 * Three views ask three questions of the same part, and the picker is where
 * they get compared across parts — the job the accordion's row of counts used
 * to do, now done without opening anything.
 */
function partSublabel(part: FormPart, view: View) {
  if (view === "sources") {
    return `${part.sourcedCount}/${part.fieldCount} sourced`;
  }
  if (view === "boxes") {
    return `${part.mappedCount}/${part.fieldCount} mapped`;
  }
  return `${part.fieldCount} field${part.fieldCount === 1 ? "" : "s"}`;
}
