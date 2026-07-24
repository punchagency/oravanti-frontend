import {
  acceptResponse,
  getCaseTypeQuestionnairePreview,
  getEligibleLeads,
  getFirmName,
  getLeadQuestionnaire,
  getQuestionBank,
  getResponseDetail,
  requestMissingDocuments,
  sendQuestionnaire,
  sendReminder,
  uploadResponseFileByStaff,
  type SendQuestionnaireConfig,
} from "@/api/questionnaires";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { APIError } from "./types";

const FIVE_MIN = 5 * 60 * 1000;

export function useEligibleLeads(enabled = true) {
  return useQuery({
    queryKey: ["questionnaire-eligible-leads"],
    queryFn: getEligibleLeads,
    enabled,
    staleTime: FIVE_MIN,
  });
}

export function useFirmName(enabled = true) {
  return useQuery({
    queryKey: ["firm-name"],
    queryFn: getFirmName,
    enabled,
    retry: false, // 403 for non-admin staff — fall back gracefully
    staleTime: 5 * 60 * 1000,
  });
}

export function useQuestionBank(enabled = true) {
  return useQuery({
    queryKey: ["questionnaire-question-bank"],
    queryFn: getQuestionBank,
    enabled,
    staleTime: FIVE_MIN,
  });
}

export function useCaseTypeQuestionnairePreview(caseTypeId: string | null) {
  return useQuery({
    queryKey: ["questionnaire-preview", caseTypeId],
    queryFn: () => getCaseTypeQuestionnairePreview(caseTypeId as string),
    enabled: Boolean(caseTypeId),
    staleTime: FIVE_MIN,
  });
}

export function useLeadQuestionnaire(leadId: string) {
  return useQuery({
    queryKey: ["lead-questionnaire", leadId],
    queryFn: () => getLeadQuestionnaire(leadId),
    enabled: Boolean(leadId),
    staleTime: FIVE_MIN,
  });
}

export function useResponseDetail(responseId: string | null) {
  return useQuery({
    queryKey: ["questionnaire-response", responseId],
    queryFn: () => getResponseDetail(responseId as string),
    enabled: Boolean(responseId),
    staleTime: FIVE_MIN,
  });
}

export function useSendQuestionnaireConfigured() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      leadId,
      config,
    }: {
      leadId: string;
      config: SendQuestionnaireConfig;
    }) => sendQuestionnaire(leadId, config),
    onSuccess: (_data, variables) => {
      toast.success("Questionnaire sent to lead");
      qc.invalidateQueries({ queryKey: ["lead"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["leadsStageCount"] });
      qc.invalidateQueries({ queryKey: ["questionnaire-eligible-leads"] });
      qc.invalidateQueries({ queryKey: ["lead-questionnaire", variables.leadId] });
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Failed to send questionnaire",
      );
    },
  });
}

export function useAcceptResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (responseId: string) => acceptResponse(responseId),
    onSuccess: () => {
      toast.success("Lead advanced to consultation");
      qc.invalidateQueries({ queryKey: ["lead"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["leadsStageCount"] });
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ??
          "Some required answers or documents are still missing",
      );
    },
  });
}

export function useSendReminder() {
  return useMutation({
    mutationFn: (sendId: string) => sendReminder(sendId),
    onSuccess: () => toast.success("Reminder sent to lead"),
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to send reminder");
    },
  });
}

export function useUploadResponseFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      responseId,
      questionId,
      file,
    }: {
      responseId: string;
      questionId: string;
      file: File;
    }) => uploadResponseFileByStaff(responseId, questionId, file),
    onSuccess: (_, { responseId }) => {
      toast.success("Document uploaded");
      qc.invalidateQueries({ queryKey: ["questionnaire-response", responseId] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead"] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to upload document");
    },
  });
}

export function useRequestMissingDocuments() {
  return useMutation({
    mutationFn: (sendId: string) => requestMissingDocuments(sendId),
    onSuccess: (data) => {
      if (data.missing.length === 0) {
        toast.success("All requested documents have been received");
      } else {
        toast.success(
          `Requested ${data.missing.length} missing document${
            data.missing.length === 1 ? "" : "s"
          } from the lead`,
        );
      }
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Failed to request missing documents",
      );
    },
  });
}
