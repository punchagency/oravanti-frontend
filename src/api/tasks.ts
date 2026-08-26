import { API } from "./index";

/**
 * The one task surface.
 *
 * Replaces three separate call sites — generic tasks, lead tasks, and case
 * workflow steps — that mirrored the three backend tables now consolidated into
 * one `tasks` table. A task is the same shape wherever it came from; `source`
 * says where, and `caseId`/`leadId` say what it hangs off.
 */

export type TaskSource = "workflow" | "pipeline" | "ad_hoc";

export type TaskStatus =
  | "pending"
  | "in_progress"
  | "in_review"
  | "completed"
  | "skipped"
  | "rejected"
  | "cancelled";

export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  teamId: string | null;
  dueDate: string | null;
  priority: TaskPriority | null;
  status: TaskStatus;
  requiredCertifications: string[];

  source: TaskSource;
  /** Denormalized display grouping. Survives for ad-hoc tasks, which have no module. */
  phase: string | null;
  orderIndex: number | null;
  isRequired: boolean;
  /** Part of the locked template backbone — weakening it needs an `overrideRationale`. */
  isLocked: boolean;
  /** Set only for `source: "workflow"`. Maps the task back to its template step. */
  workflowTemplateStepId: string | null;
  leadId: string | null;
  notes: string | null;
  overrideRationale: string | null;

  createdAt: string;
  updatedAt: string;
  case: { id: string | null; caseNumber: string | null; caseType: string | null };
  client: { id: string | null; name: string };
  assignedTo: { id: string; name: string; role: string } | null;
  assignedBy: { name: string } | null;
}

export interface TaskFilters {
  caseId?: string;
  leadId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToId?: string;
  source?: TaskSource;
  search?: string;
}

export interface CreateTaskParams {
  title: string;
  description?: string;
  caseId?: string;
  leadId?: string;
  assignedToId?: string;
  dueDate?: string;
  priority?: TaskPriority;
}

export interface UpdateTaskParams {
  title?: string;
  description?: string;
  assignedToId?: string;
  dueDate?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  notes?: string | null;
  requiredCertifications?: string[];
  /**
   * Required when the task `isLocked` and the change touches its due date,
   * required certifications, or marks it skipped/cancelled. The backend
   * rejects such a change without one — see `lockedOverrideViolation`.
   */
  overrideRationale?: string;
}

export interface TaskStats {
  active: number;
  completedThisWeek: number;
  overdue: number;
}

export async function getTasks(filters: TaskFilters = {}): Promise<Task[]> {
  const { data } = await API.get<{ data: Task[] }>("/tasks", { params: filters });
  return data.data;
}

export async function getTaskById(taskId: string): Promise<Task> {
  const { data } = await API.get<{ data: Task }>(`/tasks/${taskId}`);
  return data.data;
}

export async function getTaskStats(): Promise<TaskStats> {
  const { data } = await API.get<{ data: TaskStats }>("/tasks/stats");
  return data.data;
}

export async function createTask(params: CreateTaskParams): Promise<Task> {
  const { data } = await API.post<{ data: Task }>("/tasks", params);
  return data.data;
}

export async function updateTask(taskId: string, params: UpdateTaskParams): Promise<Task> {
  const { data } = await API.patch<{ data: Task }>(`/tasks/${taskId}`, params);
  return data.data;
}

export async function deleteTask(taskId: string): Promise<void> {
  await API.delete(`/tasks/${taskId}`);
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────

/**
 * The verbs a task moves through, whatever it hangs off.
 *
 * These replace the two parallel sets that existed before — `/leads/:id/tasks/*`
 * for intake steps and the case-step endpoints for workflow steps — which ran
 * the same loop against the same table. The route no longer names the source;
 * the backend dispatches on it and still writes the case or lead timeline the
 * task belongs to.
 */
export type TaskTransition = "complete" | "submit-review" | "approve" | "reject" | "reopen";

/**
 * @param note What the actor wants recorded on the task's review thread.
 *   Required for `reject` — it is the feedback the assignee acts on, and the
 *   backend refuses a rejection without it.
 */
export async function transitionTask(
  taskId: string,
  transition: TaskTransition,
  note?: string,
): Promise<Task> {
  const { data } = await API.post<{ data: Task }>(`/tasks/${taskId}/${transition}`, { note });
  return data.data;
}

/** Someone a task may be handed to. */
export interface AssignableStaff {
  id: string;
  name: string;
  role: string | null;
}

/**
 * Everyone this task may be handed to.
 *
 * A case task draws from the team the case is assigned to and nowhere else — a
 * firm that has committed a matter to a team does not route that matter's work
 * outside it. An intake step hangs off a lead, which has no team, so it draws
 * from the firm. The list is short enough to send whole rather than search.
 */
export async function getAssignableStaff(taskId: string): Promise<AssignableStaff[]> {
  const { data } = await API.get<{ data: AssignableStaff[] }>(
    `/tasks/${taskId}/assignable-staff`,
  );
  return data.data;
}

export async function assignTask(
  taskId: string,
  assignedToId: string,
  /** Required to reassign a locked workflow step. */
  overrideRationale?: string,
): Promise<Task> {
  const { data } = await API.patch<{ data: Task }>(`/tasks/${taskId}/assign`, {
    assignedToId,
    overrideRationale,
  });
  return data.data;
}
