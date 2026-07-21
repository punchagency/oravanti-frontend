import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reassignCaseTeam } from "../api/cases";
import type {
  CreateCaseNoteParams,
  GetCaseNotesParams,
  UpdateCaseNoteParams,
} from "../api/workflows";
import {
  activateModule,
  approveStep,
  assignStep,
  bulkDeleteCaseNotes,
  bulkPinCaseNotes,
  completeStep,
  createCaseNote,
  deleteCaseNote,
  getCaseDocuments,
  getCaseEvents,
  getCaseNotes,
  getCaseTimeline,
  getCaseWorkflow,
  getMyTasks,
  getReviewQueue,
  getWorkflowLogs,
  getWorkflowSummary,
  rejectStep,
  submitForReview,
  toggleCaseNotePin,
  updateCaseNote,
} from "../api/workflows";
import type { APIError } from "./types";

// ─── Query key factory ──────────────────────────────────────────────────────────

export const workflowKeys = {
  all: ["workflow"] as const,
  instance: (caseId: string) => ["workflow", "instance", caseId] as const,
  summary: (caseId: string) => ["workflow", "summary", caseId] as const,
  timeline: (caseId: string, page?: number, limit?: number) =>
    [
      "workflow",
      "timeline",
      caseId,
      ...(page ? [`p${page}`] : []),
      ...(limit ? [`l${limit}`] : []),
    ] as const,
  logs: (caseId: string, page?: number, limit?: number) =>
    [
      "workflow",
      "logs",
      caseId,
      ...(page ? [`p${page}`] : []),
      ...(limit ? [`l${limit}`] : []),
    ] as const,
  documents: (caseId: string) => ["workflow", "documents", caseId] as const,
  notes: (caseId: string, params?: GetCaseNotesParams) =>
    [
      "workflow",
      "notes",
      caseId,
      ...(params?.pinnedOnly ? ["pinned"] : []),
      ...(params?.context ? [params.context] : []),
      ...(params?.authorId ? [params.authorId] : []),
      ...(params?.page ? [`p${params.page}`] : []),
      ...(params?.limit ? [`l${params.limit}`] : []),
    ] as const,
  caseEvents: (caseId: string, page?: number, limit?: number) =>
    [
      "case-events",
      caseId,
      ...(page ? [`p${page}`] : []),
      ...(limit ? [`l${limit}`] : []),
    ] as const,
  myTasks: (status?: string, page?: number, limit?: number) =>
    [
      "workflow",
      "my-tasks",
      ...(status ? [status] : []),
      ...(page ? [`p${page}`] : []),
      ...(limit ? [`l${limit}`] : []),
    ] as const,
  reviewQueue: (status?: string, page?: number, limit?: number) =>
    [
      "workflow",
      "review-queue",
      ...(status ? [status] : []),
      ...(page ? [`p${page}`] : []),
      ...(limit ? [`l${limit}`] : []),
    ] as const,
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

export function useCaseTimeline(
  caseId: string,
  page?: number,
  limit?: number,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: workflowKeys.timeline(caseId, page, limit),
    queryFn: () => getCaseTimeline(caseId, page, limit),
    enabled: Boolean(caseId) && enabled,
    staleTime: 30_000,
  });
}

export function useWorkflowLogs(
  caseId: string,
  page?: number,
  limit?: number,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: workflowKeys.logs(caseId, page, limit),
    queryFn: () => getWorkflowLogs(caseId, page, limit),
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
      queryClient.invalidateQueries({
        queryKey: workflowKeys.instance(caseId),
      });
      queryClient.invalidateQueries({ queryKey: workflowKeys.summary(caseId) });
      queryClient.invalidateQueries({
        queryKey: workflowKeys.timeline(caseId),
      });
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
    mutationFn: ({ stepId, notes }: { stepId: string; notes?: string }) =>
      completeStep(caseId, stepId, notes),
    onSuccess: () => {
      toast.success("Step completed");
      queryClient.invalidateQueries({
        queryKey: workflowKeys.instance(caseId),
      });
      queryClient.invalidateQueries({ queryKey: workflowKeys.summary(caseId) });
      queryClient.invalidateQueries({
        queryKey: workflowKeys.timeline(caseId),
      });
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
      queryClient.invalidateQueries({
        queryKey: workflowKeys.instance(caseId),
      });
      queryClient.invalidateQueries({ queryKey: workflowKeys.summary(caseId) });
      queryClient.invalidateQueries({
        queryKey: workflowKeys.timeline(caseId),
      });
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
    mutationFn: ({ stepId, notes }: { stepId: string; notes?: string }) =>
      approveStep(caseId, stepId, notes),
    onSuccess: () => {
      toast.success("Step approved");
      queryClient.invalidateQueries({
        queryKey: workflowKeys.instance(caseId),
      });
      queryClient.invalidateQueries({ queryKey: workflowKeys.summary(caseId) });
      queryClient.invalidateQueries({
        queryKey: workflowKeys.timeline(caseId),
      });
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
    mutationFn: ({ stepId, feedback }: { stepId: string; feedback: string }) =>
      rejectStep(caseId, stepId, feedback),
    onSuccess: () => {
      toast.success("Step rejected with feedback");
      queryClient.invalidateQueries({
        queryKey: workflowKeys.instance(caseId),
      });
      queryClient.invalidateQueries({ queryKey: workflowKeys.summary(caseId) });
      queryClient.invalidateQueries({
        queryKey: workflowKeys.timeline(caseId),
      });
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
      queryClient.invalidateQueries({
        queryKey: workflowKeys.instance(caseId),
      });
      queryClient.invalidateQueries({ queryKey: workflowKeys.summary(caseId) });
      queryClient.invalidateQueries({
        queryKey: workflowKeys.timeline(caseId),
      });
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

export function useCaseDocuments(
  caseId: string,
  page?: number,
  limit?: number,
) {
  return useQuery({
    queryKey: workflowKeys.documents(caseId),
    queryFn: () => getCaseDocuments(caseId, page, limit),
    enabled: Boolean(caseId),
    staleTime: 30_000,
  });
}

// ─── Case Notes ──────────────────────────────────────────────────────────────

export function useCaseNotes(caseId: string, params?: GetCaseNotesParams) {
  return useQuery({
    queryKey: workflowKeys.notes(caseId, params),
    queryFn: () => getCaseNotes(caseId, params),
    enabled: Boolean(caseId),
    staleTime: 30_000,
  });
}

export function useCreateCaseNote(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateCaseNoteParams) =>
      createCaseNote(caseId, params),
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
    mutationFn: ({
      noteId,
      ...params
    }: { noteId: string } & UpdateCaseNoteParams) =>
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

export function useToggleCaseNotePin(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => toggleCaseNotePin(caseId, noteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowKeys.notes(caseId) });
      toast.success("Pin toggled");
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to toggle pin");
    },
  });
}

export function useBulkDeleteCaseNotes(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteIds: string[]) => bulkDeleteCaseNotes(caseId, noteIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowKeys.notes(caseId) });
      toast.success("Notes deleted");
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to delete notes");
    },
  });
}

export function useBulkPinCaseNotes(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ noteIds, pinned }: { noteIds: string[]; pinned: boolean }) =>
      bulkPinCaseNotes(caseId, noteIds, pinned),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowKeys.notes(caseId) });
      toast.success("Notes updated");
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to update notes");
    },
  });
}

export function useReassignCaseTeam(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (teamId: string) => reassignCaseTeam(caseId, teamId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowKeys.instance(caseId) });
      qc.invalidateQueries({ queryKey: workflowKeys.notes(caseId) });
      qc.invalidateQueries({ queryKey: ["case", caseId] });
      qc.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Team reassigned");
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to reassign team");
    },
  });
}

// ─── Case Events (Unified Audit Trail) ───────────────────────────────────────

export function useCaseEvents(
  caseId: string,
  page: number = 1,
  limit: number = 10,
) {
  return useQuery({
    queryKey: workflowKeys.caseEvents(caseId, page, limit),
    queryFn: () => getCaseEvents(caseId, page, limit),
    enabled: !!caseId,
  });
}
