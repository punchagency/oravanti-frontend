import {
  getCaseStepReviewThread,
  getLeadTaskReviewThread,
  reopenCaseStep,
  reopenLeadTask,
  type TaskReviewEvent,
} from "@/api/task-review";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { APIError } from "./types";

export type TaskKind = "lead_task" | "case_step";

export const taskReviewKeys = {
  thread: (kind: TaskKind, parentId: string, taskId: string) =>
    ["taskReviewThread", kind, parentId, taskId] as const,
};

/**
 * A task's review thread, fetched lazily.
 *
 * Threads are only opened for one task at a time, so `enabled` keeps the other
 * rows on a list screen from each firing a request.
 */
export function useTaskReviewThread(
  kind: TaskKind,
  parentId: string,
  taskId: string,
  enabled = true,
) {
  return useQuery<TaskReviewEvent[]>({
    queryKey: taskReviewKeys.thread(kind, parentId, taskId),
    queryFn: () =>
      kind === "lead_task"
        ? getLeadTaskReviewThread(parentId, taskId)
        : getCaseStepReviewThread(parentId, taskId),
    enabled: enabled && Boolean(parentId) && Boolean(taskId),
  });
}

/**
 * Puts a rejected task back into the assignee's hands.
 *
 * Rejection is terminal until this runs, so the assignee sees the feedback
 * before the task quietly becomes work-in-progress again.
 */
export function useReopenTask(kind: TaskKind, parentId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, notes }: { taskId: string; notes?: string }) =>
      kind === "lead_task"
        ? reopenLeadTask(parentId, taskId, notes)
        : reopenCaseStep(parentId, taskId, notes),
    onSuccess: (_data, { taskId }) => {
      qc.invalidateQueries({
        queryKey: taskReviewKeys.thread(kind, parentId, taskId),
      });
      if (kind === "lead_task") {
        qc.invalidateQueries({ queryKey: ["leadTasks", parentId] });
        qc.invalidateQueries({ queryKey: ["myLeadTasks"] });
        qc.invalidateQueries({ queryKey: ["leadReviewQueue"] });
      } else {
        qc.invalidateQueries({ queryKey: ["caseWorkflow", parentId] });
        qc.invalidateQueries({ queryKey: ["myTasks"] });
        qc.invalidateQueries({ queryKey: ["reviewQueue"] });
      }
      toast.success("Task reopened");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to reopen task");
    },
  });
}
