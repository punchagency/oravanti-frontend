import { getTaskReviewThread, type TaskReviewEvent } from "@/api/task-review";
import { useQuery } from "@tanstack/react-query";

export const taskReviewKeys = {
  thread: (taskId: string) => ["taskReviewThread", taskId] as const,
};

/**
 * A task's review thread, fetched lazily.
 *
 * Threads are only opened for one task at a time, so `enabled` keeps the other
 * rows on a list screen from each firing a request.
 *
 * No `kind` and no parent id: one endpoint serves intake steps and case steps,
 * and the backend derives which half of the thread to read from the task's own
 * `source`. Passing it from the client was a second place to get it wrong.
 */
export function useTaskReviewThread(taskId: string, enabled = true) {
  return useQuery<TaskReviewEvent[]>({
    queryKey: taskReviewKeys.thread(taskId),
    queryFn: () => getTaskReviewThread(taskId),
    enabled: enabled && Boolean(taskId),
  });
}
