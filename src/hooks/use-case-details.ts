import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getCaseFilingFees,
  getCaseForms,
  getCaseMilestones,
  getCasePitfalls,
  getImmigrationDetails,
  getPersonalInjuryDetails,
  initializeCaseForms,
  recordCaseMilestone,
  removeCaseForm,
  saveImmigrationDetails,
  savePersonalInjuryDetails,
  updateCaseForm,
} from "../api/case-details";
import type {
  CaseFormPatch,
  CaseFormRole,
  ImmigrationCaseDetailsInput,
  PersonalInjuryCaseDetailsInput,
  RecordMilestoneInput,
} from "../api/case-details";
import { taskKeys } from "./use-tasks";
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
  immigration: (caseId: string) => ["case-details", "immigration", caseId] as const,
  personalInjury: (caseId: string) => ["case-details", "personal-injury", caseId] as const,
  milestones: (caseId: string) => ["case-details", "milestones", caseId] as const,
  pitfalls: (caseId: string) => ["case-details", "pitfalls", caseId] as const,
  filingFees: (caseId: string) => ["case-details", "filing-fees", caseId] as const,
  forms: (caseId: string) => ["case-details", "forms", caseId] as const,
};

function useDetailsInvalidation(caseId: string, key: readonly unknown[]) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: key });
    queryClient.invalidateQueries({ queryKey: taskKeys.all });
    queryClient.invalidateQueries({ queryKey: ["cases", caseId] });
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
  const invalidate = useDetailsInvalidation(caseId, caseDetailKeys.immigration(caseId));

  return useMutation({
    mutationFn: (input: ImmigrationCaseDetailsInput) => saveImmigrationDetails(caseId, input),
    onSuccess: () => {
      toast.success("Immigration details saved");
      invalidate();
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to save immigration details");
    },
  });
}

export function usePersonalInjuryDetails(caseId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: caseDetailKeys.personalInjury(caseId),
    queryFn: () => getPersonalInjuryDetails(caseId),
    enabled: Boolean(caseId) && enabled,
  });
}

export function useSavePersonalInjuryDetails(caseId: string) {
  const invalidate = useDetailsInvalidation(caseId, caseDetailKeys.personalInjury(caseId));

  return useMutation({
    mutationFn: (input: PersonalInjuryCaseDetailsInput) =>
      savePersonalInjuryDetails(caseId, input),
    onSuccess: () => {
      toast.success("Personal injury details saved");
      invalidate();
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to save personal injury details");
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
    mutationFn: (input: RecordMilestoneInput) => recordCaseMilestone(caseId, input),
    onSuccess: () => {
      toast.success("Milestone recorded");
      queryClient.invalidateQueries({ queryKey: caseDetailKeys.milestones(caseId) });
      queryClient.invalidateQueries({ queryKey: caseDetailKeys.immigration(caseId) });
      queryClient.invalidateQueries({ queryKey: caseDetailKeys.pitfalls(caseId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: ["cases", caseId] });
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
      toast.error(err.response?.data?.message ?? "Failed to set up the filing package");
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
    mutationFn: ({ formCode, patch }: { formCode: string; patch: CaseFormPatch }) =>
      updateCaseForm(caseId, formCode, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseDetailKeys.forms(caseId) });
      queryClient.invalidateQueries({ queryKey: caseDetailKeys.pitfalls(caseId) });
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
      toast.success("Form removed");
      queryClient.invalidateQueries({ queryKey: caseDetailKeys.forms(caseId) });
    },
    onError: (err: APIError) => {
      // The refusal to delete a filed form carries the reason and what to do
      // instead, so it is worth showing rather than replacing with a generic.
      toast.error(err.response?.data?.message ?? "Failed to remove the form");
    },
  });
}
