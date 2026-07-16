import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getCaseWorkflow,
  getWorkflowSummary,
  completeStep,
  submitForReview,
  approveStep,
  rejectStep,
  assignStep,
  activateModule,
  getCaseTimeline,
  getMyTasks,
  getReviewQueue,
  getWorkflowLogs,
  getCaseDocuments,
} from "../api/workflows";
import type { APIError } from "./types";

// ─── Query key factory ──────────────────────────────────────────────────────────

export const workflowKeys = {
  all: ["workflow"] as const,
  instance: (caseId: string) => ["workflow", "instance", caseId] as const,
  summary: (caseId: string) => ["workflow", "summary", caseId] as const,
  timeline: (caseId: string) => ["workflow", "timeline", caseId] as const,
  logs: (caseId: string) => ["workflow", "logs", caseId] as const,
  documents: (caseId: string) => ["workflow", "documents", caseId] as const,
  notes: (caseId: string) => ["workflow", "notes", caseId] as const,
  myTasks: (status?: string, page?: number, limit?: number) =>
    ["workflow", "my-tasks", ...(status ? [status] : []), ...(page ? [`p${page}`] : []), ...(limit ? [`l${limit}`] : [])] as const,
  reviewQueue: (status?: string, page?: number, limit?: number) =>
    ["workflow", "review-queue", ...(status ? [status] : []), ...(page ? [`p${page}`] : []), ...(limit ? [`l${limit}`] : [])] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────────

export function useCaseWorkflow(caseId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: workflowKeys.instance(caseId),
    queryFn: () => getCaseWorkflow(caseId),
    enabled: Boolean(caseId) && enabled,
    staleTime: 30_000,
  });
}

export function useWorkflowSummary(caseId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: workflowKeys.summary(caseId),
    queryFn: () => getWorkflowSummary(caseId),
    enabled: Boolean(caseId) && enabled,
    staleTime: 30_000,
  });
}

export function useCaseTimeline(caseId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: workflowKeys.timeline(caseId),
    queryFn: () => getCaseTimeline(caseId),
    enabled: Boolean(caseId) && enabled,
    staleTime: 30_000,
  });
}

export function useWorkflowLogs(caseId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: workflowKeys.logs(caseId),
    queryFn: () => getWorkflowLogs(caseId),
    enabled: Boolean(caseId) && enabled,
    staleTime: 30_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────────

export function useAssignStep(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      stepId,
      staffId,
      overrideRationale,
    }: {
      stepId: string;
      staffId: string;
      overrideRationale?: string;
    }) => assignStep(caseId, stepId, staffId, overrideRationale),
    onSuccess: () => {
      toast.success("Step assigned");
      queryClient.invalidateQueries({ queryKey: workflowKeys.instance(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.summary(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.timeline(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.myTasks() });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to assign step");
    },
  });
}

export function useCompleteStep(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      stepId,
      notes,
    }: {
      stepId: string;
      notes?: string;
    }) => completeStep(caseId, stepId, notes),
    onSuccess: () => {
      toast.success("Step completed");
      queryClient.invalidateQueries({ queryKey: workflowKeys.instance(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.summary(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.timeline(caseId) });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to complete step");
    },
  });
}

export function useSubmitForReview(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stepId, notes }: { stepId: string; notes?: string }) =>
      submitForReview(caseId, stepId, notes),
    onSuccess: () => {
      toast.success("Step submitted for review");
      queryClient.invalidateQueries({ queryKey: workflowKeys.instance(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.summary(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.timeline(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.myTasks() });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to submit for review");
    },
  });
}

export function useApproveStep(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      stepId,
      notes,
    }: {
      stepId: string;
      notes?: string;
    }) => approveStep(caseId, stepId, notes),
    onSuccess: () => {
      toast.success("Step approved");
      queryClient.invalidateQueries({ queryKey: workflowKeys.instance(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.summary(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.timeline(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.reviewQueue() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.myTasks() });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to approve step");
    },
  });
}

export function useRejectStep(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      stepId,
      feedback,
    }: {
      stepId: string;
      feedback: string;
    }) => rejectStep(caseId, stepId, feedback),
    onSuccess: () => {
      toast.success("Step rejected with feedback");
      queryClient.invalidateQueries({ queryKey: workflowKeys.instance(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.summary(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.timeline(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.reviewQueue() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.myTasks() });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to reject step");
    },
  });
}

export function useTriggerModule(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (moduleId: string) => activateModule(caseId, moduleId),
    onSuccess: () => {
      toast.success("Module activated");
      queryClient.invalidateQueries({ queryKey: workflowKeys.instance(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.summary(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.timeline(caseId) });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to activate module");
    },
  });
}

// ─── My Tasks ───────────────────────────────────────────────────────────────────

export function useMyTasks(status?: string, page?: number, limit?: number) {
  return useQuery({
    queryKey: workflowKeys.myTasks(status, page, limit),
    queryFn: () => getMyTasks(status, page, limit),
    staleTime: 30_000,
  });
}

// ─── Review Queue ───────────────────────────────────────────────────────────────

export function useReviewQueue(status?: string, page?: number, limit?: number) {
  return useQuery({
    queryKey: workflowKeys.reviewQueue(status, page, limit),
    queryFn: () => getReviewQueue(status, page, limit),
    staleTime: 15_000,
  });
}

// ─── Case Documents ──────────────────────────────────────────────────────────

export function useCaseDocuments(caseId: string, page?: number, limit?: number) {
  return useQuery({
    queryKey: workflowKeys.documents(caseId),
    queryFn: () => getCaseDocuments(caseId, page, limit),
    enabled: Boolean(caseId),
    staleTime: 30_000,
  });
}

// ─── Case Notes ──────────────────────────────────────────────────────────────

import {
  getCaseNotes,
  createCaseNote,
  updateCaseNote,
  deleteCaseNote,
} from "../api/workflows";
import type { CreateCaseNoteParams, UpdateCaseNoteParams } from "../api/workflows";

export function useCaseNotes(caseId: string) {
  return useQuery({
    queryKey: workflowKeys.notes(caseId),
    queryFn: () => getCaseNotes(caseId),
    enabled: Boolean(caseId),
    staleTime: 30_000,
  });
}

export function useCreateCaseNote(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateCaseNoteParams) => createCaseNote(caseId, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowKeys.notes(caseId) });
      toast.success("Note added");
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to add note");
    },
  });
}

export function useUpdateCaseNote(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, ...params }: { noteId: string } & UpdateCaseNoteParams) =>
      updateCaseNote(caseId, noteId, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowKeys.notes(caseId) });
      toast.success("Note updated");
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to update note");
    },
  });
}

export function useDeleteCaseNote(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => deleteCaseNote(caseId, noteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowKeys.notes(caseId) });
      toast.success("Note deleted");
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to delete note");
    },
  });
}
