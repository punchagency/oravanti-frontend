import { API } from "./index";
import type { TaskPriority, TaskSource, TaskStatus } from "./tasks";

/**
 * The two cross-entity task lists: the review queue, and one person's own tasks.
 *
 * There were four of these on four shapes — an intake review queue, a case
 * review queue, and a "my tasks" for each — over rows of the same table. Four
 * shapes meant four card components, and they had drifted: only one queue had a
 * Rejected tab, only one list showed the review thread. `source` picks which
 * side you are looking at; the row shape is the same either way, so one card
 * renders all four lists and the submitter sees what the reviewer sees.
 */

/** A person named on a task, as they stood when the row was read. */
export interface TaskQueuePerson {
  id: string;
  name: string | null;
}

export interface TaskQueueItem {
  id: string;
  source: TaskSource;
  title: string;
  description: string | null;
  /**
   * Staff-facing guidance, snapshotted from the template step. Same five fields
   * `Task` carries — the queues render them through the same component, so a
   * step read from someone's own queue says what it says on the case board.
   */
  purpose: string | null;
  guidance: string[];
  doneWhen: string | null;
  pitfalls: string | null;
  authority: string | null;
  status: TaskStatus;
  /** Intake stage or workflow phase — the display grouping, whichever side it came from. */
  phase: string | null;
  /** Only workflow steps belong to a module. */
  moduleName: string | null;
  orderIndex: number | null;
  priority: TaskPriority | null;
  dueDate: string | null;
  isRequired: boolean;
  /** Part of the locked template backbone — weakening it needs an `overrideRationale`. */
  isLocked: boolean;
  notes: string | null;

  createdAt: string;
  updatedAt: string;
  assignedAt: string | null;
  completedAt: string | null;
  timeTakenMs: number | null;

  assignedTo: (TaskQueuePerson & { role: string | null }) | null;
  assignedByName: string | null;
  /** Whoever last moved it into review — the person a reviewer replies to. */
  submittedBy: TaskQueuePerson | null;

  /** Populated for `source: "pipeline"`. */
  lead: { id: string; name: string | null; email: string | null; stage: string | null } | null;
  /** Populated for `source: "workflow"`. */
  case: { id: string; caseNumber: string | null; clientName: string | null } | null;

  /**
   * The feedback that put this row where it is, so a Rejected tab reads as a
   * list of things to fix rather than a list of titles. The full exchange is
   * `TaskReviewThread`; this is the one line worth showing before it opens.
   */
  latestRejection: { note: string | null; actorName: string | null; createdAt: string } | null;
}

/** Every status, whatever is being listed — these drive the tab badges. */
export type TaskCounts = Record<TaskStatus, number>;

export interface TaskQueueResult {
  items: TaskQueueItem[];
  counts: TaskCounts;
  pagination: { total: number; limit: number; offset: number; page: number };
}

export interface TaskQueueParams {
  source: TaskSource;
  /** Comma-separated. Omit for the endpoint's own default. */
  status?: string;
  page?: number;
  limit?: number;
}

async function fetchQueue(path: string, params: TaskQueueParams): Promise<TaskQueueResult> {
  const { data } = await API.get(path, { params });
  return { items: data.data, counts: data.counts, pagination: data.pagination };
}

/** Tasks waiting on, or already through, review. Defaults to in review + rejected + approved. */
export function getReviewQueue(params: TaskQueueParams): Promise<TaskQueueResult> {
  return fetchQueue("/tasks/review-queue", params);
}

/** The caller's own tasks. No status filter by default — the tabs narrow it. */
export function getMyTasks(params: TaskQueueParams): Promise<TaskQueueResult> {
  return fetchQueue("/tasks/my-tasks", params);
}
