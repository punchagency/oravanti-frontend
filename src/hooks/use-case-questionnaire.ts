import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addCaseQuestion,
  addCaseSection,
  deleteQuestion,
  deleteSection,
  getAnswerHistory,
  getCaseQuestionnaire,
  getCaseResponse,
  getCaseVersion,
  getCaseVersions,
  getIntakeResponseForCase,
  restoreAnswer,
  restoreVersion,
  saveCaseAnswers,
  sendCaseQuestionnaire,
  updateQuestion,
  updateSection,
} from "@/api/questionnaires";
import type { QuestionInput, SectionInput } from "@/api/questionnaires";
import { caseDetailKeys } from "./use-case-details";
import type { APIError } from "./types";

/**
 * The matter's questionnaire: its questions, its answers, and the intake
 * answers it came from.
 *
 * Kept apart from `use-questionnaires.ts`, which is entirely about sending
 * intake questionnaires to prospects. The two stages share a table and share
 * nothing else — a prospect is being triaged, a client is being filed for —
 * and one file trying to serve both would be a file about `stage`.
 */

export const caseQuestionnaireKeys = {
  questionnaire: (caseId: string) =>
    ["case-questionnaire", "structure", caseId] as const,
  response: (caseId: string) =>
    ["case-questionnaire", "response", caseId] as const,
  intake: (caseId: string) => ["case-questionnaire", "intake", caseId] as const,
  versions: (caseId: string) =>
    ["case-questionnaire", "versions", caseId] as const,
  version: (caseId: string, versionId: string) =>
    ["case-questionnaire", "versions", caseId, versionId] as const,
  answerHistory: (caseId: string, questionId: string) =>
    ["case-questionnaire", "answer-history", caseId, questionId] as const,
};

export function useCaseQuestionnaire(caseId: string, enabled = true) {
  return useQuery({
    queryKey: caseQuestionnaireKeys.questionnaire(caseId),
    queryFn: () => getCaseQuestionnaire(caseId),
    enabled: enabled && Boolean(caseId),
  });
}

export function useCaseResponse(caseId: string, enabled = true) {
  return useQuery({
    queryKey: caseQuestionnaireKeys.response(caseId),
    queryFn: () => getCaseResponse(caseId),
    enabled: enabled && Boolean(caseId),
  });
}

/**
 * The intake answers, read-only.
 *
 * `staleTime: Infinity` because they cannot change: intake closed when the
 * matter opened, and nothing in this app writes to them.
 */
export function useIntakeAnswers(caseId: string, enabled = true) {
  return useQuery({
    queryKey: caseQuestionnaireKeys.intake(caseId),
    queryFn: () => getIntakeResponseForCase(caseId),
    enabled: enabled && Boolean(caseId),
    staleTime: Infinity,
  });
}

/**
 * Save a section's answers.
 *
 * The unit is a section, because that is the unit the tab's Save button works
 * in and the unit a version is worth reading in: "Beneficiary details — 6
 * answers changed" is something a person recognises, where one version per
 * keystroke would bury the same information in three hundred rows.
 *
 * Every save fills the forms behind it, so this invalidates the Forms tab as
 * well as the response — a paralegal working through the questionnaire should
 * find the forms already filled when they get there, not stale. It also
 * invalidates the version list, which the save has just added a row to.
 */
export function useSaveCaseAnswers(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      status?: "draft" | "submitted";
      sectionId?: string | null;
      answers: { questionId: string; value: unknown }[];
    }) => saveCaseAnswers(caseId, data),
    onSuccess: (result, variables) => {
      toast.success(saveMessage(variables.status, result));

      queryClient.invalidateQueries({
        queryKey: caseQuestionnaireKeys.response(caseId),
      });
      queryClient.invalidateQueries({
        queryKey: caseQuestionnaireKeys.versions(caseId),
      });
      if (result.fieldsPopulated > 0) {
        queryClient.invalidateQueries({
          queryKey: caseDetailKeys.forms(caseId),
        });
      }
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to save the answers");
    },
  });
}

/**
 * What a save actually did, in one sentence.
 *
 * Reports the form fields it filled rather than only the answers it stored,
 * because that is the part a person cannot see from where they are standing —
 * the answers are on screen; the forms are a tab away.
 */
function saveMessage(
  status: "draft" | "submitted" | undefined,
  result: { changed: number; fieldsPopulated: number },
) {
  const filled =
    result.fieldsPopulated > 0
      ? ` — ${result.fieldsPopulated} form field${result.fieldsPopulated === 1 ? "" : "s"} filled`
      : "";

  if (status === "submitted") return `Questionnaire marked complete${filled}`;
  if (result.changed === 0) return "No changes to save";
  return `${result.changed} answer${result.changed === 1 ? "" : "s"} saved${filled}`;
}

export function useSendCaseQuestionnaire(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    // Taken from the API function rather than restated, so a new field on the
    // send reaches callers by adding it in one place.
    mutationFn: (data: Parameters<typeof sendCaseQuestionnaire>[1]) =>
      sendCaseQuestionnaire(caseId, data),
    onSuccess: (result) => {
      toast.success(
        `Sent to the client — ${result.sectionsSent} section${result.sectionsSent === 1 ? "" : "s"}`,
      );
      queryClient.invalidateQueries({
        queryKey: caseQuestionnaireKeys.response(caseId),
      });
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Failed to send the questionnaire",
      );
    },
  });
}

// ─── Answer history ─────────────────────────────────────────────────────────

/** Every save made against this matter's questionnaire, newest first. */
export function useCaseVersions(caseId: string, enabled = true) {
  return useQuery({
    queryKey: caseQuestionnaireKeys.versions(caseId),
    queryFn: () => getCaseVersions(caseId),
    enabled: enabled && Boolean(caseId),
  });
}

/** One save, with the before-and-after of everything it changed. */
export function useCaseVersion(caseId: string, versionId: string | null) {
  return useQuery({
    queryKey: caseQuestionnaireKeys.version(caseId, versionId ?? ""),
    queryFn: () => getCaseVersion(caseId, versionId!),
    enabled: Boolean(caseId && versionId),
    // A version is immutable once written — it records what happened, and what
    // happened does not change.
    staleTime: Infinity,
  });
}

/** One answer's timeline, newest first. */
export function useAnswerHistory(caseId: string, questionId: string | null) {
  return useQuery({
    queryKey: caseQuestionnaireKeys.answerHistory(caseId, questionId ?? ""),
    queryFn: () => getAnswerHistory(caseId, questionId!),
    enabled: Boolean(caseId && questionId),
  });
}

/**
 * Both restores, sharing everything but their call and their wording.
 *
 * A restore is a save like any other — it writes a new version rather than
 * erasing the ones after it — so it invalidates exactly what a save does.
 */
function useRestore(
  caseId: string,
  restore: (caseId: string, id: string) => Promise<{
    changed: number;
    fieldsPopulated: number;
  }>,
  describe: (changed: number) => string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restore(caseId, id),
    onSuccess: (result) => {
      toast.success(describe(result.changed));
      queryClient.invalidateQueries({ queryKey: ["case-questionnaire"] });
      if (result.fieldsPopulated > 0) {
        queryClient.invalidateQueries({
          queryKey: caseDetailKeys.forms(caseId),
        });
      }
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to restore");
    },
  });
}

export function useRestoreVersion(caseId: string) {
  return useRestore(caseId, restoreVersion, (changed) =>
    changed === 0
      ? "Already matches that save — nothing changed"
      : `Restored — ${changed} answer${changed === 1 ? "" : "s"} changed`,
  );
}

export function useRestoreAnswer(caseId: string) {
  return useRestore(caseId, restoreAnswer, (changed) =>
    changed === 0 ? "That is already the current answer" : "Answer restored",
  );
}

// ─── Authoring ──────────────────────────────────────────────────────────────
//
// Adding to the matter's questionnaire changes its structure, and a question
// with a `fieldKey` also changes what can fill a form — so both invalidate the
// field map alongside the questionnaire itself.

function useAuthoringInvalidation(caseId: string) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: caseQuestionnaireKeys.questionnaire(caseId),
    });
    queryClient.invalidateQueries({ queryKey: caseDetailKeys.fieldMap(caseId) });
  };
}

export function useAddCaseSection(caseId: string) {
  const invalidate = useAuthoringInvalidation(caseId);

  return useMutation({
    mutationFn: (data: SectionInput) => addCaseSection(caseId, data),
    onSuccess: () => {
      toast.success("Section added to this matter");
      invalidate();
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to add the section");
    },
  });
}

export function useAddCaseQuestion(caseId: string) {
  const invalidate = useAuthoringInvalidation(caseId);

  return useMutation({
    mutationFn: (data: QuestionInput) => addCaseQuestion(caseId, data),
    onSuccess: () => {
      toast.success("Question added to this matter");
      invalidate();
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to add the question");
    },
  });
}

export function useUpdateQuestion(caseId: string) {
  const invalidate = useAuthoringInvalidation(caseId);

  return useMutation({
    mutationFn: ({
      questionId,
      data,
    }: {
      questionId: string;
      data: Partial<Omit<QuestionInput, "sectionId">>;
    }) => updateQuestion(questionId, data),
    onSuccess: () => {
      toast.success("Question updated");
      invalidate();
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to update the question");
    },
  });
}

export function useDeleteQuestion(caseId: string) {
  const invalidate = useAuthoringInvalidation(caseId);

  return useMutation({
    mutationFn: (questionId: string) => deleteQuestion(questionId),
    onSuccess: () => {
      toast.success("Question removed");
      invalidate();
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to remove the question");
    },
  });
}

export function useDeleteCaseSection(caseId: string) {
  const invalidate = useAuthoringInvalidation(caseId);

  return useMutation({
    mutationFn: (sectionId: string) => deleteSection(sectionId),
    onSuccess: () => {
      toast.success("Section removed, along with its questions");
      invalidate();
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to remove the section");
    },
  });
}

export function useUpdateCaseSection(caseId: string) {
  const invalidate = useAuthoringInvalidation(caseId);

  return useMutation({
    mutationFn: ({
      sectionId,
      data,
    }: {
      sectionId: string;
      data: Partial<SectionInput>;
    }) => updateSection(sectionId, data),
    onSuccess: () => {
      toast.success("Section updated");
      invalidate();
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to update the section");
    },
  });
}
