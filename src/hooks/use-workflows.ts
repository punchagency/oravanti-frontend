import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reassignCaseTeam } from "../api/cases";
import { caseKeys } from "./use-cases";
import { taskKeys } from "./use-tasks";
import type {
  CaseRelationType,
  CreateCaseNoteParams,
  GetCaseNotesParams,
  UpdateCaseNoteParams,
  UpdateWorkflowModuleParams,
} from "../api/workflows";
import {
  activateModule,
  cloneWorkflowTemplate,
  getMandamusCandidacy,
  getWorkflowTemplate,
  linkCase,
  unlinkCase,
  updateWorkflowModule,
  bulkDeleteCaseNotes,
  bulkPinCaseNotes,
  createCaseNote,
  deleteCaseNote,
  getCaseDocuments,
  getCaseEvents,
  getCaseNotes,
  getCaseTimeline,
  getCaseWorkflow,
  getWorkflowLogs,
  getWorkflowSummary,
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
};

// ─── Queries ─────────────────────────────────────────────────────────────────────

export function useCaseWorkflow(caseId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: workflowKeys.instance(caseId),
    queryFn: () => getCaseWorkflow(caseId),
    enabled: Boolean(caseId) && enabled,
  });
}

export function useWorkflowSummary(caseId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: workflowKeys.summary(caseId),
    queryFn: () => getWorkflowSummary(caseId),
    enabled: Boolean(caseId) && enabled,
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
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────────

// The per-step mutations moved to `useTransitionTask`/`useAssignTask` in
// `@/hooks/use-tasks`, which invalidate the case, workflow and task queries
// together — a step change moves rows in all three.

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
      // Activating a manual module *creates* its tasks — this is the whole
      // point of the action, not a side effect. Without this the workflow tab
      // keeps rendering the module as still locked until something else
      // refetches.
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to activate module");
    },
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
  });
}

// ─── Case Notes ──────────────────────────────────────────────────────────────

export function useCaseNotes(caseId: string, params?: GetCaseNotesParams) {
  return useQuery({
    queryKey: workflowKeys.notes(caseId, params),
    queryFn: () => getCaseNotes(caseId, params),
    enabled: Boolean(caseId),
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
      qc.invalidateQueries({ queryKey: caseKeys.detail(caseId) });
      qc.invalidateQueries({ queryKey: caseKeys.all });
      // The first team on a case is what lets the backend materialize its
      // workflow at all (`materializeTasksForCase` returns early without one),
      // so this write creates the case's entire task board as a side effect.
      // Without this the tab keeps rendering the empty list it cached before
      // the team existed — a whole workflow invisible until a hard refresh.
      qc.invalidateQueries({ queryKey: taskKeys.all });
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

// ─── Workflow templates, case linking, mandamus candidacy ────────────────────

export const templateKeys = {
  all: ["workflow-template"] as const,
  byCaseType: (caseTypeId: string) => ["workflow-template", caseTypeId] as const,
  mandamusCandidacy: (caseId: string) => ["mandamus-candidacy", caseId] as const,
};

/**
 * The template a case of this type materializes from.
 *
 * The workflow tab needs it for what the *tasks* can't say: which modules
 * exist, which are conditional and on what, and which steps are locked. A
 * conditional module with no materialized tasks is one that hasn't unlocked
 * yet — that difference is only visible by comparing the two.
 */
export function useWorkflowTemplate(caseTypeId: string | null | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: templateKeys.byCaseType(caseTypeId ?? ""),
    queryFn: () => getWorkflowTemplate(caseTypeId!),
    enabled: Boolean(caseTypeId) && enabled,
    // A case type without a seeded template is a real configuration state, not
    // a transient failure — retrying the 404 three times just delays the
    // empty state.
    retry: false,
  });
}

export function useMandamusCandidacy(caseId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: templateKeys.mandamusCandidacy(caseId),
    queryFn: () => getMandamusCandidacy(caseId),
    enabled: Boolean(caseId) && enabled,
    retry: false,
  });
}

export function useCloneWorkflowTemplate(caseTypeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => cloneWorkflowTemplate(templateId),
    onSuccess: () => {
      toast.success("Template copied to your firm");
      queryClient.invalidateQueries({ queryKey: templateKeys.byCaseType(caseTypeId) });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to copy template");
    },
  });
}

export function useUpdateWorkflowModule(caseTypeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      moduleId,
      ...params
    }: UpdateWorkflowModuleParams & { templateId: string; moduleId: string }) =>
      updateWorkflowModule(templateId, moduleId, params),
    onSuccess: () => {
      toast.success("Module updated");
      queryClient.invalidateQueries({ queryKey: templateKeys.byCaseType(caseTypeId) });
    },
    onError: (err: APIError) => {
      // A 403 here means the template is the shared system default and needs
      // cloning first — the backend's message says so.
      toast.error(err.response?.data?.message ?? "Failed to update module");
    },
  });
}

/**
 * Links an existing case to this one. Generic over `relationType` because
 * `appeal` and `related_matter` already exist alongside `mandamus` — the only
 * one with a user today.
 *
 * Never a one-click auto-file: the mandamus matter is opened as its own case
 * first, then linked here, deliberately.
 */
export function useCaseLink(parentCaseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      childCaseId,
      relationType,
    }: {
      childCaseId: string;
      relationType: CaseRelationType;
    }) => linkCase(parentCaseId, childCaseId, relationType),
    onSuccess: () => {
      toast.success("Case linked");
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to link case");
    },
  });
}

/** Removes a case's link to its parent. The CHILD is the case addressed. */
export function useUnlinkCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (childCaseId: string) => unlinkCase(childCaseId),
    onSuccess: () => {
      toast.success("Case unlinked");
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to unlink case");
    },
  });
}
