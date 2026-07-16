import {
  addLeadNote,
  advanceLeadStage,
  archiveLead,
  cancelConsultation,
  initiateConsultation,
  createLead,
  generateFeeAgreement,
  getConsultations,
  getFeeAgreementPreview,
  getLeadActivity,
  getLeadById,
  getLeadMetrics,
  getLeadNotes,
  getLeads,
  getLeadsStageCount,
  discardFeeAgreement,
  markFeeAgreementPaymentReceived,
  markFeeAgreementReceived,
  nudgeClient,
  restoreLead,
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
  type LeadNoteType,
  type UpdateLeadInput,
  type MetricsPeriod,
  type PipelineStage,
} from "@/api/leads";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useFeedbackDialog } from "./useFeedbackDialog";
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

// Keyed under ["lead", id] so that every existing mutation — all of which
// already invalidate that prefix — refreshes the trail for free. React Query
// matches query keys by prefix, so a conflict check or a sent questionnaire
// shows up in Activity without each hook having to know the trail exists.
export function useLeadActivity(id: string, enabled = true) {
  return useQuery({
    queryKey: ["lead", id, "activity"],
    queryFn: () => getLeadActivity(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useLeadNotes(id: string, enabled = true) {
  return useQuery({
    queryKey: ["lead", id, "notes"],
    queryFn: () => getLeadNotes(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useLeadMetrics(period: MetricsPeriod) {
  return useQuery({
    queryKey: ["lead-metrics", period],
    queryFn: () => getLeadMetrics(period),
  });
}

export function useAddLeadNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { type?: LeadNoteType; content: string };
    }) => addLeadNote(id, data),
    onSuccess: (_, params) => {
      toast.success("Note added");
      // Prefix-invalidates both the notes list and the activity trail, since a
      // note also lands there as "Note added by X".
      qc.invalidateQueries({ queryKey: ["lead", params.id] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to add note");
    },
  });
}

export function useArchiveLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      archiveLead(id, reason),
    onSuccess: (_, params) => {
      toast.success("Lead archived");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead", params.id] });
      qc.invalidateQueries({ queryKey: ["leadsStageCount"] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to archive lead");
    },
  });
}

export function useRestoreLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreLead(id),
    onSuccess: (_, id) => {
      toast.success("Lead restored");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead", id] });
      qc.invalidateQueries({ queryKey: ["leadsStageCount"] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to restore lead");
    },
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
    mutationFn: ({ id, status, actorId }: { id: string; status: string; actorId?: string }) =>
      updateLeadStatus(id, status, actorId),
    onSuccess: (_, params) => {
      const messages: Record<string, string> = {
        archived: "Lead archived",
        reviewed: "Lead marked as reviewed",
        new: "Lead unarchived",
      };
      toast.success(messages[params.status] ?? `Lead ${params.status}`);
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead", params.id] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to update lead status");
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

/**
 * Same endpoint as useUpdateLead, but for editing the lead's details rather
 * than appending a note — useUpdateLead is wired for the notes path and always
 * toasts "Notes saved", which would be a lie here.
 */
export function useEditLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeadInput }) =>
      updateLead(id, data),
    onSuccess: (_, { id }) => {
      toast.success("Lead updated");
      qc.invalidateQueries({ queryKey: ["leads"] });
      // Prefix-invalidates the detail, activity trail and notes.
      qc.invalidateQueries({ queryKey: ["lead", id] });
      qc.invalidateQueries({ queryKey: ["leadsStageCount"] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to update lead");
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
    onSuccess: (_res, { data, id }) => {
      toast.success(
        data.startNow
          ? // Instant: pay_now with a fee waits on payment, otherwise it began.
            data.paymentTiming === "pay_now" && data.feeAmount != null
            ? "Payment link sent — the consultation begins as soon as the client pays"
            : "Consultation started"
          : data.urgent
            ? "Consultation booked"
            : "Consultation request sent to the lead",
      );
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead", id] });
      qc.invalidateQueries({ queryKey: ["consultations"] });
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

export function useCancelConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      cancelConsultation(id, { reason }),
    onSuccess: (_, { id }) => {
      toast.success("Consultation cancelled");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead", id] });
      qc.invalidateQueries({ queryKey: ["consultations"] });
      qc.invalidateQueries({ queryKey: ["leadsStageCount"] });
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Failed to cancel consultation",
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

export function useFeeAgreementPreview(
  agreementId: string | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["feeAgreementPreview", agreementId],
    queryFn: () => getFeeAgreementPreview(agreementId as string),
    enabled: enabled && Boolean(agreementId),
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
      // The lead only advances once the payment gate is also satisfied.
      toast.success("Signed agreement received");
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

export function useDiscardFeeAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (agreementId: string) => discardFeeAgreement(agreementId),
    onSuccess: () => {
      toast.success("Draft discarded — adjust the configuration and regenerate");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead"] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to discard the draft");
    },
  });
}

export function useMarkFeeAgreementPaymentReceived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (agreementId: string) =>
      markFeeAgreementPaymentReceived(agreementId),
    onSuccess: () => {
      toast.success("Payment recorded");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead"] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to record payment");
    },
  });
}

export function useNudgeClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (agreementId: string) => nudgeClient(agreementId),
    onSuccess: () => {
      toast.success("Reminder sent to client");
      qc.invalidateQueries({ queryKey: ["lead"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to send reminder");
    },
  });
}

export function useOpenCase() {
  const qc = useQueryClient();
  const { showSuccess, showError } = useFeedbackDialog();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof openCase>[1];
    }) => openCase(id, data),
    onSuccess: (_, { id }) => {
      showSuccess({ title: "Case opened successfully" });
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead", id] });
    },
    onError: (error) => {
      showError({
        title: "Failed to open case",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
}
