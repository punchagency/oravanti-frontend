import { API } from ".";

/**
 * The review thread on a task — intake step, case workflow step, or ad-hoc
 * to-do alike.
 *
 * Both loops run submit → review → approve/reject → reopen, and both used to
 * write every note into the task's single `notes` column, where each stage
 * overwrote the one before it. Entries are appended to `audit_events` instead,
 * and one endpoint reads them back.
 *
 * `action` is a registry name — `"task.rejected"`, the same string the backend
 * call site used and the same string in the column. Render `label`; never
 * re-case the action into a display string, and always fall through for an
 * action written by a newer deployment. See `@/lib/audit`.
 */

export interface TaskReviewEvent {
  id: string;
  /** A registry action name, e.g. `"task.rejected"`. */
  action: string;
  /** The registry's label for that action, e.g. `"Rejected"`. */
  label: string;
  /** What the actor typed, or null when they said nothing. */
  note: string | null;
  /** The sentence written when the entry was recorded. */
  summary: string;
  actorId: string | null;
  /** The name as it stood then — never a live lookup. */
  actorName: string | null;
  createdAt: string;
}

export async function getTaskReviewThread(taskId: string): Promise<TaskReviewEvent[]> {
  const { data } = await API.get<{ data: TaskReviewEvent[] }>(
    `/tasks/${taskId}/review-thread`,
  );
  return data.data;
}

/** Most recent rejection feedback, for showing inline on a rejected task. */
export function latestRejection(
  events: TaskReviewEvent[] | undefined,
): TaskReviewEvent | null {
  if (!events) return null;
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].action === "task.rejected") return events[i];
  }
  return null;
}
