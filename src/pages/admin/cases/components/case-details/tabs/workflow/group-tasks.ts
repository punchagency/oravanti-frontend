import type { Task } from "@/api/tasks";
import type { WorkflowTemplate, WorkflowTemplateModule } from "@/api/workflows";

/** Tasks with no phase — ad-hoc work, and anything from a template predating phases. */
export const UNPHASED = "Other tasks";

export interface PhaseGroup {
  phase: string;
  tasks: Task[];
  /** Modules in this phase whose steps haven't been created yet. */
  pendingModules: WorkflowTemplateModule[];
}

/**
 * A module's steps, tolerating their absence.
 *
 * The type says `steps` is always an array, and the API now guarantees it —
 * but a client running against an older deployment gets modules with no
 * `steps` key at all, and a bare `for (const s of mod.steps)` turns that into
 * a blank tab and a "not iterable" crash rather than a degraded render. Same
 * fall-through-gracefully rule the audit registry follows.
 */
export const stepsOf = (mod: WorkflowTemplateModule): WorkflowTemplateModule["steps"] =>
  mod.steps ?? [];

/**
 * Groups a case's tasks by `phase`, with the template's not-yet-materialized
 * modules alongside.
 *
 * Grouped by phase, not by module: a module is a template-time grouping that an
 * ad-hoc task doesn't have at all, while `phase` is denormalized onto every
 * task at materialization and is stable regardless of origin. Phase order comes
 * from the template so the tab reads in workflow order rather than
 * alphabetically; any phase the template doesn't name goes last.
 *
 * The pending-module half is the only way the UI can distinguish a conditional
 * module that hasn't unlocked from one that isn't in this template at all —
 * both have no tasks. Getting it wrong fails silently, which is why it has its
 * own tests.
 */
export function groupTasksByPhase(
  tasks: Task[],
  template: WorkflowTemplate | undefined,
): PhaseGroup[] {
  const materializedStepIds = new Set(
    tasks.map((t) => t.workflowTemplateStepId).filter(Boolean),
  );

  // A module counts as pending when NONE of its steps exist yet. A partially
  // materialized module is simply active — its remaining steps will appear.
  const pendingByPhase = new Map<string, WorkflowTemplateModule[]>();
  for (const mod of template?.modules ?? []) {
    // An `auto` module with no tasks means materialization hasn't run, not
    // that something is waiting on a decision — announcing it as locked would
    // be a lie.
    if (mod.activationType === "auto") continue;
    if (stepsOf(mod).some((s) => materializedStepIds.has(s.id))) continue;
    pendingByPhase.set(mod.phase, [...(pendingByPhase.get(mod.phase) ?? []), mod]);
  }

  const tasksByPhase = new Map<string, Task[]>();
  for (const task of tasks) {
    const phase = task.phase ?? UNPHASED;
    tasksByPhase.set(phase, [...(tasksByPhase.get(phase) ?? []), task]);
  }

  const templateOrder = [...new Set((template?.modules ?? []).map((m) => m.phase))];
  const extraPhases = [...tasksByPhase.keys()].filter((p) => !templateOrder.includes(p));

  return [...templateOrder, ...extraPhases]
    .map((phase) => ({
      phase,
      tasks: tasksByPhase.get(phase) ?? [],
      pendingModules: pendingByPhase.get(phase) ?? [],
    }))
    .filter((group) => group.tasks.length > 0 || group.pendingModules.length > 0);
}
