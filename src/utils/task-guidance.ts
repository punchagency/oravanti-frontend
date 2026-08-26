/**
 * The staff-facing guidance a task carries, snapshotted from its template step.
 *
 * Declared structurally rather than against `Task` because the same five fields
 * arrive on two different shapes: `Task` from `/tasks`, and `TaskQueueItem`
 * from the my-tasks and review queues. Both render through the same component,
 * and neither should have to be converted to the other to do it.
 */
export interface TaskGuidanceFields {
  purpose: string | null;
  guidance: string[];
  doneWhen: string | null;
  pitfalls: string | null;
  authority: string | null;
}

/**
 * A task's guidance bullets, tolerating their absence.
 *
 * The type says `guidance` is always an array and the API now guarantees it —
 * but a client running against a deployment older than those columns gets a
 * task with no `guidance` key at all, and a bare `task.guidance.length` turns
 * that into a crashed workflow tab rather than a degraded render. Exactly the
 * case `stepsOf` guards in `group-tasks.ts`, and the same fall-through-
 * gracefully rule the audit registry follows.
 */
export const guidanceOf = (task: TaskGuidanceFields): string[] => task.guidance ?? [];

/**
 * Whether a task carries any staff-facing guidance worth rendering.
 *
 * Lives here rather than beside `TaskGuidance` so that component file exports
 * only components — the fast-refresh rule the lint config enforces. Callers
 * need this separately from the component because the disclosure control that
 * reveals the guidance should not appear on a task that has none.
 */
export function hasGuidance(task: TaskGuidanceFields): boolean {
  return Boolean(
    task.purpose ||
      guidanceOf(task).length > 0 ||
      task.doneWhen ||
      task.pitfalls ||
      task.authority,
  );
}
