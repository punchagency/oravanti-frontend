import {
  advanceLeadStage,
  initiateConsultation,
  createLead,
  generateFeeAgreement,
  getConsultations,
  getLeadById,
  getLeads,
  getLeadsStageCount,
  markFeeAgreementReceived,
  nudgeClient,
  sendFeeAgreement,
  openCase,
  resolveConflictCheck,
  runConflictCheck,
  sendQuestionnaire,
  updateConsultation,
  updateLead,
  updateLeadStatus,
  type GetConsultationsParams,
  type GetLeadsParams,
  type PipelineStage,
} from "@/api/leads";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { APIError } from "./types";

export function useLeads(params: GetLeadsParams = {}) {
  return useQuery({
    queryKey: ["leads", params],
    queryFn: () => getLeads(params),
  });
}

export function useLeadsStageCount() {
  return useQuery({
    queryKey: ["leadsStageCount"],
    queryFn: () => getLeadsStageCount(),
  });
}

export function useLeadById(id: string) {
  return useQuery({
    queryKey: ["lead", id],
    queryFn: () => getLeadById(id),
    enabled: Boolean(id),
  });
}

export function useConsultations(params: GetConsultationsParams = {}) {
  return useQuery({
    queryKey: ["consultations", params],
    queryFn: () => getConsultations(params),
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      toast.success("Lead added to inbox");
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to add lead");
    },
  });
}

export function useUpdateLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateLeadStatus(id, status),
    onSuccess: (_, params) => {
      if (params.status === "archived") {
        toast.success(`Lead ${params.status}`);
      }
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead", params.id] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to archive lead");
    },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateLead>[1];
    }) => updateLead(id, data),
    onSuccess: (_, { id }) => {
      toast.success("Notes saved");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead", id] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to save notes");
    },
  });
}

export function useAdvanceLeadStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: PipelineStage }) =>
      advanceLeadStage(id, stage),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead", id] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to advance stage");
    },
  });
}

export function useRunConflictCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => runConflictCheck(id),
    onSuccess: (result, id) => {
      const messages: Record<string, string> = {
        pass: "Conflict check passed — lead advanced to questionnaire",
        needs_review: "Conflict check flagged for review",
        conflict_found: "Conflict found — lead blocked pending review",
      };
      if (result.status !== "pending") {
        toast.success(messages[result.status] ?? "Conflict check complete");
      }
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead", id] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Conflict check failed");
    },
  });
}

export function useResolveConflictCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof resolveConflictCheck>[1];
    }) => resolveConflictCheck(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead", id] });
      // Stage counts live under a distinct key — refresh badges after a
      // decline (which drops the lead out of the pipeline) or an approve.
      qc.invalidateQueries({ queryKey: ["leadsStageCount"] });
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Failed to resolve conflict check",
      );
    },
  });
}

export function useSendQuestionnaire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sendQuestionnaire(id),
    onSuccess: (_, id) => {
      toast.success("Questionnaire sent to lead");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead", id] });
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Failed to send questionnaire",
      );
    },
  });
}

export function useInitiateConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof initiateConsultation>[1];
    }) => initiateConsultation(id, data),
    onSuccess: (_, { id }) => {
      toast.success("Consultation request sent to the lead");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead", id] });
      qc.invalidateQueries({ queryKey: ["leadsStageCount"] });
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Failed to start scheduling",
      );
    },
  });
}

export function useUpdateConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateConsultation>[1];
    }) => updateConsultation(id, data),
    onSuccess: (_, { id }) => {
      toast.success("Consultation updated");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead", id] });
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Failed to update consultation",
      );
    },
  });
}

export function useGenerateFeeAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof generateFeeAgreement>[1];
    }) => generateFeeAgreement(id, data),
    onSuccess: (_, { id }) => {
      toast.success("Fee agreement generated");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead", id] });
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Failed to generate fee agreement",
      );
    },
  });
}

export function useSendFeeAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (agreementId: string) => sendFeeAgreement(agreementId),
    onSuccess: () => {
      toast.success("Fee agreement sent — signing link emailed to the client");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead"] });
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Failed to send fee agreement",
      );
    },
  });
}

export function useMarkFeeAgreementReceived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (agreementId: string) => markFeeAgreementReceived(agreementId),
    onSuccess: () => {
      toast.success("Signed agreement received — lead advanced to case opening");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead"] });
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Failed to mark agreement as received",
      );
    },
  });
}

export function useNudgeClient() {
  return useMutation({
    mutationFn: (agreementId: string) => nudgeClient(agreementId),
    onSuccess: () => {
      toast.success("Reminder sent to client");
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to send reminder");
    },
  });
}

export function useOpenCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof openCase>[1];
    }) => openCase(id, data),
    onSuccess: (_, { id }) => {
      toast.success("Case opened successfully");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead", id] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to open case");
    },
  });
}
