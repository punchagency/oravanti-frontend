import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getCaseFilingFees,
  addCaseForm,
  getCaseFieldFeeds,
  getPublishedForms,
  getFieldHistory,
  getFormVersion,
  getFormVersions,
  restoreFieldRevision,
  restoreFormVersion,
  getCaseFormBoxes,
  getCaseFormFields,
  getCaseForms,
  getCaseMilestones,
  getCasePitfalls,
  getImmigrationDetails,
  getPersonalInjuryDetails,
  initializeCaseForms,
  recordCaseMilestone,
  removeCaseForm,
  getCaseFilingPackagePdf,
  populateCaseForms,
  saveImmigrationDetails,
  savePersonalInjuryDetails,
  setCaseFormField,
  setCaseFormFields,
  updateCaseForm,
  approveFilingReview,
  commentOnCorrection,
  getFilingReview,
  raiseCorrection,
  reopenCorrection,
  requestFilingReview,
  resolveCorrection,
} from "../api/case-details";
import type {
  CaseFormPatch,
  CaseFormRole,
  ImmigrationCaseDetailsInput,
  PersonalInjuryCaseDetailsInput,
  PopulateOptions,
  PopulateResult,
  RaiseCorrectionInput,
  RecordMilestoneInput,
} from "../api/case-details";
import { taskKeys } from "./use-tasks";
import { caseKeys } from "./use-cases";
import type { APIError } from "./types";

/**
 * The two practice-area detail panels.
 *
 * Saving one is not a plain field write — the backend may create tasks (a
 * condition field newly true), move existing due dates (an anchor date
 * recorded), or schedule the RFE reminders. So every save invalidates the
 * case's tasks as well as the panel itself, or the tab beside it goes stale
 * without anyone touching it.
 */

export const caseDetailKeys = {
  immigration: (caseId: string) =>
    ["case-details", "immigration", caseId] as const,
  personalInjury: (caseId: string) =>
    ["case-details", "personal-injury", caseId] as const,
  milestones: (caseId: string) =>
    ["case-details", "milestones", caseId] as const,
  pitfalls: (caseId: string) => ["case-details", "pitfalls", caseId] as const,
  filingFees: (caseId: string) =>
    ["case-details", "filing-fees", caseId] as const,
  forms: (caseId: string) => ["case-details", "forms", caseId] as const,
  /** Which question fills which field, across the whole package. */
  fieldMap: (caseId: string) => ["case-details", "field-map", caseId] as const,
  /** Not keyed by case: the catalogue is the same list for every matter. */
  publishedForms: () => ["case-details", "published-forms"] as const,
  /** The same, for one form. Nested so invalidating the package covers it. */
  formFieldMap: (caseId: string, formCode: string) =>
    ["case-details", "field-map", caseId, formCode] as const,
  /**
   * The boxes on a form's official blank. Keyed by form code alone, not by
   * matter — the blank is the same government document for every firm, so the
   * matter in the URL is only there to authorise the read.
   */
  formPdfBoxes: (formCode: string) => ["form-pdf", "boxes", formCode] as const,
  /**
   * One matter's copy of a form, filled. Nested under `forms` so populating
   * or saving values invalidates the rendered document with them.
   */
  formPdf: (caseId: string, formCode: string) =>
    ["case-details", "forms", caseId, formCode, "pdf"] as const,
  /** One form's contents. Nested under `forms` so populating invalidates every form at once. */
  formFields: (caseId: string, formCode: string) =>
    ["case-details", "forms", caseId, formCode, "fields"] as const,
  /** One form's saves, newest first. Nested for the same reason. */
  formVersions: (caseId: string, formCode: string) =>
    ["case-details", "forms", caseId, formCode, "versions"] as const,
  formVersion: (caseId: string, formCode: string, versionId: string) =>
    ["case-details", "forms", caseId, formCode, "versions", versionId] as const,
  /** One field's timeline. */
  fieldHistory: (caseId: string, formCode: string, fieldKey: string) =>
    ["case-details", "forms", caseId, formCode, "history", fieldKey] as const,
  /**
   * The attorney's review of the package: its state and every mark on it.
   *
   * Its own key rather than nested under `forms`, because a mark changes no
   * form's contents — refetching six forms because somebody wrote a note would
   * redraw the editor under whoever is typing in it.
   */
  filingReview: (caseId: string) =>
    ["case-details", "filing-review", caseId] as const,
};

function useDetailsInvalidation(caseId: string, key: readonly unknown[]) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: key });
    queryClient.invalidateQueries({ queryKey: taskKeys.all });
    queryClient.invalidateQueries({ queryKey: caseKeys.detail(caseId) });
    queryClient.invalidateQueries({ queryKey: caseKeys.all });
  };
}

export function useImmigrationDetails(caseId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: caseDetailKeys.immigration(caseId),
    queryFn: () => getImmigrationDetails(caseId),
    enabled: Boolean(caseId) && enabled,
  });
}

export function useSaveImmigrationDetails(caseId: string) {
  const invalidate = useDetailsInvalidation(
    caseId,
    caseDetailKeys.immigration(caseId),
  );

  return useMutation({
    mutationFn: (input: ImmigrationCaseDetailsInput) =>
      saveImmigrationDetails(caseId, input),
    onSuccess: () => {
      toast.success("Immigration details saved");
      invalidate();
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Failed to save immigration details",
      );
    },
  });
}

export function usePersonalInjuryDetails(
  caseId: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: caseDetailKeys.personalInjury(caseId),
    queryFn: () => getPersonalInjuryDetails(caseId),
    enabled: Boolean(caseId) && enabled,
  });
}

export function useSavePersonalInjuryDetails(caseId: string) {
  const invalidate = useDetailsInvalidation(
    caseId,
    caseDetailKeys.personalInjury(caseId),
  );

  return useMutation({
    mutationFn: (input: PersonalInjuryCaseDetailsInput) =>
      savePersonalInjuryDetails(caseId, input),
    onSuccess: () => {
      toast.success("Personal injury details saved");
      invalidate();
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Failed to save personal injury details",
      );
    },
  });
}

// ── Milestones, validation and fees ────────────────────────────────────────

/**
 * Recording a milestone reaches further than any panel save: it writes the
 * milestone row, the projection, a calendar event and an audit entry, then
 * re-resolves every task anchored on that date. So it invalidates the workflow
 * and the pitfalls too — several rules and most of the second half of an AOS
 * board read what it just wrote.
 */
export function useCaseMilestones(caseId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: caseDetailKeys.milestones(caseId),
    queryFn: () => getCaseMilestones(caseId),
    enabled: Boolean(caseId) && enabled,
  });
}

export function useRecordCaseMilestone(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RecordMilestoneInput) =>
      recordCaseMilestone(caseId, input),
    onSuccess: () => {
      toast.success("Milestone recorded");
      queryClient.invalidateQueries({
        queryKey: caseDetailKeys.milestones(caseId),
      });
      queryClient.invalidateQueries({
        queryKey: caseDetailKeys.immigration(caseId),
      });
      queryClient.invalidateQueries({
        queryKey: caseDetailKeys.pitfalls(caseId),
      });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(caseId) });
      queryClient.invalidateQueries({ queryKey: caseKeys.all });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to record milestone");
    },
  });
}

/**
 * The § 1.5 checks. Computed on the server on every read rather than stored,
 * because every rule reads fields that change.
 */
export function useCasePitfalls(caseId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: caseDetailKeys.pitfalls(caseId),
    queryFn: () => getCasePitfalls(caseId),
    enabled: Boolean(caseId) && enabled,
  });
}

export function useCaseFilingFees(caseId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: caseDetailKeys.filingFees(caseId),
    queryFn: () => getCaseFilingFees(caseId),
    enabled: Boolean(caseId) && enabled,
  });
}

// ── The filing package ──────────────────────────────────────────────────────

/**
 * The matter's forms, with the progress rollup the server computed.
 *
 * One query rather than a list plus a derived count, so "how far along is the
 * package?" has a single answer that every caller agrees on.
 */
export function useCaseForms(caseId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: caseDetailKeys.forms(caseId),
    queryFn: () => getCaseForms(caseId),
    enabled: Boolean(caseId) && enabled,
  });
}

export function useInitializeCaseForms(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (forms?: { formCode: string; role: CaseFormRole }[]) =>
      initializeCaseForms(caseId, forms),
    onSuccess: (result) => {
      toast.success(
        result.created > 0
          ? `${result.created} form${result.created === 1 ? "" : "s"} added`
          : "Every form is already on this matter",
      );
      queryClient.invalidateQueries({ queryKey: caseDetailKeys.forms(caseId) });
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Failed to set up the filing package",
      );
    },
  });
}

/**
 * Updating a form can move its status without being asked to — recording a
 * receipt number implies the form was receipted — so the response replaces the
 * cache rather than the caller assuming its own patch landed verbatim.
 *
 * The pre-filing checks read form editions, so they are invalidated too.
 */
export function useUpdateCaseForm(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      formCode,
      patch,
    }: {
      formCode: string;
      patch: CaseFormPatch;
    }) => updateCaseForm(caseId, formCode, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseDetailKeys.forms(caseId) });
      queryClient.invalidateQueries({
        queryKey: caseDetailKeys.pitfalls(caseId),
      });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to update the form");
    },
  });
}

export function useRemoveCaseForm(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formCode: string) => removeCaseForm(caseId, formCode),
    onSuccess: () => {
      // Takes the form off this matter and nothing else. The catalogue entry
      // stays — it is Oravanti's, and other firms are still filing it.
      toast.success("Form removed");
      queryClient.invalidateQueries({ queryKey: caseDetailKeys.forms(caseId) });
      queryClient.invalidateQueries({
        queryKey: caseDetailKeys.fieldMap(caseId),
      });
    },
    onError: (err: APIError) => {
      // The refusal to delete a filed form carries the reason and what to do
      // instead, so it is worth showing rather than replacing with a generic.
      toast.error(err.response?.data?.message ?? "Failed to remove the form");
    },
  });
}

// ── Form contents ───────────────────────────────────────────────────────────

/**
 * Where each of the form's data prints, so marks can be drawn on the page.
 *
 * `staleTime: Infinity` because this describes the *blank*, which changes only
 * when USCIS publishes a new edition — nothing a reader does to the matter can
 * move a box. Keyed by form code alone for the same reason, so opening the same
 * form on a second matter is free.
 */
export function useCaseFormBoxes(
  caseId: string,
  formCode: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: caseDetailKeys.formPdfBoxes(formCode),
    queryFn: () => getCaseFormBoxes(caseId, formCode),
    enabled: Boolean(caseId && formCode) && enabled,
    staleTime: Infinity,
    // A form with no blank on file has no boxes, which is a normal state and
    // not worth three attempts to be told about.
    retry: false,
  });
}

/** One form's fields, with each value's provenance. */
export function useCaseFormFields(
  caseId: string,
  formCode: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: caseDetailKeys.formFields(caseId, formCode),
    queryFn: () => getCaseFormFields(caseId, formCode),
    enabled: Boolean(caseId && formCode) && enabled,
  });
}

/**
 * A hand-typed correction.
 *
 * Invalidates rather than writing through, because saving a field changes more
 * than the field: it becomes a manual override, and the form's completion
 * counts move with it.
 */
export function useSetCaseFormField(caseId: string, formCode: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fieldKey, value }: { fieldKey: string; value: unknown }) =>
      setCaseFormField(caseId, formCode, fieldKey, value),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: caseDetailKeys.formFields(caseId, formCode),
      });
      queryClient.invalidateQueries({ queryKey: caseDetailKeys.forms(caseId) });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to save the field");
    },
  });
}

/**
 * Save a form's corrections as one action.
 *
 * The Forms tab saves on an explicit press, a whole form at a time, matching
 * the questionnaire tab. Field-by-field saving on blur made every keystroke a
 * request and gave a person no moment at which they had decided — which is the
 * wrong shape for a document somebody is about to file.
 */
export function useSetCaseFormFields(caseId: string, formCode: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fields: { fieldKey: string; value: unknown }[]) =>
      setCaseFormFields(caseId, formCode, fields),
    onSuccess: (result) => {
      toast.success(
        result.changed === 0
          ? "No changes to save"
          : `${result.changed} field${result.changed === 1 ? "" : "s"} saved on ${formCode}`,
      );
      queryClient.invalidateQueries({
        queryKey: caseDetailKeys.formFields(caseId, formCode),
      });
      queryClient.invalidateQueries({
        queryKey: caseDetailKeys.formVersions(caseId, formCode),
      });
      queryClient.invalidateQueries({ queryKey: caseDetailKeys.forms(caseId) });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to save the form");
    },
  });
}

// ── The form catalogue, as a firm sees it ───────────────────────────────────
//
// Read-only. What a form is and what fields it has is Oravanti's, so the six
// hooks that used to write it are gone with the copy-on-write tier they served.
// What a firm still decides is which forms this matter files — a decision about
// the matter, not about the form.

/** Every form Oravanti publishes, for the "add a form" picker. */
export function usePublishedForms(enabled = true) {
  return useQuery({
    queryKey: caseDetailKeys.publishedForms(),
    queryFn: getPublishedForms,
    enabled,
    // The catalogue changes when Oravanti changes it, which is not during
    // somebody's session on a matter.
    staleTime: Infinity,
  });
}

/**
 * Put a published form on this matter.
 *
 * Invalidates the package and the field map together: the new form arrives with
 * its own fields, and the rail's completion count moves with it.
 */
export function useAddCaseForm(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { formCode: string; role?: CaseFormRole }) =>
      addCaseForm(caseId, input.formCode, input.role),
    onSuccess: (form) => {
      toast.success(`${form.formCode} added to this matter`);
      queryClient.invalidateQueries({ queryKey: caseDetailKeys.forms(caseId) });
      queryClient.invalidateQueries({
        queryKey: caseDetailKeys.fieldMap(caseId),
      });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to add the form");
    },
  });
}

// ── Form history ────────────────────────────────────────────────────────────

/** One form's saves, newest first. */
export function useFormVersions(
  caseId: string,
  formCode: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: caseDetailKeys.formVersions(caseId, formCode),
    queryFn: () => getFormVersions(caseId, formCode),
    enabled: Boolean(caseId && formCode) && enabled,
  });
}

/** One save and the fields it changed. Immutable once written, so it never refetches. */
export function useFormVersion(
  caseId: string,
  formCode: string,
  versionId: string | null,
) {
  return useQuery({
    queryKey: caseDetailKeys.formVersion(caseId, formCode, versionId ?? ""),
    queryFn: () => getFormVersion(caseId, formCode, versionId as string),
    enabled: Boolean(caseId && formCode && versionId),
    staleTime: Infinity,
  });
}

/** One field's timeline. */
export function useFieldHistory(
  caseId: string,
  formCode: string,
  fieldKey: string | null,
) {
  return useQuery({
    queryKey: caseDetailKeys.fieldHistory(caseId, formCode, fieldKey ?? ""),
    queryFn: () => getFieldHistory(caseId, formCode, fieldKey as string),
    enabled: Boolean(caseId && formCode && fieldKey),
  });
}

/**
 * The two restores, which differ only in what they name.
 *
 * Both write a *new* version rather than rewinding to an old one, so both
 * invalidate the same three things — and the shared factory is what stops the
 * two drifting on which.
 */
function useFormRestore<TArgs>(
  caseId: string,
  formCode: string,
  restore: (args: TArgs) => Promise<{ changed: number }>,
  describe: (result: { changed: number }) => string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restore,
    onSuccess: (result) => {
      toast.success(describe(result));
      queryClient.invalidateQueries({
        queryKey: caseDetailKeys.formFields(caseId, formCode),
      });
      queryClient.invalidateQueries({
        queryKey: caseDetailKeys.formVersions(caseId, formCode),
      });
      queryClient.invalidateQueries({ queryKey: caseDetailKeys.forms(caseId) });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to restore");
    },
  });
}

export function useRestoreFormVersion(caseId: string, formCode: string) {
  return useFormRestore(
    caseId,
    formCode,
    (versionId: string) => restoreFormVersion(caseId, formCode, versionId),
    (result) =>
      result.changed === 0
        ? "That version matches the form as it stands"
        : `Restored — ${result.changed} field${result.changed === 1 ? "" : "s"} changed`,
  );
}

export function useRestoreFieldRevision(caseId: string, formCode: string) {
  return useFormRestore(
    caseId,
    formCode,
    (revisionId: string) => restoreFieldRevision(caseId, revisionId),
    (result) =>
      result.changed === 0 ? "That value is already there" : "Field restored",
  );
}

/**
 * Re-fill every form from the case questionnaire.
 *
 * The toast reports conflicts separately from fills, because "nothing changed
 * because you had already corrected those by hand" is a different outcome from
 * "nothing changed because there is nothing to carry over", and a paralegal
 * needs to tell them apart.
 */
export function usePopulateCaseForms(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: PopulateOptions = {}) =>
      populateCaseForms(caseId, options),
    onSuccess: (result) => {
      toast.success(populateMessage(result));
      queryClient.invalidateQueries({ queryKey: caseDetailKeys.forms(caseId) });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to fill the forms");
    },
  });
}

/**
 * Download every form on the matter as one merged PDF, in package order.
 *
 * A mutation rather than a query because it is an act with a result the person
 * is waiting on, not state the screen shows — and because nothing should fetch
 * a six-form render on mount.
 *
 * The toast is the point of the call as much as the file is. A package rendered
 * without its I-864 opens and prints and looks entirely finished, so a form
 * that failed has to be said out loud, by name.
 */
export function useCaseFilingPackagePdf(caseId: string) {
  return useMutation({
    mutationFn: () => getCaseFilingPackagePdf(caseId),
    onSuccess: (result) => {
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `filing-package-${caseId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      if (result.failed.length > 0) {
        toast.warning(
          `Package downloaded without ${result.failed.length} form${
            result.failed.length === 1 ? "" : "s"
          }: ${result.failed.join("; ")}`,
        );
      } else if (result.unplaced.length > 0) {
        // The continuation sheets filled up too. These need a typed plain-paper
        // sheet, and naming them is the difference between doing that and not
        // knowing it was needed.
        toast.warning(
          `Package downloaded. These answers did not fit and need a plain continuation sheet: ${result.unplaced.join(
            ", ",
          )}`,
        );
      } else if (result.provided.length > 0) {
        // Not a failure — paper the firm never prints. Saying so at the moment
        // the package is downloaded is the only place it lands in front of the
        // person about to put it in an envelope.
        toast.success(
          `Package downloaded — ${result.included.length} form${
            result.included.length === 1 ? "" : "s"
          } in filing order. Add ${result.provided.join(
            ", ",
          )} by hand: it is completed outside the firm.`,
        );
      } else {
        toast.success(
          `Package downloaded — ${result.included.length} form${
            result.included.length === 1 ? "" : "s"
          } in filing order`,
        );
      }
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not build the filing package"),
  });
}

/**
 * What the run did, in one sentence.
 *
 * Fills, updates, replaced edits and left-alone edits are four different
 * outcomes and the sentence keeps them apart: "nothing changed because you had
 * already corrected those by hand" is not the same news as "nothing changed
 * because there is nothing to carry over".
 */
function populateMessage(result: PopulateResult) {
  if (result.skipped === "no answers") {
    return "The case questionnaire has not been answered yet";
  }
  if (result.skipped === "no forms") return "This matter has no forms to fill";

  const left = result.conflicts.length - result.overridden;
  const heldBack =
    left > 0
      ? ` ${left} hand-edited field${left === 1 ? "" : "s"} left unchanged.`
      : "";

  if (result.filled === 0 && result.updated === 0 && result.overridden === 0) {
    return left > 0
      ? `Every field is already filled —${heldBack}`
      : "Every field is already up to date";
  }

  const parts = [
    result.filled > 0 ? `${result.filled} filled` : null,
    result.updated > 0 ? `${result.updated} updated` : null,
    result.overridden > 0
      ? `${result.overridden} edit${result.overridden === 1 ? "" : "s"} replaced`
      : null,
  ].filter(Boolean);

  return `Forms filled from the questionnaire: ${parts.join(", ")}.${heldBack}`;
}

/**
 * What a run *would* do, without doing it.
 *
 * The confirmation dialog reads this so its numbers come from the pass that is
 * about to run rather than a second estimate of it. Not cached: the answer
 * changes the moment anybody edits a field or an answer, and a stale preview
 * would be worse than no preview at all.
 */
export function usePopulatePreview(caseId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...caseDetailKeys.forms(caseId), "populate-preview"],
    queryFn: () => populateCaseForms(caseId, { dryRun: true }),
    enabled: enabled && Boolean(caseId),
    gcTime: 0,
    staleTime: 0,
  });
}

/**
 * Which question fills which field, across this matter's forms.
 *
 * Read-only, and the last of what was once a seven-hook wiring surface. One
 * mapping row decides the answer for every firm in the deployment, so the
 * writes moved to Oravanti's CRM under `requirePlatformAdmin`; `PUT
 * /cases/:caseId/forms/:formCode/pdf-mappings` in particular was reachable with
 * `cases:update` and rewrote which box a datum prints into everywhere.
 *
 * What is left is the read the Questionnaire tab needs to say "this answer
 * fills I-485 · Date of Birth", which reveals nothing across tenants: the
 * catalogue is the same document for everybody.
 */
export function useCaseFieldFeeds(caseId: string, enabled = true) {
  return useQuery({
    queryKey: caseDetailKeys.fieldMap(caseId),
    queryFn: () => getCaseFieldFeeds(caseId),
    enabled: enabled && Boolean(caseId),
    staleTime: Infinity,
  });
}

// ─── The attorney's review of the filing package ────────────────────────────

/**
 * The review's state and every mark on the package.
 *
 * `staleTime: 0` — unlike the catalogue reads above, this is the one thing on
 * the tab two people change at once: an attorney marking while a paralegal
 * fixes. A stale review shows a correction that was answered ten minutes ago.
 */
export function useFilingReview(caseId: string, enabled = true) {
  return useQuery({
    queryKey: caseDetailKeys.filingReview(caseId),
    queryFn: () => getFilingReview(caseId),
    enabled: enabled && Boolean(caseId),
    staleTime: 0,
  });
}

/**
 * Every write on the review, sharing one invalidation and one error path.
 *
 * The forms list is invalidated alongside the review because approving unlocks
 * `ready_to_file` on each of them — the status select's options do not change,
 * but whether choosing one succeeds does, and the tab reads that from the
 * review it just refetched.
 */
function useReviewMutation<TArgs>(
  caseId: string,
  run: (args: TArgs) => Promise<unknown>,
  success: (args: TArgs) => string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: run,
    onSuccess: (_data, args) => {
      queryClient.invalidateQueries({
        queryKey: caseDetailKeys.filingReview(caseId),
      });
      queryClient.invalidateQueries({
        queryKey: caseDetailKeys.forms(caseId),
      });
      toast.success(success(args));
    },
    // The server's sentence, always: "3 corrections are still open on this
    // filing" is the whole answer, and a generic failure toast would send
    // somebody to look for a reason that was already written.
    onError: (error: APIError) =>
      toast.error(error.response?.data?.message ?? "That could not be saved"),
  });
}

export function useRequestFilingReview(caseId: string) {
  return useReviewMutation(
    caseId,
    () => requestFilingReview(caseId),
    () => "Sent to the reviewing attorney",
  );
}

export function useApproveFilingReview(caseId: string) {
  return useReviewMutation(
    caseId,
    () => approveFilingReview(caseId),
    () => "Filing package approved",
  );
}

export function useRaiseCorrection(caseId: string) {
  return useReviewMutation(
    caseId,
    (input: RaiseCorrectionInput) => raiseCorrection(caseId, input),
    () => "Marked for correction",
  );
}

export function useResolveCorrection(caseId: string) {
  return useReviewMutation(
    caseId,
    ({ correctionId, note }: { correctionId: string; note: string }) =>
      resolveCorrection(caseId, correctionId, note),
    () => "Correction resolved",
  );
}

export function useReopenCorrection(caseId: string) {
  return useReviewMutation(
    caseId,
    ({ correctionId, note }: { correctionId: string; note: string }) =>
      reopenCorrection(caseId, correctionId, note),
    () => "Correction reopened",
  );
}

export function useCommentOnCorrection(caseId: string) {
  return useReviewMutation(
    caseId,
    ({ correctionId, body }: { correctionId: string; body: string }) =>
      commentOnCorrection(caseId, correctionId, body),
    () => "Comment added",
  );
}
