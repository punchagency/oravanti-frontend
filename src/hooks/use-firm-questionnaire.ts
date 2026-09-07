import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addFirmQuestion,
  addFirmSection,
  deleteQuestion,
  deleteSection,
  getFirmQuestionnaire,
  updateQuestion,
  updateSection,
} from "@/api/questionnaires";
import type {
  QuestionInput,
  QuestionnaireStage,
  SectionInput,
} from "@/api/questionnaires";
import type { APIError } from "./types";

/**
 * The firm's standing additions to a case type's questionnaire.
 *
 * Separate from `use-case-questionnaire.ts`, which is about one matter. The
 * two read the same tables and mean different things: a write here reaches
 * every matter of the case type, including ones already open.
 */

export const firmQuestionnaireKeys = {
  byCaseType: (caseTypeId: string, stage: QuestionnaireStage) =>
    ["firm-questionnaire", caseTypeId, stage] as const,
};

export function useFirmQuestionnaire(
  caseTypeId: string,
  stage: QuestionnaireStage,
  enabled = true,
) {
  return useQuery({
    queryKey: firmQuestionnaireKeys.byCaseType(caseTypeId, stage),
    queryFn: () => getFirmQuestionnaire(caseTypeId, stage),
    enabled: enabled && Boolean(caseTypeId),
  });
}

/**
 * Every write here changes one questionnaire, so they all invalidate the same
 * key. Named once rather than repeated in six mutations.
 */
function useFirmInvalidation(caseTypeId: string, stage: QuestionnaireStage) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: firmQuestionnaireKeys.byCaseType(caseTypeId, stage),
    });
  };
}

export function useAddFirmQuestion(
  caseTypeId: string,
  stage: QuestionnaireStage,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: QuestionInput) =>
      addFirmQuestion(caseTypeId, { ...data, stage }),
    onSuccess: () => {
      toast.success("Added to every matter of this type");
      queryClient.invalidateQueries({
        queryKey: firmQuestionnaireKeys.byCaseType(caseTypeId, stage),
      });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to add the question");
    },
  });
}

export function useDeleteFirmQuestion(
  caseTypeId: string,
  stage: QuestionnaireStage,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId: string) => deleteQuestion(questionId),
    onSuccess: () => {
      toast.success("Removed from this case type");
      queryClient.invalidateQueries({
        queryKey: firmQuestionnaireKeys.byCaseType(caseTypeId, stage),
      });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to remove the question");
    },
  });
}

export function useAddFirmSection(
  caseTypeId: string,
  stage: QuestionnaireStage,
) {
  const invalidate = useFirmInvalidation(caseTypeId, stage);

  return useMutation({
    mutationFn: (data: SectionInput) =>
      addFirmSection(caseTypeId, { ...data, stage }),
    onSuccess: () => {
      toast.success("Section added to every matter of this type");
      invalidate();
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to add the section");
    },
  });
}

export function useUpdateFirmSection(
  caseTypeId: string,
  stage: QuestionnaireStage,
) {
  const invalidate = useFirmInvalidation(caseTypeId, stage);

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

export function useUpdateFirmQuestion(
  caseTypeId: string,
  stage: QuestionnaireStage,
) {
  const invalidate = useFirmInvalidation(caseTypeId, stage);

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

export function useDeleteFirmSection(
  caseTypeId: string,
  stage: QuestionnaireStage,
) {
  const invalidate = useFirmInvalidation(caseTypeId, stage);

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
