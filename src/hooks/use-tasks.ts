import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  assignTask,
  createTask,
  deleteTask,
  getAssignableStaff,
  getTaskStats,
  getTasks,
  transitionTask,
  updateTask,
} from "../api/tasks";
import type {
  CreateTaskParams,
  TaskFilters,
  TaskTransition,
  UpdateTaskParams,
} from "../api/tasks";
import { getMyTasks, getReviewQueue } from "../api/task-queue";
import type { TaskQueueParams } from "../api/task-queue";
import { taskReviewKeys } from "./use-task-review";
import type { APIError } from "./types";

/**
 * The one task hook.
 *
 * Replaces the separate generic-task, lead-task and workflow-step call sites
 * that mirrored the three backend tables now consolidated into one. Follows the
 * repo's established query pattern: explicit filter-param keys, no background
 * refetch, invalidation on write.
 */

export const taskKeys = {
  all: ["tasks"] as const,
  list: (filters: TaskFilters) => ["tasks", filters] as const,
  stats: () => ["tasks", "stats"] as const,
  assignableStaff: (taskId: string) => ["tasks", taskId, "assignable-staff"] as const,
};

export function useTasks(filters: TaskFilters = {}, enabled: boolean = true) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => getTasks(filters),
    // A task list is meaningless without something to hang it off. Querying
    // with neither would return the whole firm's tasks by accident.
    enabled: enabled && Boolean(filters.caseId || filters.leadId || filters.assignedToId),
  });
}

export function useTaskStats(enabled: boolean = true) {
  return useQuery({ queryKey: taskKeys.stats(), queryFn: getTaskStats, enabled });
}

/**
 * Everyone this task may be handed to — the case's team, or the firm for an
 * intake step.
 *
 * `enabled` so a task menu that is never opened costs no request: the pool is
 * only needed once someone actually starts assigning.
 */
export function useAssignableStaff(taskId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: taskKeys.assignableStaff(taskId),
    queryFn: () => getAssignableStaff(taskId),
    enabled: enabled && Boolean(taskId),
  });
}

// ─── Cross-entity lists ──────────────────────────────────────────────────────

/**
 * Kept under their own prefix rather than `taskKeys`: these are paginated
 * server-side projections, so invalidating them has to be all-or-nothing —
 * `taskKeys.list` keys carry filters a page's params would never reproduce.
 */
export const taskQueueKeys = {
  all: ["taskQueue"] as const,
  review: (params: TaskQueueParams) => ["taskQueue", "review", params] as const,
  mine: (params: TaskQueueParams) => ["taskQueue", "mine", params] as const,
};

/** Tasks waiting on, or already through, review — one queue per `source`. */
export function useReviewQueue(params: TaskQueueParams) {
  return useQuery({
    queryKey: taskQueueKeys.review(params),
    queryFn: () => getReviewQueue(params),
  });
}

/** The caller's own tasks, in the same shape the review queue returns. */
export function useMyTasks(params: TaskQueueParams) {
  return useQuery({
    queryKey: taskQueueKeys.mine(params),
    queryFn: () => getMyTasks(params),
  });
}

/**
 * Invalidating the whole `["tasks"]` prefix rather than one filter combination:
 * a status change moves a task between several cached lists at once, and the
 * lists are small enough that refetching them costs less than reasoning about
 * which ones a given write touched.
 *
 * The case, workflow and lead queries go too — a lead's stage badges and a
 * case's progress are both derived from their tasks, and a task can belong to
 * either, so narrowing this by source would only be right half the time.
 */
function useTaskInvalidation() {
  const queryClient = useQueryClient();

  return () => {
    for (const key of [
      taskKeys.all,
      taskQueueKeys.all,
      ["cases"],
      ["workflow"],
      ["caseWorkflow"],
      ["leadTimeline"],
      ["leadAuditLog"],
    ]) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  };
}

export function useCreateTask() {
  const invalidate = useTaskInvalidation();

  return useMutation({
    mutationFn: (params: CreateTaskParams) => createTask(params),
    onSuccess: () => {
      toast.success("Task created");
      invalidate();
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to create task");
    },
  });
}

export function useUpdateTask() {
  const invalidate = useTaskInvalidation();

  return useMutation({
    mutationFn: ({ taskId, ...params }: UpdateTaskParams & { taskId: string }) =>
      updateTask(taskId, params),
    onSuccess: (_task, variables) => {
      toast.success(variables.overrideRationale ? "Locked step overridden" : "Task updated");
      invalidate();
    },
    onError: (err: APIError) => {
      // The backend's locked-step refusal names the field it refused, so
      // surfacing its message beats a generic one here.
      toast.error(err.response?.data?.message ?? "Failed to update task");
    },
  });
}

export function useDeleteTask() {
  const invalidate = useTaskInvalidation();

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      toast.success("Task deleted");
      invalidate();
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to delete task");
    },
  });
}

const TRANSITION_TOAST: Record<TaskTransition, string> = {
  complete: "Task completed",
  "submit-review": "Task submitted for review",
  approve: "Task approved",
  reject: "Task rejected",
  reopen: "Task reopened",
};

/**
 * Moves a task through its lifecycle.
 *
 * One hook for all five verbs, and for intake steps, case steps and ad-hoc
 * to-dos alike — the caller passes the task id and the verb, never a "kind" or
 * a parent id. The review thread is invalidated alongside the task lists,
 * because every one of these verbs writes to it.
 */
export function useTransitionTask() {
  const queryClient = useQueryClient();
  const invalidate = useTaskInvalidation();

  return useMutation({
    mutationFn: ({
      taskId,
      transition,
      note,
    }: {
      taskId: string;
      transition: TaskTransition;
      note?: string;
    }) => transitionTask(taskId, transition, note),
    onSuccess: (_task, { taskId, transition }) => {
      toast.success(TRANSITION_TOAST[transition]);
      queryClient.invalidateQueries({ queryKey: taskReviewKeys.thread(taskId) });
      invalidate();
    },
    onError: (err: APIError) => {
      // The backend's refusal names the status the verb actually needs, which
      // beats anything generic this could say.
      toast.error(err.response?.data?.message ?? "Failed to update task");
    },
  });
}

/** Hands a task to a specific person, in any status. */
export function useAssignTask() {
  const invalidate = useTaskInvalidation();

  return useMutation({
    mutationFn: ({
      taskId,
      assignedToId,
      overrideRationale,
    }: {
      taskId: string;
      assignedToId: string;
      overrideRationale?: string;
    }) => assignTask(taskId, assignedToId, overrideRationale),
    onSuccess: () => {
      toast.success("Task assigned");
      invalidate();
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to assign task");
    },
  });
}
