import { API } from ".";

/**
 * The review thread shared by intake tasks and case workflow steps.
 *
 * Both run the same submit → review → approve/reject → reopen loop, and both
 * used to write every note into the task's single `notes` column, where each
 * stage overwrote the one before it. The backend appends to
 * `task_review_events` instead, and both domains read it back through this
 * shape.
 */

export type TaskReviewAction =
  | "submitted"
  | "approved"
  | "rejected"
  | "reopened"
  | "assigned";

export interface TaskReviewEvent {
  id: string;
  action: TaskReviewAction;
  note: string | null;
  actorId: string | null;
  actorName: string | null;
  createdAt: string;
}

export async function getLeadTaskReviewThread(
  leadId: string,
  taskId: string,
): Promise<TaskReviewEvent[]> {
  const { data } = await API.get<{ data: TaskReviewEvent[] }>(
    `/leads/${leadId}/tasks/${taskId}/review-thread`,
  );
  return data.data;
}

export async function getCaseStepReviewThread(
  caseId: string,
  stepId: string,
): Promise<TaskReviewEvent[]> {
  const { data } = await API.get<{ data: TaskReviewEvent[] }>(
    `/cases/${caseId}/workflow/steps/${stepId}/review-thread`,
  );
  return data.data;
}

export async function reopenLeadTask(
  leadId: string,
  taskId: string,
  notes?: string,
): Promise<void> {
  await API.post(`/leads/${leadId}/tasks/${taskId}/reopen`, { notes });
}

export async function reopenCaseStep(
  caseId: string,
  stepId: string,
  notes?: string,
): Promise<void> {
  await API.post(`/cases/${caseId}/workflow/steps/${stepId}/reopen`, { notes });
}

/** Most recent rejection feedback, for showing inline on a rejected task. */
export function latestRejection(
  events: TaskReviewEvent[] | undefined,
): TaskReviewEvent | null {
  if (!events) return null;
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].action === "rejected") return events[i];
  }
  return null;
}
