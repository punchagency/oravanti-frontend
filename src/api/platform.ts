import { API } from "./index";

/**
 * Oravanti's own CRM.
 *
 * Everything here addresses the *platform's* content — a form, a field, a
 * mapping, a case type — never a matter. That is the boundary the whole tier
 * rests on, and it shows up in the shapes: nothing in this file takes a
 * `caseId`, because nothing here belongs to one firm.
 *
 * The firm-facing counterparts in `case-details.ts` all began with a `caseId`
 * that was never used to scope the write. Reading the two files side by side is
 * the clearest statement of what changed: one addresses matters, this one
 * addresses forms.
 *
 * Every call is gated server-side by `requirePlatformAdmin`. A firm user
 * calling any of these gets a 403 whose body reads as a 404, on purpose — a
 * distinguishable error is itself a disclosure.
 */

export interface PlatformAdmin {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}

export const getPlatformMe = async () => {
  const { data } = await API.get<{ data: PlatformAdmin }>("/platform/me");
  return data.data;
};

// ─── The taxonomy: practice area → subcategory → case type ──────────────────
//
// Three levels, and every one of them is paginated. 8 practice areas, 57
// subcategories, 687 case types — the last number is why the middle level is a
// level rather than being flattened away, and why nothing here fetches a whole
// list. Immigration alone holds around 150 leaves.

/** The page envelope every list endpoint returns. */
export interface Page<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PageParams {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Whether a node is still offered, mirrored from the `taxonomy_status` enum.
 *
 * An enum rather than a boolean because a third state is foreseeable — "coming
 * soon", "deprecated, use this other one" — and a boolean can never grow one.
 * Treat a value this build does not know as *not offered*: a newer deployment
 * can write one, and a picker that crashes is worse than a picker missing a
 * row.
 */
export type TaxonomyStatus = "active" | "archived";

/** What a person may change on a node once it exists. */
export interface TaxonomyNodePatch {
  name?: string;
  description?: string | null;
  status?: TaxonomyStatus;
}

/**
 * One reason a node cannot be deleted, as the 409 body carries it.
 *
 * The API refuses the delete and lists what holds the node rather than
 * surfacing a foreign key violation — and rather than letting the delete
 * cascade, which is the worse half: a practice area takes every firm's
 * workflow templates and staff assignments with it, silently.
 */
export interface TaxonomyBlocker {
  label: string;
  count: number;
}

export interface PlatformPracticeArea {
  id: string;
  name: string;
  description: string | null;
  status: TaxonomyStatus;
  subcategoryCount: number;
  caseTypeCount: number;
}

export interface PracticeAreaDetail extends PlatformPracticeArea {
  createdAt: string;
  updatedAt: string;
}

export interface PlatformSubcategory {
  id: string;
  /** Stable handle, settable at creation and never after. `name` is the label. */
  code: string;
  name: string;
  description: string | null;
  status: TaxonomyStatus;
  caseTypeCount: number;
}

export interface SubcategoryDetail extends PlatformSubcategory {
  practiceAreaId: string;
  practiceAreaName: string;
}

export type CaseTypeJurisdiction =
  "federal" | "state" | "federal & state" | "varies";

/** The taxonomy leaf a questionnaire and a filing package are both filed under. */
export interface PlatformCaseType {
  id: string;
  code: string;
  name: string;
  jurisdiction: CaseTypeJurisdiction | null;
  description: string | null;
  status: TaxonomyStatus;
  /** How much of this leaf Oravanti has actually set up. */
  formCount: number;
  questionnaireCount: number;
}

export interface TaxonomyCounts {
  practiceAreas: number;
  subcategories: number;
  caseTypes: number;
  /** The ones that file anything. The gap from `caseTypes` is the backlog. */
  caseTypesWithForms: number;
}

export const getTaxonomyCounts = async () => {
  const { data } = await API.get<{ data: TaxonomyCounts }>(
    "/platform/taxonomy/counts",
  );
  return data.data;
};

export const getPracticeAreas = async (params: PageParams = {}) => {
  const { data } = await API.get<{ data: Page<PlatformPracticeArea> }>(
    "/platform/practice-areas",
    { params },
  );
  return data.data;
};

export const getSubcategories = async (
  practiceAreaId: string,
  params: PageParams = {},
) => {
  const { data } = await API.get<{
    data: Page<PlatformSubcategory> & {
      practiceArea: { id: string; name: string };
    };
  }>(`/platform/practice-areas/${practiceAreaId}/subcategories`, { params });
  return data.data;
};

export const getCaseTypes = async (
  subcategoryId: string,
  params: PageParams = {},
) => {
  const { data } = await API.get<{
    data: Page<PlatformCaseType> & {
      subcategory: {
        id: string;
        name: string;
        practiceAreaId: string;
        practiceAreaName: string;
      };
    };
  }>(`/platform/subcategories/${subcategoryId}/case-types`, { params });
  return data.data;
};

// ─── Maintaining the taxonomy ───────────────────────────────────────────────
//
// The seed bootstraps the 8 / 57 / 687; everything after that happens here.
//
// `code` appears on the create bodies and on none of the patches, deliberately:
// it is half of a unique key, the seeds find their targets by it, and a case
// type's `caseNumberPrefix` is already stamped into every matter number issued
// under it. Renaming is what `name` is for.

export const getPracticeArea = async (practiceAreaId: string) => {
  const { data } = await API.get<{ data: PracticeAreaDetail }>(
    `/platform/practice-areas/${practiceAreaId}`,
  );
  return data.data;
};

export const createPracticeArea = async (body: {
  name: string;
  description?: string | null;
}) => {
  const { data } = await API.post<{ data: PracticeAreaDetail }>(
    "/platform/practice-areas",
    body,
  );
  return data.data;
};

export const updatePracticeArea = async (
  practiceAreaId: string,
  patch: TaxonomyNodePatch,
) => {
  const { data } = await API.patch<{ data: PracticeAreaDetail }>(
    `/platform/practice-areas/${practiceAreaId}`,
    patch,
  );
  return data.data;
};

/** Refused with a `TaxonomyBlocker[]` if anything at all references it. */
export const deletePracticeArea = async (practiceAreaId: string) => {
  await API.delete(`/platform/practice-areas/${practiceAreaId}`);
};

export const getSubcategory = async (subcategoryId: string) => {
  const { data } = await API.get<{ data: SubcategoryDetail }>(
    `/platform/subcategories/${subcategoryId}`,
  );
  return data.data;
};

export const createSubcategory = async (
  practiceAreaId: string,
  body: { code: string; name: string; description?: string | null },
) => {
  const { data } = await API.post<{ data: SubcategoryDetail }>(
    `/platform/practice-areas/${practiceAreaId}/subcategories`,
    body,
  );
  return data.data;
};

export const updateSubcategory = async (
  subcategoryId: string,
  patch: TaxonomyNodePatch,
) => {
  const { data } = await API.patch<{ data: SubcategoryDetail }>(
    `/platform/subcategories/${subcategoryId}`,
    patch,
  );
  return data.data;
};

export const deleteSubcategory = async (subcategoryId: string) => {
  await API.delete(`/platform/subcategories/${subcategoryId}`);
};

export const createCaseType = async (
  subcategoryId: string,
  body: {
    code: string;
    name: string;
    caseNumberPrefix: string;
    jurisdiction: CaseTypeJurisdiction;
    description?: string | null;
  },
) => {
  const { data } = await API.post<{ data: PlatformCaseType }>(
    `/platform/subcategories/${subcategoryId}/case-types`,
    body,
  );
  return data.data;
};

export const updateCaseType = async (
  caseTypeId: string,
  patch: TaxonomyNodePatch & {
    caseNumberPrefix?: string;
    jurisdiction?: CaseTypeJurisdiction;
  },
) => {
  const { data } = await API.patch<{ data: PlatformCaseType }>(
    `/platform/case-types/${caseTypeId}`,
    patch,
  );
  return data.data;
};

export const deleteCaseType = async (caseTypeId: string) => {
  await API.delete(`/platform/case-types/${caseTypeId}`);
};

// ─── One case type: its filing package and its questionnaires ───────────────

/** A form on a case type's package. `title` is null if nobody catalogued it. */
export interface CaseTypePackageForm {
  formCode: string;
  role: "core" | "supporting";
  orderIndex: number;
  title: string | null;
}

export interface CaseTypeQuestionnaireRef {
  id: string;
  stage: "intake" | "case";
  title: string;
  description: string | null;
}

export interface CaseTypeDetail {
  caseType: {
    id: string;
    code: string;
    name: string;
    jurisdiction: CaseTypeJurisdiction | null;
    /** Stamped into matter numbers as they are issued — see the API. */
    caseNumberPrefix: string;
    description: string | null;
    status: TaxonomyStatus;
    subcategoryId: string;
    subcategoryName: string;
    practiceAreaId: string;
    practiceAreaName: string;
  };
  forms: CaseTypePackageForm[];
  /*
    By stage rather than as a list, because the two are not interchangeable and
    the CRM shows them as two tabs: `intake` is asked before there is a matter,
    `case` after. Either may be null, and null is what the tab offers to create.
  */
  questionnaires: {
    intake: CaseTypeQuestionnaireRef | null;
    case: CaseTypeQuestionnaireRef | null;
  };
}

export const getCaseType = async (caseTypeId: string) => {
  const { data } = await API.get<{ data: CaseTypeDetail }>(
    `/platform/case-types/${caseTypeId}`,
  );
  return data.data;
};

/** The catalogue minus what is already on this package. */
export const getFormsForCaseType = async (
  caseTypeId: string,
  params: PageParams = {},
) => {
  const { data } = await API.get<{
    data: Page<{ id: string; formCode: string; title: string }>;
  }>(`/platform/case-types/${caseTypeId}/available-forms`, { params });
  return data.data;
};

/*
  The three writes below change what every firm's *next* matter of this type is
  provisioned with. Matters already open are untouched — `ensurePackageForms`
  is additive and runs when a matter's tasks are materialised.
*/

export const setCaseTypeForm = async (
  caseTypeId: string,
  body: { formCode: string; role?: "core" | "supporting" },
) => {
  const { data } = await API.post<{ data: CaseTypePackageForm }>(
    `/platform/case-types/${caseTypeId}/forms`,
    body,
  );
  return data.data;
};

export const removeCaseTypeForm = async (
  caseTypeId: string,
  formCode: string,
) => {
  await API.delete(`/platform/case-types/${caseTypeId}/forms/${formCode}`);
};

/** Takes the whole package, in order. A partial list is rejected — see the API. */
export const reorderCaseTypeForms = async (
  caseTypeId: string,
  formCodes: string[],
) => {
  await API.put(`/platform/case-types/${caseTypeId}/forms`, { formCodes });
};

// ─── The form catalogue ─────────────────────────────────────────────────────

/**
 * A form Oravanti publishes.
 *
 * No `isLocked`/`isEdited`: those distinguished the platform's row from a
 * firm's copy of it, and there are no firm copies any more. Every row in the
 * catalogue is this one.
 */
export interface CatalogueForm {
  id: string;
  formCode: string;
  title: string;
  description: string | null;
  /**
   * Who completes the form, when it is not the firm — the instruction to
   * follow, not just a name.
   *
   * Set on the I-693 and nothing else today. A form that has one is not
   * editable by a firm, is not populated from the questionnaire, and is left
   * out of the merged filing package: the sealed envelope goes in instead.
   */
  providedBy: string | null;
}

export interface CatalogueField {
  id: string;
  formCode: string;
  /** The datum, e.g. `beneficiary.date_of_birth` — shared with the question that asks it. */
  fieldKey: string;
  label: string;
  /** The form's own division, e.g. "Part 1. Information About You". */
  partLabel: string | null;
  type: string;
  orderIndex: number;
  helpText: string | null;
  config: { options?: string[] } | null;
  isRequired: boolean;
  /**
   * The vocabulary node this box prints, or null where it carries the form's
   * own name for something nothing else asks.
   *
   * This is what the mapper's overlay paints from: green carries a datum and
   * will print, amber is mapped but only to the form's own name for the box so
   * it prints blank, grey has no mapping at all. It used to be inferred from
   * the shape of the key in both repos; it is a foreign key now, so the
   * overlay, the coverage bar and population read one column.
   */
  schemaNodeId: string | null;
  /** Which entry of a repeating node, counting from 1. Null when it is not one. */
  entryIndex: number | null;
}

/**
 * A catalogue row as the CRM's list shows it: the form, how much of it prints,
 * and which edition is in force.
 *
 * `mappedCount` counts the *data* that print into a box on the current edition
 * — a box whose key only names itself (`i485.pt1.1_family_name`) is asked for
 * by nothing and prints blank, so it does not count. This is the same rule the
 * visual mapper paints its overlay from, so the coverage bar here and the wired
 * count there mean the same thing.
 *
 * Not mapping rows either: a choice is one row per option, and a field with
 * three options mapped is one field that prints, not three.
 */
export interface CatalogueFormOverview extends CatalogueForm {
  fieldCount: number;
  mappedCount: number;
  /**
   * The practice areas some case type under which files this form.
   *
   * A form has no owning practice area — the I-864 is filed on a family
   * adjustment and on an employment one — so this is derived from the packages
   * that name it. Empty means catalogued but on nobody's package yet.
   */
  practiceAreas: { id: string; name: string }[];
  /** How many case types file it, across all of those areas. */
  caseTypeCount: number;
  /**
   * The edition being filed on today, or null when none is on record.
   *
   * `acceptedUntil` is the date USCIS stops taking this edition. It is the one
   * number on this screen with a deadline attached: past it, every mapping
   * still resolves and the PDF still renders, from a blank that will be
   * rejected. Null means the edition is current with no announced end.
   */
  edition: { editionDate: string; acceptedUntil: string | null } | null;
}

/** The catalogue list, paged and searched, optionally narrowed to one practice area. */
export interface FormCatalogueParams extends PageParams {
  practiceAreaId?: string;
}

export const getCatalogueForms = async (params: FormCatalogueParams = {}) => {
  const { data } = await API.get<{ data: Page<CatalogueFormOverview> }>(
    "/platform/forms",
    { params },
  );
  return data.data;
};

/**
 * A case type whose filing package names this form.
 *
 * The whole trail, not just the case type: 687 case types share names across
 * practice areas ("Adjustment of status" is family, employment and asylum), so
 * a bare name would be ambiguous on exactly the page where the question is
 * "who else does this change reach".
 */
export interface FormFiledOn {
  caseTypeId: string;
  caseType: string;
  /** `archived` still refers to the form — the thing an operator is about to break. */
  caseTypeStatus: TaxonomyStatus;
  subcategoryId: string;
  subcategory: string;
  practiceAreaId: string;
  practiceArea: string;
  role: "core" | "supporting";
  orderIndex: number;
}

/**
 * One part of a form, and how much of it is wired up.
 *
 * The index the form page navigates by. Three counts because its three views
 * ask three different questions of the same part — what is on it, what fills
 * it, where it prints.
 */
export interface FormPart {
  /** Null for the part of a form whose fields carry no label. */
  partLabel: string | null;
  /**
   * What the part is for, where somebody has said.
   *
   * Null on a part nobody has described, and always null on the unlabelled
   * one — the absence of a part is not a part, so there is nowhere to hang a
   * sentence off it.
   */
  description: string | null;
  fieldCount: number;
  sourcedCount: number;
  mappedCount: number;
}

/**
 * A form, its parts and where it is filed from — everything the page needs
 * before a part is chosen, and nothing it does not.
 *
 * Parts rather than fields: each view reads the one part it is showing. The
 * I-485 is 512 field definitions and sending them all to draw a heading was
 * most of what the page cost.
 */
export const getCatalogueForm = async (formCode: string) => {
  const { data } = await API.get<{
    data: {
      form: CatalogueForm | null;
      parts: FormPart[];
      filedOn: FormFiledOn[];
      /**
       * What the form says it is *for*, which is not the same as what files
       * it. `filedOn` is the packages naming it; this is the classification an
       * operator gave it when they added it, and a new form has the second
       * without the first for as long as nobody has built a package yet.
       */
      practiceAreas: { id: string; name: string }[];
    };
  }>(`/platform/forms/${formCode}`);
  return data.data;
};

/**
 * The fields of one part, in printing order.
 *
 * `partLabel` is the part's own label, or null for the part of a form whose
 * fields carry none — which the server reads off an empty `?part=`, the only
 * thing a query string can use to say null.
 */
export const getCatalogueFields = async (
  formCode: string,
  partLabel: string | null,
) => {
  const { data } = await API.get<{ data: CatalogueField[] }>(
    `/platform/forms/${formCode}/fields`,
    { params: { part: partLabel ?? "" } },
  );
  return data.data;
};

/*
  ─── Whole-form reads, for the screen that works by page ────────────────────

  Every other read here narrows to a part, because a part is what a screen
  shows. The mapper is the exception: it draws boxes over a rendered *page*,
  and a page holds whatever parts happen to print on it — a Part 1 field
  printing into a Part 14 continuation box is the ordinary case rather than the
  exception. Narrowing there would make a wired box look unwired for as long as
  somebody was looking at a different part, and the overlay's colour is the one
  thing on that screen that must not lie.

  Omitting `part` entirely is how the server is asked for all of it; sending an
  empty one asks for the part whose fields carry no label, which is a different
  question. That distinction is why these are separate functions rather than a
  null argument.
*/

/** Every field on the form, whatever part it sits in. */
export const getAllCatalogueFields = async (formCode: string) => {
  const { data } = await API.get<{ data: CatalogueField[] }>(
    `/platform/forms/${formCode}/fields`,
  );
  return data.data;
};

export interface FormInput {
  /** e.g. "I-601". Immutable afterwards — every value and filing is keyed by it. */
  formCode: string;
  title: string;
  description?: string | null;
  /** See `CatalogueForm.providedBy`. Almost always absent. */
  providedBy?: string | null;
  /**
   * Which practice areas this form is for. Plural, and editable afterwards.
   *
   * A *single* owning area would be a lie — the I-864 is filed on a
   * family-based adjustment and on an employment-based one — so these are rows
   * in `form_practice_areas` and nothing reads the first of them.
   *
   * It writes no filing package. Which matter types actually open with the form
   * is decided later, on the matter type's own page; inferring it from an area
   * would put the form on all 150 matter types under Immigration. The Forms
   * list reads the union of the two, so a form classified here shows under its
   * area immediately even though nothing files it yet.
   *
   * Optional. A form nobody has classified is ordinary.
   */
  practiceAreaIds?: string[];
}

export const addCatalogueForm = async (input: FormInput) => {
  const { data } = await API.post<{ data: CatalogueForm }>(
    "/platform/forms",
    input,
  );
  return data.data;
};

export const updateCatalogueForm = async (
  definitionId: string,
  patch: {
    title?: string;
    description?: string | null;
    providedBy?: string | null;
    /**
     * The whole set of practice areas, replacing what is stored — or omitted
     * to leave the classification alone. An empty array is not the same as
     * omitting it: it says the form is for nothing in particular.
     */
    practiceAreaIds?: string[];
  },
) => {
  const { data } = await API.patch<{ data: CatalogueForm }>(
    `/platform/forms/definitions/${definitionId}`,
    patch,
  );
  return data.data;
};

/**
 * Removes a form from the catalogue, with its fields.
 *
 * Nothing on any matter is touched. A form already filed stays filed, and what
 * somebody typed into it is part of that matter's record.
 */
export const deleteCatalogueForm = async (definitionId: string) => {
  await API.delete(`/platform/forms/definitions/${definitionId}`);
};

export interface FieldInput {
  /**
   * The datum this field prints, chosen from the vocabulary.
   *
   * Giving it the key an existing question already uses is what makes the field
   * fill from the questionnaire automatically, with no mapping row at all.
   *
   * Omitted where the box carries no shared datum — most of them do not, and
   * the server then generates the form's own name for it. Absence is the
   * operator saying so, not a field left blank.
   */
  fieldKey?: string;
  label: string;
  partLabel?: string | null;
  type: string;
  helpText?: string | null;
  config?: { options?: string[] };
  isRequired?: boolean;
  orderIndex?: number;
}

export const addCatalogueField = async (
  formCode: string,
  field: FieldInput,
) => {
  const { data } = await API.post<{ data: CatalogueField }>(
    `/platform/forms/${formCode}/fields`,
    field,
  );
  return data.data;
};

/** `fieldKey` is absent on purpose — changing it unfills the field. */
export const updateCatalogueField = async (
  formCode: string,
  definitionId: string,
  patch: Partial<Omit<FieldInput, "fieldKey">>,
) => {
  const { data } = await API.patch<{ data: CatalogueField }>(
    `/platform/forms/${formCode}/fields/${definitionId}`,
    patch,
  );
  return data.data;
};

export const deleteCatalogueField = async (
  formCode: string,
  definitionId: string,
) => {
  await API.delete(`/platform/forms/${formCode}/fields/${definitionId}`);
};

/**
 * Name a part, or describe one.
 *
 * The same write either way. A part is normally produced by its fields, but a
 * part with a description — or one named before it has any fields — needs a row
 * of its own, and this is that row arriving. Calling it on a part that already
 * exists sets the description; calling it on a name the form has never used
 * creates the part, empty, ready for a field.
 */
export const saveFormPart = async (
  formCode: string,
  partLabel: string,
  description: string | null,
) => {
  const { data } = await API.put<{ data: { id: string } }>(
    `/platform/forms/${formCode}/parts`,
    { partLabel, description },
  );
  return data.data;
};

/** Remove a part that has no fields in it. One with fields is emptied first. */
export const deleteFormPart = async (formCode: string, partLabel: string) => {
  await API.delete(`/platform/forms/${formCode}/parts`, {
    params: { partLabel },
  });
};

/**
 * Rename one part, across every field in it.
 *
 * A part is not a row — it is the distinct `partLabel` values on the form's
 * fields — so this is one call rather than 172 field edits, and it is the only
 * way to rename Part 9 of the I-485 without leaving it half-renamed into two
 * parts. `from` may be null (the fields the extraction could not place); `to`
 * may not. Renaming onto a part the form already has is refused rather than
 * merged.
 */
export const renameFormPart = async (
  formCode: string,
  from: string | null,
  to: string,
) => {
  const { data } = await API.patch<{
    data: { formCode: string; from: string | null; to: string; fields: number };
  }>(`/platform/forms/${formCode}/part`, { from, to });
  return data.data;
};

/** The whole form's order, saved at once — the unit a drag-to-reorder works in. */
export const reorderCatalogueFields = async (
  formCode: string,
  order: { fieldDefinitionId: string; orderIndex: number }[],
) => {
  const { data } = await API.put<{ data: { updated: number } }>(
    `/platform/forms/${formCode}/fields/order`,
    { order },
  );
  return data.data;
};

// ─── Field sources: which question fills which field ────────────────────────

/** How a field came to be connected to a question, or that it has not been. */
export type FieldFeedSource = "mapping" | "shared_key" | "none";

export interface FieldMapEntry {
  fieldKey: string;
  label: string;
  partLabel: string | null;
  type: string;
  isRequired: boolean;
  source: FieldFeedSource;
  /** A mapping exists but the question behind it has been deleted. */
  isBroken: boolean;
  mappingId: string | null;
  overridesSharedKey: boolean;
  overrideRationale: string | null;
  question: { id: string; label: string; sectionTitle: string } | null;
}

/**
 * A question that can feed a field.
 *
 * Platform questions only. A mapping is global, so pointing a field at one
 * firm's question would leave the box unfed for every other firm while looking
 * configured — the server refuses it, and this list never offers it.
 */
export interface MappableQuestion {
  id: string;
  label: string;
  fieldKey: string | null;
  type: string;
  sectionTitle: string;
}

export interface FormFieldMap {
  form: { formCode: string; fields: FieldMapEntry[] };
}

/**
 * Every field of one part with what feeds it.
 *
 * Every field of the part, not only the mapped ones — "what fills this box?" is
 * a question about all of them, and a screen showing only the exceptions could
 * not answer it.
 */
export const getFormFieldMap = async (
  formCode: string,
  partLabel: string | null,
): Promise<FormFieldMap> => {
  const { data } = await API.get<{ data: FormFieldMap }>(
    `/platform/forms/${formCode}/field-map`,
    { params: { part: partLabel ?? "" } },
  );
  return data.data;
};

/**
 * The questions a field on this form can be pointed at.
 *
 * Its own request because it is the same list whichever part is open — around
 * 250 questions, and re-sending them on every move between parts was the larger
 * half of each response and none of it new. `caseTypeId` narrows them to one
 * case type's set.
 */
export const getFormSourceQuestions = async (
  formCode: string,
  caseTypeId?: string | null,
) => {
  const { data } = await API.get<{ data: { questions: MappableQuestion[] } }>(
    `/platform/forms/${formCode}/source-questions`,
    { params: caseTypeId ? { caseTypeId } : undefined },
  );
  return data.data;
};

/**
 * Point one field at one question, immediately.
 *
 * Kept alongside the batch below because it serves a different moment: writing
 * a question that names the field it fills, where there is one mapping and no
 * form open to review it on.
 */
export const setFormFieldMapping = async (
  formCode: string,
  input: {
    fieldKey: string;
    sourceQuestionId: string;
    overrideRationale?: string | null;
  },
) => {
  const { data } = await API.put<{ data: FieldMapEntry }>(
    `/platform/forms/${formCode}/field-map/one`,
    input,
  );
  return data.data;
};

/**
 * One form's field sources, saved together.
 *
 * A null `sourceQuestionId` clears that field's mapping and returns it to
 * whatever the shared `fieldKey` vocabulary says, so the request describes the
 * state wanted rather than a delta the caller had to work out.
 */
export const setFormFieldMappings = async (
  formCode: string,
  mappings: {
    fieldKey: string;
    sourceQuestionId: string | null;
    overrideRationale?: string | null;
  }[],
) => {
  const { data } = await API.put<{ data: { saved: number; cleared: number } }>(
    `/platform/forms/${formCode}/field-map`,
    { mappings },
  );
  return data.data;
};

export const clearFormFieldMapping = async (
  formCode: string,
  mappingId: string,
) => {
  await API.delete(`/platform/forms/${formCode}/field-map/${mappingId}`);
};

// ─── The official blank, and what prints into it ────────────────────────────

/** One fillable box on a form's official PDF. */
export interface FormPdfBox {
  /** The fully-qualified AcroForm name, e.g. `form1[0].#subform[1].Pt4Line9_DateOfBirth[0]`. */
  name: string;
  kind: "text" | "checkbox" | "dropdown";
  /** The exact strings a dropdown accepts. Empty for other kinds. */
  options: string[];
  /**
   * The box's printed question, from the blank's own accessibility text — e.g.
   * "Part 9. General Eligibility and Inadmissibility Grounds. 13. Have you EVER
   * violated the terms or conditions of your nonimmigrant status?"
   *
   * Null where the blank has none, which on these forms is a handful of unnamed
   * boxes.
   */
  tooltip: string | null;
  /**
   * Where the box sits on the paper, so the mapper can draw over it.
   *
   * Already in the browser's coordinates — percentages of the page, measured
   * from its top-left — so a rectangle is `left`/`top`/`width`/`height` with
   * `%` appended and nothing converts anything. See `BoxPlacement` on the
   * server for why percentages and not points.
   *
   * Plural because a field can print in more than one place: a radio group is
   * one name over several boxes. Empty where no widget of the box resolves to
   * a page — the box still has a row, because the box list is a checklist of
   * what needs wiring and must not quietly shorten.
   */
  placements: FormPdfBoxPlacement[];
}

/** One rectangle of a box, in page percentages from the top-left. */
export interface FormPdfBoxPlacement {
  /** Zero-based page index, matching what pdf.js calls page `n + 1`. */
  page: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FormPdfMapping {
  fieldKey: string;
  pdfFieldName: string;
  /**
   * Which answer marks this box, for a choice — null when the box holds the
   * whole datum.
   *
   * USCIS prints a separate checkbox per option, so a choice field has one row
   * here per option and they differ only in this. A single row per field would
   * mean every answer but one printed nowhere.
   */
  fieldValue: string | null;
}

/**
 * Every box on the form's blank, read out of the PDF itself.
 *
 * Barcode fields are already excluded by the server — USCIS puts one on every
 * page for its own scanner, and they are never a mapping target.
 */
export const getFormPdfBoxes = async (formCode: string) => {
  const { data } = await API.get<{ data: { boxes: FormPdfBox[] } }>(
    `/platform/forms/${formCode}/pdf-boxes`,
  );
  return data.data;
};

/**
 * The form's official blank, and how much of it is mapped.
 *
 * The blank is served as the government prints it, with nothing written into
 * it — this is the one place in the tier that shows the real paper. Which datum
 * claims which box is the PDF boxes screen's job; the counts that ride back in
 * the headers are what says how much of the form that screen still has to
 * account for.
 *
 * Fetched as a blob for the same reason `getCaseFormPdf` is: the endpoint needs
 * the app's auth cookies and headers, so a bare `src` on the URL would be an
 * unauthenticated request. The blob is returned rather than an object URL,
 * because an object URL is a live handle that has to be revoked — cache the
 * bytes, make the URL where it is rendered. See `useObjectUrl`.
 */
export const getFormPdfPreview = async (
  formCode: string,
): Promise<{
  blob: Blob;
  editionDate: string;
  boxes: number;
  mapped: number;
  unmapped: number;
}> => {
  try {
    const res = await API.get(`/platform/forms/${formCode}/pdf-preview`, {
      responseType: "blob",
    });

    return {
      blob: res.data as Blob,
      editionDate: String(res.headers["x-edition-date"] ?? ""),
      boxes: Number(res.headers["x-boxes"] ?? 0),
      mapped: Number(res.headers["x-boxes-mapped"] ?? 0),
      unmapped: Number(res.headers["x-boxes-unmapped"] ?? 0),
    };
  } catch (error) {
    /*
      Asking for a blob means the *error* body arrives as one too, so the
      server's explanation is bytes rather than JSON. Unpacked here, at the one
      place that knows the request was made this way. It matters: "No blank PDF
      for the 2026-09-18 edition of I-485" is the whole answer, and "Request
      failed with status code 404" is none of it.
    */
    const body = (error as { response?: { data?: unknown } })?.response?.data;
    let message = "This form could not be previewed.";
    try {
      const parsed =
        body instanceof Blob ? JSON.parse(await body.text()) : body;
      message =
        (parsed as { message?: string } | undefined)?.message ?? message;
    } catch {
      // A non-JSON error body. The default sentence is better than its bytes.
    }
    throw new Error(message, { cause: error });
  }
};

/**
 * Which datum prints into which box, for the fields of one part.
 *
 * The boxes themselves are not narrowed — see `getFormPdfBoxes`. A field in
 * Part 1 legitimately prints into a box in Part 14 (that is what a continuation
 * sheet is), so the list of targets stays the whole form's.
 */
export const getFormPdfMappings = async (
  formCode: string,
  partLabel: string | null,
) => {
  const { data } = await API.get<{
    data: {
      editionId: string;
      editionDate: string;
      mappings: FormPdfMapping[];
    };
  }>(`/platform/forms/${formCode}/pdf-mappings`, {
    params: { part: partLabel ?? "" },
  });
  return data.data;
};

/** Every mapping on the form. See `getAllCatalogueFields` for why. */
export const getAllFormPdfMappings = async (formCode: string) => {
  const { data } = await API.get<{
    data: {
      editionId: string;
      editionDate: string;
      mappings: FormPdfMapping[];
    };
  }>(`/platform/forms/${formCode}/pdf-mappings`);
  return data.data;
};

/**
 * Point a field key at a box, or pass null to clear it.
 *
 * `fieldValue` addresses one answer of a choice; null addresses the whole
 * datum. The two are separate rows on the server, so clearing one option leaves
 * its siblings mapped.
 */
export const setFormPdfMapping = async (
  formCode: string,
  fieldKey: string,
  pdfFieldName: string | null,
  fieldValue: string | null = null,
) => {
  const { data } = await API.put<{ data: { cleared: boolean } }>(
    `/platform/forms/${formCode}/pdf-mappings`,
    { fieldKey, pdfFieldName, fieldValue },
  );
  return data.data;
};

// ─── The questionnaire backbone ─────────────────────────────────────────────
//
// These sit under `/questionnaires/system` rather than `/platform`, which is
// the one seam in this file. The reason is that they read and write the same
// two tables a firm's own sections and questions live in, through the same
// service, and moving them would have split one module across two routers to
// buy a tidier URL. They are gated by `requirePlatformAdmin` per route — the
// only per-route gate in the backend, because that router also serves firm
// staff and clients on every other path.

/** Which conversation this questionnaire is: before the matter, or during it. */
export type QuestionnaireStage = "intake" | "case";

export interface SystemQuestionnaireSummary {
  id: string;
  caseTypeId: string;
  /** Joined in, so the list does not have to hold 687 case types to name one. */
  caseTypeName: string;
  stage: QuestionnaireStage;
  title: string;
  description: string | null;
  createdAt: string;
}

export interface SystemQuestion {
  id: string;
  sectionId: string;
  label: string;
  description: string | null;
  /** The shared vocabulary name — what connects this question to a form field. */
  fieldKey: string | null;
  type: string;
  isRequired: boolean;
  orderIndex: number;
  config: { options?: string[] } | null;
}

export interface SystemSection {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  questions: SystemQuestion[];
}

export interface SystemQuestionnaire extends SystemQuestionnaireSummary {
  sections: SystemSection[];
}

export const getSystemQuestionnaires = async (
  params: PageParams & { stage?: QuestionnaireStage } = {},
) => {
  const { data } = await API.get<{ data: Page<SystemQuestionnaireSummary> }>(
    "/questionnaires/system",
    { params },
  );
  return data.data;
};

export const getSystemQuestionnaire = async (id: string) => {
  const { data } = await API.get<{ data: SystemQuestionnaire }>(
    `/questionnaires/system/${id}`,
  );
  return data.data;
};

export interface SystemQuestionnaireInput {
  caseTypeId: string;
  stage?: QuestionnaireStage;
  title: string;
  description?: string | null;
}

export const createSystemQuestionnaire = async (
  input: SystemQuestionnaireInput,
) => {
  const { data } = await API.post<{ data: SystemQuestionnaire }>(
    "/questionnaires/system",
    input,
  );
  return data.data;
};

/** `caseTypeId` and `stage` are absent: together they are the identity. */
export const updateSystemQuestionnaire = async (
  id: string,
  patch: { title?: string; description?: string | null },
) => {
  const { data } = await API.patch<{ data: SystemQuestionnaireSummary }>(
    `/questionnaires/system/${id}`,
    patch,
  );
  return data.data;
};

export interface SectionInput {
  title: string;
  description?: string | null;
  orderIndex?: number;
}

export const addSystemSection = async (
  questionnaireId: string,
  input: SectionInput,
) => {
  const { data } = await API.post<{ data: SystemSection }>(
    `/questionnaires/system/${questionnaireId}/sections`,
    input,
  );
  return data.data;
};

export const updateSystemSection = async (
  questionnaireId: string,
  sectionId: string,
  patch: Partial<SectionInput>,
) => {
  const { data } = await API.patch<{ data: SystemSection }>(
    `/questionnaires/system/${questionnaireId}/sections/${sectionId}`,
    patch,
  );
  return data.data;
};

/**
 * Removes a section from every firm's questionnaire, with its questions and
 * the answers already given to them.
 *
 * The most consequential call in this file, which is why the dialog behind it
 * says so. A section that has been asked for real is somebody's record — reword
 * it rather than delete it.
 */
export const deleteSystemSection = async (
  questionnaireId: string,
  sectionId: string,
) => {
  await API.delete(
    `/questionnaires/system/${questionnaireId}/sections/${sectionId}`,
  );
};

export interface QuestionInput {
  label: string;
  description?: string | null;
  /**
   * The shared vocabulary name.
   *
   * Giving a question the key a form field already uses is the whole of the
   * wiring — the answer prints on the form because both name the same datum,
   * with no mapping row in between.
   */
  fieldKey?: string | null;
  type: string;
  isRequired?: boolean;
  config?: { options?: string[] };
  orderIndex?: number;
}

export const addSystemQuestion = async (
  questionnaireId: string,
  sectionId: string,
  input: QuestionInput,
) => {
  const { data } = await API.post<{ data: SystemQuestion }>(
    `/questionnaires/system/${questionnaireId}/sections/${sectionId}/questions`,
    input,
  );
  return data.data;
};

export const updateSystemQuestion = async (
  questionnaireId: string,
  sectionId: string,
  questionId: string,
  patch: Partial<QuestionInput>,
) => {
  const { data } = await API.patch<{ data: SystemQuestion }>(
    `/questionnaires/system/${questionnaireId}/sections/${sectionId}/questions/${questionId}`,
    patch,
  );
  return data.data;
};

export const deleteSystemQuestion = async (
  questionnaireId: string,
  sectionId: string,
  questionId: string,
) => {
  await API.delete(
    `/questionnaires/system/${questionnaireId}/sections/${sectionId}/questions/${questionId}`,
  );
};

// ─── Editions, and the blank each one is filed on ───────────────────────────

/**
 * One USCIS edition of a form, and whether its blank has been uploaded.
 *
 * `hasBlank` rather than the object key: the key is an implementation detail of
 * storage and there is nothing this app can do with it — the bytes are served
 * by the API, not fetched from the bucket. What the screen needs to know is
 * whether this edition can be filled and printed at all.
 */
export type FormEdition = {
  id: string;
  formCode: string;
  /** The date printed at the foot of every page. */
  editionDate: string;
  acceptedFrom: string;
  /** Null means no end date is set, which is not the same as "in force". */
  acceptedUntil: string | null;
  sourceUrl: string | null;
  verifiedOn: string | null;
  hasBlank: boolean;
  blankChecksum: string | null;
  blankBytes: number | null;
  blankUploadedAt: string | null;
  /** When the PDF was read. Happens on upload, and changes nothing visible. */
  extractedAt: string | null;
  /**
   * When this PDF's fields were last written into the form. Null means the PDF
   * is stored and its fields were never saved — the half-finished state.
   *
   * Two timestamps rather than one flag, because a *replaced* PDF is a third
   * state: saved once, uploaded again, not re-read. A `blankUploadedAt` later
   * than this is that state, and a boolean computed on the server would call
   * it done.
   */
  importedAt: string | null;
};

/**
 * What importing an edition's blank would do to the catalogue.
 *
 * This is the review the committed extraction used to get from a pull request
 * diff. The rows behind it decide what prints on a statutory form for every
 * firm in the deployment, so the upload describes the change and a separate
 * confirm applies it.
 */
export type ImportPlan = {
  formCode: string;
  editionDate: string;
  added: string[];
  /** Catalogue fields this blank has no box for. Reported, never deleted. */
  removed: string[];
  changed: { fieldKey: string; was: string; now: string }[];
  /**
   * Boxes whose datum was inherited from the previous edition, because the box
   * kept its name and somebody had already said what it holds.
   */
  carriedForward: { pdfFieldName: string; fieldKey: string }[];
  /** Boxes an existing mapping speaks for, which the import leaves alone. */
  deferredToMapping: string[];
  boxes: number;
  fields: number;
};

export const getFormEditions = async (formCode: string) => {
  const { data } = await API.get<{ data: { editions: FormEdition[] } }>(
    `/platform/forms/${formCode}/editions`,
  );
  return data.data.editions;
};

export type EditionInput = {
  editionDate: string;
  acceptedFrom: string;
  acceptedUntil?: string | null;
  sourceUrl?: string | null;
  verifiedOn?: string | null;
};

export const addFormEdition = async (
  formCode: string,
  input: EditionInput,
) => {
  const { data } = await API.post<{ data: FormEdition }>(
    `/platform/forms/${formCode}/editions`,
    input,
  );
  return data.data;
};

export const updateFormEdition = async (
  formCode: string,
  editionId: string,
  patch: Partial<Omit<EditionInput, "editionDate">>,
) => {
  const { data } = await API.patch<{ data: FormEdition }>(
    `/platform/forms/${formCode}/editions/${editionId}`,
    patch,
  );
  return data.data;
};

/**
 * Upload an edition's official blank.
 *
 * Multipart, because the file is the payload. Nothing about the catalogue
 * changes: the response carries the *plan* an import would follow, and
 * `importFormCatalogue` is what acts on it.
 *
 * `unchanged` comes back when the file is byte-for-byte the one already on the
 * edition. That is worth a distinct state rather than a silent success — an
 * operator who uploaded the wrong file and then the right one needs to be able
 * to tell "it worked" from "nothing happened".
 */
export const uploadFormBlank = async (
  formCode: string,
  editionId: string,
  file: File,
) => {
  const body = new FormData();
  body.append("blank", file);

  const { data } = await API.post<{
    data: {
      unchanged: boolean;
      edition: FormEdition;
      plan: ImportPlan | null;
      boxes: number;
      skipped?: string[];
      noTooltip?: string[];
      parts?: string[];
    };
    message: string;
  }>(`/platform/forms/${formCode}/editions/${editionId}/blank`, body, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return { ...data.data, message: data.message };
};

/** What an import would change. Writes nothing. */
export const previewFormImport = async (
  formCode: string,
  editionId: string,
) => {
  const { data } = await API.get<{ data: ImportPlan }>(
    `/platform/forms/${formCode}/editions/${editionId}/import`,
  );
  return data.data;
};

/** Write the catalogue from the edition's blank. The confirmed step. */
export const importFormCatalogue = async (
  formCode: string,
  editionId: string,
) => {
  const { data } = await API.post<{
    data: ImportPlan & { unmappedCurated: string[] };
  }>(`/platform/forms/${formCode}/editions/${editionId}/import`);
  return data.data;
};
