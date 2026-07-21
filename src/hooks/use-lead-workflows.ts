import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  assignLeadTask,
  approveLeadTask,
  completeLeadTask,
  createLeadNote,
  createLeadTask,
  deleteLeadNote,
  deleteLeadTask,
  getLeadAuditLog,
  getLeadDocuments,
  getLeadNotes,
  getLeadQuestionnaireFiles,
  getLeadReviewQueue,
  getLeadTasks,
  getLeadTimeline,
  getMyLeadTasks,
  initializePipeline,
  linkLeadDocument,
  rejectLeadTask,
  submitLeadTaskForReview,
  toggleLeadNotePin,
  unlinkLeadDocument,
  updateLeadNote,
  updateLeadTask,
  updateLeadTaskStatus,
} from "@/api/lead-workflows";
import type { CreateLeadNoteParams, LeadNoteType, LeadNoteVisibility, LeadTaskInput, LeadTaskStatus } from "@/api/lead-workflows";
import type { APIError } from "./types";

export function useMyLeadTasks() {
  return useQuery({
    queryKey: ["myLeadTasks"],
    queryFn: () => getMyLeadTasks(),
  });
}

export function useLeadTasks(leadId: string) {
  return useQuery({
    queryKey: ["leadTasks", leadId],
    queryFn: () => getLeadTasks(leadId),
    enabled: Boolean(leadId),
  });
}

export function useInitializePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) => initializePipeline(leadId),
    onSuccess: (_data, leadId) => {
      qc.invalidateQueries({ queryKey: ["leadTasks", leadId] });
      qc.invalidateQueries({ queryKey: ["myLeadTasks"] });
      qc.invalidateQueries({ queryKey: ["leadTimeline", leadId] });
      qc.invalidateQueries({ queryKey: ["leadAuditLog", leadId] });
      toast.success("Pipeline steps initialized");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to initialize pipeline");
    },
  });
}

export function useCreateLeadTask(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LeadTaskInput) => createLeadTask(leadId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadTasks", leadId] });
      qc.invalidateQueries({ queryKey: ["leadTimeline", leadId] });
      qc.invalidateQueries({ queryKey: ["leadAuditLog", leadId] });
      toast.success("Task created");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to create task");
    },
  });
}

export function useUpdateLeadTask(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, ...input }: { taskId: string } & Record<string, unknown>) =>
      updateLeadTask(leadId, taskId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadTasks", leadId] });
      qc.invalidateQueries({ queryKey: ["leadTimeline", leadId] });
      qc.invalidateQueries({ queryKey: ["leadAuditLog", leadId] });
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to update task");
    },
  });
}

export function useUpdateLeadTaskStatus(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: LeadTaskStatus }) =>
      updateLeadTaskStatus(leadId, taskId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadTasks", leadId] });
      qc.invalidateQueries({ queryKey: ["myLeadTasks"] });
      qc.invalidateQueries({ queryKey: leadWorkflowKeys.reviewQueue() });
      qc.invalidateQueries({ queryKey: ["leadTimeline", leadId] });
      qc.invalidateQueries({ queryKey: ["leadAuditLog", leadId] });
    },
  });
}

export function useAssignLeadTask(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, assignedToId }: { taskId: string; assignedToId: string }) =>
      assignLeadTask(leadId, taskId, assignedToId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadTasks", leadId] });
      qc.invalidateQueries({ queryKey: ["myLeadTasks"] });
      qc.invalidateQueries({ queryKey: ["leadTimeline", leadId] });
      qc.invalidateQueries({ queryKey: ["leadAuditLog", leadId] });
      toast.success("Task assigned");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to assign task");
    },
  });
}

export function useCompleteLeadTask(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => completeLeadTask(leadId, taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadTasks", leadId] });
      qc.invalidateQueries({ queryKey: ["myLeadTasks"] });
      qc.invalidateQueries({ queryKey: leadWorkflowKeys.reviewQueue() });
      qc.invalidateQueries({ queryKey: ["leadTimeline", leadId] });
      qc.invalidateQueries({ queryKey: ["leadAuditLog", leadId] });
      toast.success("Task completed");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to complete task");
    },
  });
}

export function useDeleteLeadTask(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => deleteLeadTask(leadId, taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadTasks", leadId] });
      qc.invalidateQueries({ queryKey: ["leadTimeline", leadId] });
      qc.invalidateQueries({ queryKey: ["leadAuditLog", leadId] });
      toast.success("Task deleted");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to delete task");
    },
  });
}

export function useLeadTimeline(leadId: string, enabled = true, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["leadTimeline", leadId, page, limit],
    queryFn: () => getLeadTimeline(leadId, page, limit),
    enabled: Boolean(leadId) && enabled,
    staleTime: 30_000,
  });
}

export function useLeadAuditLog(leadId: string, enabled = true, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["leadAuditLog", leadId, page, limit],
    queryFn: () => getLeadAuditLog(leadId, page, limit),
    enabled: Boolean(leadId) && enabled,
    staleTime: 30_000,
  });
}

// ─── Lead Notes ──────────────────────────────────────────────────────────────

export function useLeadNotes(leadId: string, opts?: { context?: string; authorId?: string; pinnedOnly?: boolean; page?: number; limit?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: ["leadNotes", leadId, opts?.context ?? "all", opts?.authorId ?? "all", opts?.pinnedOnly ?? false, opts?.page ?? 1, opts?.limit ?? 50],
    queryFn: () => getLeadNotes(leadId, { context: opts?.context, authorId: opts?.authorId, pinnedOnly: opts?.pinnedOnly, page: opts?.page, limit: opts?.limit }),
    enabled: Boolean(leadId) && (opts?.enabled ?? true),
  });
}

export function useCreateLeadNote(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateLeadNoteParams) => createLeadNote(leadId, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadNotes", leadId] });
      qc.invalidateQueries({ queryKey: ["leadTimeline", leadId] });
      qc.invalidateQueries({ queryKey: ["leadAuditLog", leadId] });
      toast.success("Note added");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to add note");
    },
  });
}

export function useUpdateLeadNote(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, ...params }: { noteId: string } & { content?: string; type?: LeadNoteType; visibility?: LeadNoteVisibility; isPinned?: boolean }) =>
      updateLeadNote(leadId, noteId, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadNotes", leadId] });
      qc.invalidateQueries({ queryKey: ["leadTimeline", leadId] });
      qc.invalidateQueries({ queryKey: ["leadAuditLog", leadId] });
      toast.success("Note updated");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to update note");
    },
  });
}

export function useDeleteLeadNote(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => deleteLeadNote(leadId, noteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadNotes", leadId] });
      qc.invalidateQueries({ queryKey: ["leadTimeline", leadId] });
      qc.invalidateQueries({ queryKey: ["leadAuditLog", leadId] });
      toast.success("Note deleted");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to delete note");
    },
  });
}

// ─── Lead Documents ──────────────────────────────────────────────────────────

export function useLeadDocuments(leadId: string) {
  return useQuery({
    queryKey: ["leadDocuments", leadId],
    queryFn: () => getLeadDocuments(leadId),
    enabled: Boolean(leadId),
  });
}

export function useLinkLeadDocument(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => linkLeadDocument(leadId, documentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadDocuments", leadId] });
      qc.invalidateQueries({ queryKey: ["leadTimeline", leadId] });
      qc.invalidateQueries({ queryKey: ["leadAuditLog", leadId] });
      toast.success("Document linked");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to link document");
    },
  });
}

export function useUnlinkLeadDocument(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (linkId: string) => unlinkLeadDocument(leadId, linkId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadDocuments", leadId] });
      qc.invalidateQueries({ queryKey: ["leadTimeline", leadId] });
      qc.invalidateQueries({ queryKey: ["leadAuditLog", leadId] });
      toast.success("Document unlinked");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to unlink document");
    },
  });
}

// ─── Lead Questionnaire Files ────────────────────────────────────────────────

export function useLeadQuestionnaireFiles(leadId: string) {
  return useQuery({
    queryKey: ["leadQuestionnaireFiles", leadId],
    queryFn: () => getLeadQuestionnaireFiles(leadId),
    enabled: Boolean(leadId),
  });
}

// ─── Lead Task Review ────────────────────────────────────────────────────────

export const leadWorkflowKeys = {
  reviewQueue: () => ["leadReviewQueue"] as const,
};

export function useSubmitLeadTaskForReview(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, notes }: { taskId: string; notes?: string }) =>
      submitLeadTaskForReview(leadId, taskId, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadTasks", leadId] });
      qc.invalidateQueries({ queryKey: ["myLeadTasks"] });
      qc.invalidateQueries({ queryKey: leadWorkflowKeys.reviewQueue() });
      qc.invalidateQueries({ queryKey: ["leadTimeline", leadId] });
      qc.invalidateQueries({ queryKey: ["leadAuditLog", leadId] });
      toast.success("Task submitted for review");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to submit for review");
    },
  });
}

export function useApproveLeadTask(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, notes }: { taskId: string; notes?: string }) =>
      approveLeadTask(leadId, taskId, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadTasks", leadId] });
      qc.invalidateQueries({ queryKey: ["myLeadTasks"] });
      qc.invalidateQueries({ queryKey: leadWorkflowKeys.reviewQueue() });
      qc.invalidateQueries({ queryKey: ["leadTimeline", leadId] });
      qc.invalidateQueries({ queryKey: ["leadAuditLog", leadId] });
      toast.success("Task approved");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to approve task");
    },
  });
}

export function useRejectLeadTask(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, feedback }: { taskId: string; feedback: string }) =>
      rejectLeadTask(leadId, taskId, feedback),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadTasks", leadId] });
      qc.invalidateQueries({ queryKey: ["myLeadTasks"] });
      qc.invalidateQueries({ queryKey: leadWorkflowKeys.reviewQueue() });
      qc.invalidateQueries({ queryKey: ["leadTimeline", leadId] });
      qc.invalidateQueries({ queryKey: ["leadAuditLog", leadId] });
      toast.success("Task rejected");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to reject task");
    },
  });
}

export function useLeadReviewQueue(status?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: [...leadWorkflowKeys.reviewQueue(), status, page, limit],
    queryFn: () => getLeadReviewQueue(status, page, limit),
  });
}

export function useToggleNotePin(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => toggleLeadNotePin(leadId, noteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadNotes", leadId] });
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to toggle pin");
    },
  });
}
