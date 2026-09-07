import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  addCatalogueField,
  addCatalogueForm,
  addSystemQuestion,
  addSystemSection,
  createCaseType,
  createPracticeArea,
  createSubcategory,
  createSystemQuestionnaire,
  clearFormFieldMapping,
  deleteCaseType,
  deletePracticeArea,
  deleteSubcategory,
  deleteCatalogueField,
  deleteCatalogueForm,
  deleteFormPart,
  deleteSystemQuestion,
  deleteSystemSection,
  getAllCatalogueFields,
  getAllFormPdfMappings,
  getCatalogueFields,
  getCatalogueForm,
  getCatalogueForms,
  getFormFieldMap,
  getFormSourceQuestions,
  getFormPdfBoxes,
  getFormPdfMappings,
  getFormPdfPreview,
  getFormEditions,
  addFormEdition,
  updateFormEdition,
  uploadFormBlank,
  previewFormImport,
  importFormCatalogue,
  getCaseType,
  getCaseTypes,
  getFormsForCaseType,
  getPlatformMe,
  getPracticeArea,
  getPracticeAreas,
  getSubcategories,
  getSubcategory,
  getTaxonomyCounts,
  removeCaseTypeForm,
  reorderCaseTypeForms,
  setCaseTypeForm,
  getSystemQuestionnaire,
  getSystemQuestionnaires,
  renameFormPart,
  saveFormPart,
  reorderCatalogueFields,
  setFormFieldMapping,
  setFormFieldMappings,
  setFormPdfMapping,
  updateCaseType,
  updateCatalogueField,
  updateCatalogueForm,
  updatePracticeArea,
  updateSubcategory,
  updateSystemQuestion,
  updateSystemQuestionnaire,
  updateSystemSection,
  type EditionInput,
  type FieldInput,
  type FormInput,
  type QuestionInput,
  type SectionInput,
  type CaseTypeJurisdiction,
  type FormCatalogueParams,
  type PageParams,
  type SystemQuestionnaireInput,
  type TaxonomyBlocker,
  type TaxonomyNodePatch,
} from "@/api/platform";
import type { APIError } from "./types";

/**
 * Query keys for the CRM.
 *
 * A factory rather than inline arrays, so an invalidation can address a whole
 * branch — the same convention `caseDetailKeys` follows on the firm side. Note
 * that every key below is addressed by `formCode`, never by a matter: a change
 * here lands for every firm at once, and the cache shape says so.
 */
export const platformKeys = {
  all: ["platform"] as const,
  me: () => [...platformKeys.all, "me"] as const,
  /*
    The taxonomy branch. Every list key carries its own page and search, so two
    pages of the same list are two cache entries rather than one that flickers
    — and `taxonomy()` is the handle an invalidation uses to drop all of them
    when a package changes underneath.
  */
  taxonomy: () => [...platformKeys.all, "taxonomy"] as const,
  taxonomyCounts: () => [...platformKeys.taxonomy(), "counts"] as const,
  practiceAreas: (params: PageParams) =>
    [...platformKeys.taxonomy(), "practice-areas", params] as const,
  practiceArea: (practiceAreaId: string) =>
    [...platformKeys.taxonomy(), "practice-area", practiceAreaId] as const,
  subcategories: (practiceAreaId: string, params: PageParams) =>
    [
      ...platformKeys.taxonomy(),
      "subcategories",
      practiceAreaId,
      params,
    ] as const,
  subcategory: (subcategoryId: string) =>
    [...platformKeys.taxonomy(), "subcategory", subcategoryId] as const,
  caseTypes: (subcategoryId: string, params: PageParams) =>
    [...platformKeys.taxonomy(), "case-types", subcategoryId, params] as const,
  caseType: (caseTypeId: string) =>
    [...platformKeys.taxonomy(), "case-type", caseTypeId] as const,
  caseTypeAvailableForms: (caseTypeId: string, params: PageParams) =>
    [...platformKeys.caseType(caseTypeId), "available-forms", params] as const,
  forms: () => [...platformKeys.all, "forms"] as const,
  formList: (params: FormCatalogueParams) =>
    [...platformKeys.forms(), "list", params] as const,
  form: (formCode: string) => [...platformKeys.forms(), formCode] as const,
  /*
    The three per-part reads carry the part in the key, so moving between parts
    is a cached read after the first visit and every one of them is still
    invalidated together by `useFormInvalidation` — which invalidates the form's
    whole subtree rather than naming the parts it knows about.
  */
  fields: (formCode: string, partLabel: string | null) =>
    [...platformKeys.form(formCode), "fields", partLabel] as const,
  fieldMap: (formCode: string, partLabel: string | null) =>
    [...platformKeys.form(formCode), "field-map", partLabel] as const,
  sourceQuestions: (formCode: string, caseTypeId?: string | null) =>
    [...platformKeys.form(formCode), "source-questions", caseTypeId ?? null] as const,
  pdfBoxes: (formCode: string) =>
    [...platformKeys.form(formCode), "pdf-boxes"] as const,
  pdfMappings: (formCode: string, partLabel: string | null) =>
    [...platformKeys.form(formCode), "pdf-mappings", partLabel] as const,
  pdfPreview: (formCode: string) =>
    [...platformKeys.form(formCode), "pdf-preview"] as const,
  editions: (formCode: string) =>
    [...platformKeys.form(formCode), "editions"] as const,
  /*
    The mapper's two whole-form reads. Separate keys rather than a part of
    `null`, because `null` is a real part — the one whose fields carry no
    label — and caching "every field" under it would serve the wrong list to
    whichever screen asked second. Both still sit under `form(formCode)`, so
    `useFormInvalidation` clears them with everything else.
  */
  allFields: (formCode: string) =>
    [...platformKeys.form(formCode), "fields", "all-parts"] as const,
  allPdfMappings: (formCode: string) =>
    [...platformKeys.form(formCode), "pdf-mappings", "all-parts"] as const,
};

/** Everything the mutations below say has changed about one form. */
function useFormInvalidation(formCode: string) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: platformKeys.form(formCode) });
    queryClient.invalidateQueries({ queryKey: platformKeys.forms() });
  };
}

const fail = (fallback: string) => (err: APIError) => {
  toast.error(err.response?.data?.message ?? fallback);
};

/**
 * A refused delete, said in full.
 *
 * The API answers a blocked delete with a 409 carrying `details.blockers` —
 * what actually holds the node. The message alone ("this is in use") is the
 * half that does not help; "11 matters · 3 workflow templates" is the half that
 * does, and it is why the API counts before deleting rather than letting
 * postgres refuse.
 */
const failDelete = (fallback: string) => (err: APIError) => {
  const blockers = (
    err.response?.data?.details as
      | {
          blockers?: TaxonomyBlocker[];
        }
      | undefined
  )?.blockers;

  toast.error(err.response?.data?.message ?? fallback, {
    description: blockers?.length
      ? blockers.map((held) => `${held.count} ${held.label}`).join(" · ")
      : undefined,
  });
};

/**
 * The signed-in operator.
 *
 * `staleTime: Infinity` — who you are does not change while you are looking at
 * a page, and the auth store has already established it.
 */
export function usePlatformMe() {
  return useQuery({
    queryKey: platformKeys.me(),
    queryFn: getPlatformMe,
    staleTime: Infinity,
  });
}

// ─── The taxonomy ───────────────────────────────────────────────────────────
//
// `staleTime: Infinity` throughout. The taxonomy itself is global reference
// data that does not change while somebody is looking at it; the parts that
// *do* change — a case type's package — are invalidated explicitly by the
// mutations below, which is the convention the rest of this app follows.

export function useTaxonomyCounts() {
  return useQuery({
    queryKey: platformKeys.taxonomyCounts(),
    queryFn: getTaxonomyCounts,
    staleTime: Infinity,
  });
}

export function usePracticeAreas(params: PageParams = {}) {
  return useQuery({
    queryKey: platformKeys.practiceAreas(params),
    queryFn: () => getPracticeAreas(params),
    staleTime: Infinity,
    /*
      Keeps the previous page on screen while the next one loads. Without it a
      paginated list unmounts to a spinner on every page change, which reads as
      a slower app than it is.
    */
    placeholderData: (previous) => previous,
  });
}

export function useSubcategories(
  practiceAreaId: string | undefined,
  params: PageParams = {},
) {
  return useQuery({
    queryKey: platformKeys.subcategories(practiceAreaId ?? "", params),
    queryFn: () => getSubcategories(practiceAreaId!, params),
    enabled: Boolean(practiceAreaId),
    staleTime: Infinity,
    placeholderData: (previous) => previous,
  });
}

export function usePracticeArea(practiceAreaId: string | undefined) {
  return useQuery({
    queryKey: platformKeys.practiceArea(practiceAreaId ?? ""),
    queryFn: () => getPracticeArea(practiceAreaId!),
    enabled: Boolean(practiceAreaId),
    staleTime: Infinity,
  });
}

export function useSubcategory(subcategoryId: string | undefined) {
  return useQuery({
    queryKey: platformKeys.subcategory(subcategoryId ?? ""),
    queryFn: () => getSubcategory(subcategoryId!),
    enabled: Boolean(subcategoryId),
    staleTime: Infinity,
  });
}

export function useCaseTypes(
  subcategoryId: string | undefined,
  params: PageParams = {},
) {
  return useQuery({
    queryKey: platformKeys.caseTypes(subcategoryId ?? "", params),
    queryFn: () => getCaseTypes(subcategoryId!, params),
    enabled: Boolean(subcategoryId),
    staleTime: Infinity,
    placeholderData: (previous) => previous,
  });
}

export function useCaseType(caseTypeId: string | undefined) {
  return useQuery({
    queryKey: platformKeys.caseType(caseTypeId ?? ""),
    queryFn: () => getCaseType(caseTypeId!),
    enabled: Boolean(caseTypeId),
    staleTime: Infinity,
  });
}

export function useCaseTypeAvailableForms(
  caseTypeId: string | undefined,
  params: PageParams = {},
) {
  return useQuery({
    queryKey: platformKeys.caseTypeAvailableForms(caseTypeId ?? "", params),
    queryFn: () => getFormsForCaseType(caseTypeId!, params),
    enabled: Boolean(caseTypeId),
    staleTime: Infinity,
    placeholderData: (previous) => previous,
  });
}

/**
 * What a package change invalidates.
 *
 * The case type itself, obviously — but also the counts and the case-type
 * lists, because both show how many forms a leaf has and both would otherwise
 * keep saying 0 next to a package that now has six.
 */
function useCaseTypeInvalidation(caseTypeId: string) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: platformKeys.caseType(caseTypeId),
    });
    queryClient.invalidateQueries({ queryKey: platformKeys.taxonomy() });
  };
}

export function useSetCaseTypeForm(caseTypeId: string) {
  const invalidate = useCaseTypeInvalidation(caseTypeId);

  return useMutation({
    mutationFn: (body: { formCode: string; role?: "core" | "supporting" }) =>
      setCaseTypeForm(caseTypeId, body),
    onSuccess: () => {
      invalidate();
      toast.success("Form added to the package");
    },
    onError: fail("Could not add the form"),
  });
}

export function useRemoveCaseTypeForm(caseTypeId: string) {
  const invalidate = useCaseTypeInvalidation(caseTypeId);

  return useMutation({
    mutationFn: (formCode: string) => removeCaseTypeForm(caseTypeId, formCode),
    onSuccess: () => {
      invalidate();
      toast.success("Form removed from the package");
    },
    onError: fail("Could not remove the form"),
  });
}

export function useReorderCaseTypeForms(caseTypeId: string) {
  const invalidate = useCaseTypeInvalidation(caseTypeId);

  return useMutation({
    mutationFn: (formCodes: string[]) =>
      reorderCaseTypeForms(caseTypeId, formCodes),
    onSuccess: () => {
      invalidate();
      toast.success("Filing order saved");
    },
    onError: fail("Could not save the order"),
  });
}

// ─── Maintaining the taxonomy ───────────────────────────────────────────────
//
// Every write below drops the whole `taxonomy()` branch rather than the one key
// it touched. That is deliberate and not laziness: a renamed subcategory shows
// in its own page, in its parent's list, in its children's breadcrumbs and in
// the counts, and enumerating those four is a list that goes stale the first
// time a screen adds a fifth. The branch is reference data behind
// `staleTime: Infinity`, so the cost of refetching it is a handful of requests
// on an action a person took deliberately.

function useTaxonomyInvalidation() {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({ queryKey: platformKeys.taxonomy() });
}

export function useCreatePracticeArea() {
  const invalidate = useTaxonomyInvalidation();

  return useMutation({
    mutationFn: createPracticeArea,
    onSuccess: (area) => {
      invalidate();
      toast.success(`${area.name} created`);
    },
    onError: fail("Could not create the practice area"),
  });
}

export function useUpdatePracticeArea(practiceAreaId: string) {
  const invalidate = useTaxonomyInvalidation();

  return useMutation({
    mutationFn: (patch: TaxonomyNodePatch) =>
      updatePracticeArea(practiceAreaId, patch),
    onSuccess: (_area, patch) => {
      invalidate();
      toast.success(savedMessage("Practice area", patch));
    },
    onError: fail("Could not save the practice area"),
  });
}

export function useDeletePracticeArea() {
  const invalidate = useTaxonomyInvalidation();

  return useMutation({
    mutationFn: deletePracticeArea,
    onSuccess: () => {
      invalidate();
      toast.success("Practice area deleted");
    },
    onError: failDelete("Could not delete the practice area"),
  });
}

export function useCreateSubcategory(practiceAreaId: string) {
  const invalidate = useTaxonomyInvalidation();

  return useMutation({
    mutationFn: (body: {
      code: string;
      name: string;
      description?: string | null;
    }) => createSubcategory(practiceAreaId, body),
    onSuccess: (subcategory) => {
      invalidate();
      toast.success(`${subcategory.name} created`);
    },
    onError: fail("Could not create the subcategory"),
  });
}

export function useUpdateSubcategory(subcategoryId: string) {
  const invalidate = useTaxonomyInvalidation();

  return useMutation({
    mutationFn: (patch: TaxonomyNodePatch) =>
      updateSubcategory(subcategoryId, patch),
    onSuccess: (_subcategory, patch) => {
      invalidate();
      toast.success(savedMessage("Subcategory", patch));
    },
    onError: fail("Could not save the subcategory"),
  });
}

export function useDeleteSubcategory() {
  const invalidate = useTaxonomyInvalidation();

  return useMutation({
    mutationFn: deleteSubcategory,
    onSuccess: () => {
      invalidate();
      toast.success("Subcategory deleted");
    },
    onError: failDelete("Could not delete the subcategory"),
  });
}

export function useCreateCaseType(subcategoryId: string) {
  const invalidate = useTaxonomyInvalidation();

  return useMutation({
    mutationFn: (body: {
      code: string;
      name: string;
      caseNumberPrefix: string;
      jurisdiction: CaseTypeJurisdiction;
      description?: string | null;
    }) => createCaseType(subcategoryId, body),
    onSuccess: (caseType) => {
      invalidate();
      toast.success(`${caseType.name} created`);
    },
    onError: fail("Could not create the case type"),
  });
}

export function useUpdateCaseType(caseTypeId: string) {
  const invalidate = useTaxonomyInvalidation();

  return useMutation({
    mutationFn: (
      patch: TaxonomyNodePatch & {
        caseNumberPrefix?: string;
        jurisdiction?: CaseTypeJurisdiction;
      },
    ) => updateCaseType(caseTypeId, patch),
    onSuccess: (_caseType, patch) => {
      invalidate();
      toast.success(savedMessage("Case type", patch));
    },
    onError: fail("Could not save the case type"),
  });
}

export function useDeleteCaseType() {
  const invalidate = useTaxonomyInvalidation();

  return useMutation({
    mutationFn: deleteCaseType,
    onSuccess: () => {
      invalidate();
      toast.success("Case type deleted");
    },
    onError: failDelete("Could not delete the case type"),
  });
}

/**
 * What the toast says, for the one patch that is not just an edit.
 *
 * Archiving is the change a person will second-guess — "did that just break
 * four hundred open matters?" — so the confirmation answers that rather than
 * saying "saved" and leaving them to wonder.
 */
const savedMessage = (what: string, patch: TaxonomyNodePatch) => {
  if (patch.status === "archived")
    return `${what} archived — existing matters are unaffected`;
  if (patch.status === "active") return `${what} restored`;
  return `${what} saved`;
};

// ─── The catalogue ──────────────────────────────────────────────────────────

export function useCatalogueForms(params: FormCatalogueParams = {}) {
  return useQuery({
    queryKey: platformKeys.formList(params),
    queryFn: () => getCatalogueForms(params),
    staleTime: Infinity,
    placeholderData: (previous) => previous,
  });
}

/** A form, its parts and where it is filed from. The page's index read. */
export function useCatalogueForm(formCode: string) {
  return useQuery({
    queryKey: platformKeys.form(formCode),
    queryFn: () => getCatalogueForm(formCode),
    enabled: Boolean(formCode),
    staleTime: Infinity,
  });
}

/**
 * The fields of one part.
 *
 * `partLabel` is null both for "the unlabelled part" and for "no part chosen
 * yet", which are told apart by `enabled`: the page passes `undefined` for the
 * part until its index has arrived, and a form always has at least one part.
 */
export function useCatalogueFields(
  formCode: string,
  partLabel: string | null | undefined,
) {
  return useQuery({
    queryKey: platformKeys.fields(formCode, partLabel ?? null),
    queryFn: () => getCatalogueFields(formCode, partLabel ?? null),
    enabled: Boolean(formCode) && partLabel !== undefined,
    staleTime: Infinity,
  });
}

export function useAddCatalogueForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: FormInput) => addCatalogueForm(input),
    onSuccess: (form) => {
      toast.success(`${form.formCode} added to the catalogue`);
      queryClient.invalidateQueries({ queryKey: platformKeys.forms() });

      /*
        Nothing else to invalidate. Naming practice areas writes only
        `form_practice_areas`, which no other query reads — and deliberately
        writes no filing package, so no matter type's page has gone stale.
      */
    },
    onError: fail("Failed to add the form"),
  });
}

export function useUpdateCatalogueForm(formCode: string) {
  const invalidate = useFormInvalidation(formCode);

  return useMutation({
    mutationFn: (vars: {
      definitionId: string;
      patch: {
        title?: string;
        description?: string | null;
        providedBy?: string | null;
        /** The whole set of practice areas. See `updateCatalogueForm`. */
        practiceAreaIds?: string[];
      };
    }) => updateCatalogueForm(vars.definitionId, vars.patch),
    onSuccess: () => {
      toast.success("Form updated");
      invalidate();
    },
    onError: fail("Failed to update the form"),
  });
}

export function useDeleteCatalogueForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (definitionId: string) => deleteCatalogueForm(definitionId),
    onSuccess: () => {
      toast.success("Form removed from the catalogue");
      queryClient.invalidateQueries({ queryKey: platformKeys.forms() });
    },
    onError: fail("Failed to remove the form"),
  });
}

export function useAddCatalogueField(formCode: string) {
  const invalidate = useFormInvalidation(formCode);

  return useMutation({
    mutationFn: (field: FieldInput) => addCatalogueField(formCode, field),
    onSuccess: () => {
      toast.success("Field added");
      invalidate();
    },
    onError: fail("Failed to add the field"),
  });
}

export function useUpdateCatalogueField(formCode: string) {
  const invalidate = useFormInvalidation(formCode);

  return useMutation({
    mutationFn: (vars: {
      definitionId: string;
      patch: Partial<Omit<FieldInput, "fieldKey">>;
    }) => updateCatalogueField(formCode, vars.definitionId, vars.patch),
    onSuccess: () => {
      toast.success("Field updated");
      invalidate();
    },
    onError: fail("Failed to update the field"),
  });
}

export function useDeleteCatalogueField(formCode: string) {
  const invalidate = useFormInvalidation(formCode);

  return useMutation({
    mutationFn: (definitionId: string) =>
      deleteCatalogueField(formCode, definitionId),
    onSuccess: () => {
      toast.success("Field removed");
      invalidate();
    },
    onError: fail("Failed to remove the field"),
  });
}

/** Name a part, or describe one. See `saveFormPart` — it is one write. */
export function useSaveFormPart(formCode: string) {
  const invalidate = useFormInvalidation(formCode);

  return useMutation({
    mutationFn: (vars: { partLabel: string; description: string | null }) =>
      saveFormPart(formCode, vars.partLabel, vars.description),
    onSuccess: () => {
      toast.success("Part saved");
      invalidate();
    },
    onError: fail("Failed to save the part"),
  });
}

export function useDeleteFormPart(formCode: string) {
  const invalidate = useFormInvalidation(formCode);

  return useMutation({
    mutationFn: (partLabel: string) => deleteFormPart(formCode, partLabel),
    onSuccess: () => {
      toast.success("Part removed");
      invalidate();
    },
    onError: fail("Failed to remove the part"),
  });
}

/**
 * Rename a part, across every field in it.
 *
 * The toast names the count because that is the whole point of the operation:
 * the alternative to one call is 172 field edits, and "renamed across 172
 * fields" is what tells somebody it landed on all of them.
 */
export function useRenameFormPart(formCode: string) {
  const invalidate = useFormInvalidation(formCode);

  return useMutation({
    mutationFn: (vars: { from: string | null; to: string }) =>
      renameFormPart(formCode, vars.from, vars.to),
    onSuccess: (result) => {
      toast.success(
        `Renamed to "${result.to}" across ${result.fields} field${result.fields === 1 ? "" : "s"}`,
      );
      invalidate();
    },
    onError: fail("Failed to rename the part"),
  });
}

export function useReorderCatalogueFields(formCode: string) {
  const invalidate = useFormInvalidation(formCode);

  return useMutation({
    mutationFn: (order: { fieldDefinitionId: string; orderIndex: number }[]) =>
      reorderCatalogueFields(formCode, order),
    onSuccess: () => {
      toast.success("Field order saved");
      invalidate();
    },
    onError: fail("Failed to save the field order"),
  });
}

// ─── Field sources ──────────────────────────────────────────────────────────

export function useFormFieldMap(
  formCode: string,
  partLabel: string | null | undefined,
) {
  return useQuery({
    queryKey: platformKeys.fieldMap(formCode, partLabel ?? null),
    queryFn: () => getFormFieldMap(formCode, partLabel ?? null),
    enabled: Boolean(formCode) && partLabel !== undefined,
    staleTime: Infinity,
  });
}

/** The vocabulary the sources view offers. One read per form, not per part. */
export function useFormSourceQuestions(
  formCode: string,
  caseTypeId?: string | null,
) {
  return useQuery({
    queryKey: platformKeys.sourceQuestions(formCode, caseTypeId),
    queryFn: () => getFormSourceQuestions(formCode, caseTypeId),
    enabled: Boolean(formCode),
    staleTime: Infinity,
  });
}

export function useSetFormFieldMapping(formCode: string) {
  const invalidate = useFormInvalidation(formCode);

  return useMutation({
    mutationFn: (input: {
      fieldKey: string;
      sourceQuestionId: string;
      overrideRationale?: string | null;
    }) => setFormFieldMapping(formCode, input),
    onSuccess: () => {
      toast.success("Field mapped");
      invalidate();
    },
    onError: fail("Failed to map the field"),
  });
}

export function useSetFormFieldMappings(formCode: string) {
  const invalidate = useFormInvalidation(formCode);

  return useMutation({
    mutationFn: (
      mappings: {
        fieldKey: string;
        sourceQuestionId: string | null;
        overrideRationale?: string | null;
      }[],
    ) => setFormFieldMappings(formCode, mappings),
    onSuccess: ({ saved, cleared }) => {
      const changed = saved + cleared;
      toast.success(
        changed === 0
          ? "No changes to save"
          : `${changed} field source${changed === 1 ? "" : "s"} saved`,
      );
      invalidate();
    },
    onError: fail("Failed to save the field sources"),
  });
}

export function useClearFormFieldMapping(formCode: string) {
  const invalidate = useFormInvalidation(formCode);

  return useMutation({
    mutationFn: (mappingId: string) =>
      clearFormFieldMapping(formCode, mappingId),
    onSuccess: () => {
      toast.success("Mapping removed");
      invalidate();
    },
    onError: fail("Failed to remove the mapping"),
  });
}

// ─── PDF boxes ──────────────────────────────────────────────────────────────

/**
 * The boxes on the official blank.
 *
 * `staleTime: Infinity` is not a guess here: the response is read out of a PDF
 * on disk, so it cannot change until somebody deploys a new blank.
 */
export function useFormPdfBoxes(formCode: string) {
  return useQuery({
    queryKey: platformKeys.pdfBoxes(formCode),
    queryFn: () => getFormPdfBoxes(formCode),
    enabled: Boolean(formCode),
    staleTime: Infinity,
  });
}

/**
 * The blank with the mapping printed into it.
 *
 * Nested under `platformKeys.form(formCode)`, which is what `useFormInvalidation`
 * clears — so saving a box mapping re-renders the preview without anything
 * here having to say so. That is the whole reason to check a mapping this way:
 * point a key at a box, look at the page, see it land.
 *
 * The bytes are cached and the render is expensive — the server decrypts the
 * official blank and writes several hundred boxes — so it is held until a
 * mapping changes rather than refetched on focus. `retry: false` because the
 * common failure is "no blank on file for this edition", and being told that
 * three times is slower, not clearer.
 */
export function useFormPdfPreview(formCode: string, enabled = true) {
  return useQuery({
    queryKey: platformKeys.pdfPreview(formCode),
    queryFn: () => getFormPdfPreview(formCode),
    enabled: enabled && Boolean(formCode),
    staleTime: Infinity,
    retry: false,
  });
}
export function useFormPdfMappings(
  formCode: string,
  partLabel: string | null | undefined,
) {
  return useQuery({
    queryKey: platformKeys.pdfMappings(formCode, partLabel ?? null),
    queryFn: () => getFormPdfMappings(formCode, partLabel ?? null),
    enabled: Boolean(formCode) && partLabel !== undefined,
    staleTime: Infinity,
  });
}

/**
 * Save a whole screen's worth of box mappings.
 *
 * The server takes one at a time — a box holds one datum, and reclaiming a box
 * from another field is a per-row decision it makes as it goes. Sequential
 * rather than `Promise.all` for exactly that reason: two calls reclaiming the
 * same box in parallel would race, and the loser would look saved.
 */
/**
 * Everything the mapper needs about one form, in one hook.
 *
 * Boxes, their geometry, every field and every mapping — all whole-form, all
 * held until a save invalidates them. Grouped because the screen is useless
 * with any one of them missing, so three separate loading states would only
 * ever be read as one.
 */
export function useFormMapper(formCode: string, enabled = true) {
  const boxes = useFormPdfBoxes(formCode);
  const preview = useFormPdfPreview(formCode, enabled);

  const fields = useQuery({
    queryKey: platformKeys.allFields(formCode),
    queryFn: () => getAllCatalogueFields(formCode),
    enabled: enabled && Boolean(formCode),
    staleTime: Infinity,
  });

  const mappings = useQuery({
    queryKey: platformKeys.allPdfMappings(formCode),
    queryFn: () => getAllFormPdfMappings(formCode),
    enabled: enabled && Boolean(formCode),
    staleTime: Infinity,
  });

  return {
    boxes: boxes.data?.boxes,
    blank: preview.data?.blob,
    fields: fields.data,
    mappings: mappings.data?.mappings,
    isPending:
      boxes.isPending || preview.isPending || fields.isPending || mappings.isPending,
    // The blank is the one that fails in a way worth reading out: "no blank on
    // file for this edition" is the whole answer, and the others 404 together
    // or not at all.
    error: preview.error ?? boxes.error ?? fields.error ?? mappings.error,
  };
}

export function useSetFormPdfMappings(formCode: string) {
  const invalidate = useFormInvalidation(formCode);

  return useMutation({
    mutationFn: async (
      changes: {
        fieldKey: string;
        pdfFieldName: string | null;
        fieldValue?: string | null;
      }[],
    ) => {
      for (const change of changes) {
        await setFormPdfMapping(
          formCode,
          change.fieldKey,
          change.pdfFieldName,
          change.fieldValue ?? null,
        );
      }
      return { saved: changes.length };
    },
    onSuccess: ({ saved }) => {
      toast.success(
        saved === 0
          ? "No changes to save"
          : `${saved} box mapping${saved === 1 ? "" : "s"} saved`,
      );
      invalidate();
    },
    onError: fail("Failed to save the box mappings"),
  });
}

// ─── The questionnaire backbone ─────────────────────────────────────────────

export const questionnaireKeys = {
  all: [...platformKeys.all, "questionnaires"] as const,
  list: (params: PageParams & { stage?: string } = {}) =>
    [...questionnaireKeys.all, "list", params] as const,
  detail: (id: string) => [...questionnaireKeys.all, id] as const,
};

export function useSystemQuestionnaires(
  params: PageParams & { stage?: "intake" | "case" } = {},
) {
  return useQuery({
    queryKey: questionnaireKeys.list(params),
    queryFn: () => getSystemQuestionnaires(params),
    staleTime: Infinity,
    placeholderData: (previous) => previous,
  });
}

export function useSystemQuestionnaire(id: string) {
  return useQuery({
    queryKey: questionnaireKeys.detail(id),
    queryFn: () => getSystemQuestionnaire(id),
    enabled: Boolean(id),
    staleTime: Infinity,
  });
}

export function useCreateSystemQuestionnaire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SystemQuestionnaireInput) =>
      createSystemQuestionnaire(input),
    onSuccess: () => {
      toast.success("Questionnaire published");
      queryClient.invalidateQueries({ queryKey: questionnaireKeys.list() });
    },
    onError: fail("Failed to create the questionnaire"),
  });
}

/**
 * One invalidation for every write below.
 *
 * A section, a question and the questionnaire itself are all read back through
 * the same detail query, so there is one thing to invalidate and no reason for
 * each mutation to work out which parts of it it touched.
 */
function useQuestionnaireInvalidation(questionnaireId: string) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: questionnaireKeys.detail(questionnaireId),
    });
    queryClient.invalidateQueries({ queryKey: questionnaireKeys.list() });
  };
}

export function useUpdateSystemQuestionnaire(questionnaireId: string) {
  const invalidate = useQuestionnaireInvalidation(questionnaireId);

  return useMutation({
    mutationFn: (patch: { title?: string; description?: string | null }) =>
      updateSystemQuestionnaire(questionnaireId, patch),
    onSuccess: () => {
      toast.success("Questionnaire updated");
      invalidate();
    },
    onError: fail("Failed to update the questionnaire"),
  });
}

export function useAddSystemSection(questionnaireId: string) {
  const invalidate = useQuestionnaireInvalidation(questionnaireId);

  return useMutation({
    mutationFn: (input: SectionInput) =>
      addSystemSection(questionnaireId, input),
    onSuccess: () => {
      toast.success("Section added for every firm");
      invalidate();
    },
    onError: fail("Failed to add the section"),
  });
}

export function useUpdateSystemSection(questionnaireId: string) {
  const invalidate = useQuestionnaireInvalidation(questionnaireId);

  return useMutation({
    mutationFn: (vars: { sectionId: string; patch: Partial<SectionInput> }) =>
      updateSystemSection(questionnaireId, vars.sectionId, vars.patch),
    onSuccess: () => {
      toast.success("Section updated");
      invalidate();
    },
    onError: fail("Failed to update the section"),
  });
}

export function useDeleteSystemSection(questionnaireId: string) {
  const invalidate = useQuestionnaireInvalidation(questionnaireId);

  return useMutation({
    mutationFn: (sectionId: string) =>
      deleteSystemSection(questionnaireId, sectionId),
    onSuccess: () => {
      toast.success("Section removed for every firm");
      invalidate();
    },
    onError: fail("Failed to remove the section"),
  });
}

export function useAddSystemQuestion(questionnaireId: string) {
  const invalidate = useQuestionnaireInvalidation(questionnaireId);

  return useMutation({
    mutationFn: (vars: { sectionId: string; input: QuestionInput }) =>
      addSystemQuestion(questionnaireId, vars.sectionId, vars.input),
    onSuccess: () => {
      toast.success("Question added for every firm");
      invalidate();
    },
    onError: fail("Failed to add the question"),
  });
}

export function useUpdateSystemQuestion(questionnaireId: string) {
  const invalidate = useQuestionnaireInvalidation(questionnaireId);

  return useMutation({
    mutationFn: (vars: {
      sectionId: string;
      questionId: string;
      patch: Partial<QuestionInput>;
    }) =>
      updateSystemQuestion(
        questionnaireId,
        vars.sectionId,
        vars.questionId,
        vars.patch,
      ),
    onSuccess: () => {
      toast.success("Question updated");
      invalidate();
    },
    onError: fail("Failed to update the question"),
  });
}

export function useDeleteSystemQuestion(questionnaireId: string) {
  const invalidate = useQuestionnaireInvalidation(questionnaireId);

  return useMutation({
    mutationFn: (vars: { sectionId: string; questionId: string }) =>
      deleteSystemQuestion(questionnaireId, vars.sectionId, vars.questionId),
    onSuccess: () => {
      toast.success("Question removed for every firm");
      invalidate();
    },
    onError: fail("Failed to remove the question"),
  });
}

// ─── Editions, and the blank each one is filed on ───────────────────────────

/**
 * Every edition of a form, newest first.
 *
 * Not `staleTime: Infinity`, unlike the box geometry beside it. That is the
 * same government document for every firm and never changes; this list changes
 * the moment somebody uploads a blank, and a stale copy would show an edition
 * as unprintable seconds after it was made printable.
 */
export function useFormEditions(formCode: string) {
  return useQuery({
    queryKey: platformKeys.editions(formCode),
    queryFn: () => getFormEditions(formCode),
    enabled: Boolean(formCode),
  });
}

export function useAddFormEdition(formCode: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: EditionInput) => addFormEdition(formCode, input),
    onSuccess: (edition) => {
      toast.success(`${formCode} ${edition.editionDate} edition recorded`);
      queryClient.invalidateQueries({
        queryKey: platformKeys.editions(formCode),
      });
    },
    onError: fail("Failed to record the edition"),
  });
}

export function useUpdateFormEdition(formCode: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: {
      editionId: string;
      patch: Partial<Omit<EditionInput, "editionDate">>;
    }) => updateFormEdition(formCode, vars.editionId, vars.patch),
    onSuccess: () => {
      toast.success("Edition updated");
      queryClient.invalidateQueries({
        queryKey: platformKeys.editions(formCode),
      });
    },
    onError: fail("Failed to update the edition"),
  });
}

/**
 * Upload an edition's blank.
 *
 * Invalidates the edition list and nothing else, deliberately. The upload has
 * not changed the catalogue — the fields, the field map and the PDF mappings
 * all still say what they said — and clearing them here would make the screen
 * refetch four lists to show the same rows. The import is what invalidates the
 * form, because the import is what changes it.
 */
export function useUploadFormBlank(formCode: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { editionId: string; file: File }) =>
      uploadFormBlank(formCode, vars.editionId, vars.file),
    onSuccess: (result) => {
      // The server's sentence, not one rebuilt here: "byte-for-byte the blank
      // already on this edition" and "Blank uploaded" are different outcomes
      // and the difference is the whole point of telling somebody.
      if (result.unchanged) toast.info(result.message);
      else toast.success(`${result.boxes} boxes read off the blank`);

      queryClient.invalidateQueries({
        queryKey: platformKeys.editions(formCode),
      });
    },
    onError: fail("Failed to upload the blank"),
  });
}

/** What an import would change. Fetched on demand, never cached. */
export function useFormImportPlan(
  formCode: string,
  editionId: string | null,
) {
  return useQuery({
    queryKey: [...platformKeys.editions(formCode), editionId, "import-plan"],
    queryFn: () => previewFormImport(formCode, editionId!),
    enabled: Boolean(formCode && editionId),
    /*
      A plan is a statement about right now — what these rows are, against what
      that blank says. Serving a cached one after somebody has wired a box in
      the mapper would describe a world that no longer exists, and the whole
      value of the plan is that it is true when it is read.
    */
    staleTime: 0,
    gcTime: 0,
  });
}

export function useImportFormCatalogue(formCode: string) {
  const invalidate = useFormInvalidation(formCode);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (editionId: string) => importFormCatalogue(formCode, editionId),
    onSuccess: (result) => {
      toast.success(
        `${result.fields} fields catalogued from the ${result.editionDate} blank`,
      );
      // Everything about this form has potentially moved: its fields, their
      // parts, the field map and the box mappings.
      invalidate();
      queryClient.invalidateQueries({
        queryKey: platformKeys.editions(formCode),
      });
    },
    onError: fail("Failed to import the catalogue"),
  });
}
