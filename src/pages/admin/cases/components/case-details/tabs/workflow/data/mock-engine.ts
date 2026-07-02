import type {
  CaseModuleInstance,
  CaseStepInstance,
  CaseWorkflowInstance,
  StaffCertification,
  TimelineEvent,
} from "../types";
import { piTemplate } from "./pi-template";
import { mockStaffList } from "./mock-staff";

// ---------------------------------------------------------------------------
// In-memory workflow instance store
// ---------------------------------------------------------------------------

const workflowInstances = new Map<string, CaseWorkflowInstance>();

// ---------------------------------------------------------------------------
// Timeline event store
// ---------------------------------------------------------------------------

let timelineEventCounter = 0;
const timelineEventsStore = new Map<string, TimelineEvent[]>();

/** Initialises the timeline store for a case if not already present */
function ensureTimelineStore(caseId: string): TimelineEvent[] {
  if (!timelineEventsStore.has(caseId)) {
    timelineEventsStore.set(caseId, []);
  }
  return timelineEventsStore.get(caseId)!;
}

/** Pushes a new timeline event and returns it */
function pushTimelineEvent(
  caseId: string,
  eventType: TimelineEvent["eventType"],
  title: string,
  description: string | null,
  metadata: Record<string, unknown> | null,
  createdBy: { id: string; name: string } | null,
): TimelineEvent {
  const events = ensureTimelineStore(caseId);
  const event: TimelineEvent = {
    id: `tl-${++timelineEventCounter}`,
    eventType,
    title,
    description,
    metadata,
    createdBy,
    createdAt: new Date().toISOString(),
  };
  events.push(event);
  return event;
}

/** Resolves the module name for a given moduleId from the template */
function getModuleName(moduleId: string): string {
  const mod = piTemplate.modules.find((m) => m.moduleId === moduleId);
  return mod?.name ?? moduleId;
}

/** Resolves the step title for a given stepId from the template */
function getStepTitle(stepId: string): string {
  for (const mod of piTemplate.modules) {
    const step = mod.steps.find((s) => s.stepId === stepId);
    if (step) return step.title;
  }
  return stepId;
}

/** Resolves the moduleId for a given stepId from the template */
function getModuleIdForStep(stepId: string): string | null {
  for (const mod of piTemplate.modules) {
    if (mod.steps.some((s) => s.stepId === stepId)) return mod.moduleId;
  }
  return null;
}

/** Resolves the template step definition for a given stepId */
function getTemplateStep(stepId: string): import("../types").WorkflowStep | null {
  for (const mod of piTemplate.modules) {
    const step = mod.steps.find((s) => s.stepId === stepId);
    if (step) return step;
  }
  return null;
}

/** Calculates the due date as now + durationDays (in business-day approximation) */
function calculateDueDate(durationDays: number): string {
  const now = new Date();
  // Simple approximation: multiply by 1.4 to account for weekends
  const totalDays = Math.ceil(durationDays * 1.4);
  now.setDate(now.getDate() + totalDays);
  return now.toISOString();
}

/** Formats a duration in milliseconds to a human-readable string (e.g. "2d 3h", "45m") */
function formatTimeTaken(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours < 24) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

/** Calculates the time taken between assignedAt and completedAt */
function getTimeTaken(step: CaseStepInstance): { ms: number; label: string } | null {
  if (!step.assignedAt || !step.completedAt) return null;
  const ms = new Date(step.completedAt).getTime() - new Date(step.assignedAt).getTime();
  if (ms < 0) return null;
  return { ms, label: formatTimeTaken(ms) };
}

/** Sets assignment metadata (assignedAt + dueDate) on a step based on its template definition */
function setStepAssignmentTimes(step: CaseStepInstance): void {
  step.assignedAt = new Date().toISOString();
  const templateStep = getTemplateStep(step.stepId);
  if (templateStep) {
    step.dueDate = calculateDueDate(templateStep.defaultDurationDays);
  }
}

// ---------------------------------------------------------------------------
// Instance helpers
// ---------------------------------------------------------------------------

/** Convenience type for the role names used in mock data */
type CaseStaff = { id: string; name: string; role: string };

/** Resolves the staff display info by ID, or null if not found */
function resolveStaff(staffId: string): CaseStaff | null {
  const staff = mockStaffList.find((s) => s.id === staffId);
  return staff ? { id: staff.id, name: staff.name, role: staff.role } : null;
}

/** Create a fresh CaseStepInstance from a WorkflowStep definition */
function createStepInstance(templateStep: {
  stepId: string;
}): CaseStepInstance {
  return {
    stepId: templateStep.stepId,
    status: "not_started",
    assignedTo: null,
    assignedAt: null,
    dueDate: null,
    completedAt: null,
    completedBy: null,
    overrideRationale: null,
    notes: "",
  };
}

/** Build the full CaseModuleInstance array from the template, marking the first module active */
function buildInitialModules(): CaseModuleInstance[] {
  return piTemplate.modules.map((moduleTemplate, moduleIndex) => {
    const isFirstModule = moduleIndex === 0;

    const steps: CaseStepInstance[] = moduleTemplate.steps.map(
      (stepTemplate, stepIndex) => {
        const isFirstStepOfFirstModule = isFirstModule && stepIndex === 0;
        return {
          ...createStepInstance(stepTemplate),
          status: isFirstStepOfFirstModule ? "in_progress" : "not_started",
        };
      },
    );

    return {
      moduleId: moduleTemplate.moduleId,
      status: isFirstModule
        ? "active"
        : "locked",
      steps,
    };
  });
}

/** Count completed steps across all modules */
function countCompletedSteps(modules: CaseModuleInstance[]): number {
  let count = 0;
  for (const module of modules) {
    for (const step of module.steps) {
      if (step.status === "complete") count++;
    }
  }
  return count;
}

/** Count total steps across all modules */
function countTotalSteps(modules: CaseModuleInstance[]): number {
  let count = 0;
  for (const module of modules) {
    count += module.steps.length;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Public API — used by hooks.ts
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Auto-assignment
// ---------------------------------------------------------------------------

/** Count how many in-progress steps a staff member is currently assigned to. */
function countStaffAssignments(
  modules: CaseModuleInstance[],
  staffId: string,
): number {
  let count = 0;
  for (const mod of modules) {
    for (const step of mod.steps) {
      if (step.assignedTo?.id === staffId && step.status === "in_progress") {
        count++;
      }
    }
  }
  return count;
}

/**
 * Picks the best eligible staff member for a step and assigns them.
 *
 * Selection strategy (in priority order):
 *  1. Must be active and have the required certification
 *  2. Prefer the staff member with the fewest currently assigned steps
 *
 * Returns true if a staff member was assigned, false if none are eligible.
 */
function autoAssignStep(
  caseId: string,
  step: CaseStepInstance,
  requiredCertification: string | null,
  modules: CaseModuleInstance[],
): boolean {
  if (step.assignedTo) return false; // already assigned

  const eligible = mockStaffList
    .filter((s) => s.active && (requiredCertification === null || s.certifications.includes(requiredCertification)))
    .sort((a, b) => countStaffAssignments(modules, a.id) - countStaffAssignments(modules, b.id));

  if (eligible.length === 0) return false;

  const chosen = eligible[0];
  step.assignedTo = { id: chosen.id, name: chosen.name, role: chosen.role };
  step.status = "in_progress";
  setStepAssignmentTimes(step);

  const stepTitle = getStepTitle(step.stepId);
  const moduleId = getModuleIdForStep(step.stepId);
  const moduleName = moduleId ? getModuleName(moduleId) : null;

  pushTimelineEvent(
    caseId,
    "step_assigned",
    `Step auto-assigned: ${stepTitle}`,
    `Auto-assigned to ${chosen.name} (${chosen.role})`,
    {
      stepId: step.stepId,
      stepTitle,
      moduleId,
      moduleName,
      staffId: chosen.id,
      staffName: chosen.name,
      staffRole: chosen.role,
      autoAssigned: true,
      dueDate: step.dueDate,
    },
    null,
  );

  return true;
}

/**
 * Retrieves or initialises the workflow instance for a given case.
 * If no instance exists yet, builds one from the PI template and stores it.
 */
export function getOrCreateCaseWorkflow(caseId: string): CaseWorkflowInstance {
  if (!workflowInstances.has(caseId)) {
    const now = new Date().toISOString();
    const freshInstance: CaseWorkflowInstance = {
      caseId,
      templateId: piTemplate.templateId,
      modules: buildInitialModules(),
      startedAt: now,
    };

    // Auto-assign the first step of the first module
    const firstModule = freshInstance.modules[0];
    if (firstModule && firstModule.steps.length > 0) {
      const firstStep = firstModule.steps[0];
      const templateStep = piTemplate.modules[0]?.steps[0];
      if (templateStep) {
        autoAssignStep(caseId, firstStep, templateStep.requiredCertification, freshInstance.modules);
      }
    }

    workflowInstances.set(caseId, freshInstance);

    // Seed the initial workflow timeline event
    const firstModuleDef = piTemplate.modules[0];
    pushTimelineEvent(
      caseId,
      "workflow_started",
      `Workflow started — ${piTemplate.name}`,
      `Template: ${piTemplate.templateId} | PI filing types: ${piTemplate.filingTypes.join(", ")}`,
      { templateId: piTemplate.templateId, templateName: piTemplate.name },
      null,
    );
    if (firstModuleDef) {
      pushTimelineEvent(
        caseId,
        "module_activated",
        `Module activated — ${firstModuleDef.name}`,
        `Phase: ${firstModuleDef.phase}`,
        { moduleId: firstModuleDef.moduleId, moduleName: firstModuleDef.name, phase: firstModuleDef.phase },
        null,
      );
    }
  }
  return structuredClone(workflowInstances.get(caseId)!);
}

/**
 * Returns a lightweight summary of workflow progress for the Overview tab.
 */
export function getWorkflowSummary(caseId: string): {
  templateName: string;
  totalSteps: number;
  completedSteps: number;
  percentage: number;
  currentModuleName: string | null;
  currentModuleId: string | null;
} {
  const instance = getOrCreateCaseWorkflow(caseId);
  const totalSteps = countTotalSteps(instance.modules);
  const completedSteps = countCompletedSteps(instance.modules);
  const percentage =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const activeModule = instance.modules.find((m) => m.status === "active");
  const templateModule = piTemplate.modules.find(
    (m) => m.moduleId === activeModule?.moduleId,
  );

  return {
    templateName: piTemplate.name,
    totalSteps,
    completedSteps,
    percentage,
    currentModuleName: templateModule?.name ?? null,
    currentModuleId: activeModule?.moduleId ?? null,
  };
}

/**
 * Returns the staff members who:
 *  - are active
 *  - have the given certification (or no certification is required)
 * Used by the assignment dropdown to enforce the certification gate.
 */
export function getEligibleStaff(
  requiredCertification: string | null,
): StaffCertification[] {
  return mockStaffList.filter((staff) => {
    if (!staff.active) return false;
    if (requiredCertification === null) return true;
    return staff.certifications.includes(requiredCertification);
  });
}

/**
 * Assigns a staff member to a step. Returns the updated instance.
 * Throws if the certification gate blocks assignment (caller should catch).
 *
 * If the step is already assigned to a different staff member, this is
 * treated as a reassignment: the previous assignee is replaced, any
 * completion data is cleared, and a "step_reassigned" timeline event is
 * recorded alongside the existing assignee info.
 */
export function assignStaffToStep(
  caseId: string,
  stepId: string,
  staffId: string,
  overrideRationale?: string,
): CaseWorkflowInstance {
  const instance = workflowInstances.get(caseId);
  if (!instance) throw new Error(`No workflow found for case ${caseId}`);

  const resolvedStaff = resolveStaff(staffId);
  if (!resolvedStaff) throw new Error(`Staff ${staffId} not found`);

  // Locate the step across all modules
  for (const module of instance.modules) {
    const step = module.steps.find((s) => s.stepId === stepId);
    if (step) {
      const isReassign = step.assignedTo !== null && step.assignedTo.id !== staffId;
      const previousStaff = isReassign ? step.assignedTo : null;

      step.assignedTo = resolvedStaff;
      step.status = "in_progress";
      setStepAssignmentTimes(step);

      // Clear completion data on reassignment
      if (isReassign) {
        step.completedAt = null;
        step.completedBy = null;
        step.notes = "";
      }

      if (overrideRationale) {
        step.overrideRationale = overrideRationale;
      }

      // Push timeline event
      const stepTitle = getStepTitle(stepId);
      const moduleId = getModuleIdForStep(stepId);
      const moduleName = moduleId ? getModuleName(moduleId) : null;

      if (isReassign) {
        pushTimelineEvent(
          caseId,
          "step_reassigned",
          `Step reassigned: ${stepTitle}`,
          previousStaff
            ? `Reassigned from ${previousStaff.name} to ${resolvedStaff.name} (${resolvedStaff.role})`
            : `Reassigned to ${resolvedStaff.name} (${resolvedStaff.role})`,
          {
            stepId,
            stepTitle,
            moduleId,
            moduleName,
            previousStaffId: previousStaff?.id ?? null,
            previousStaffName: previousStaff?.name ?? null,
            newStaffId: resolvedStaff.id,
            newStaffName: resolvedStaff.name,
            newStaffRole: resolvedStaff.role,
            overrideRationale: overrideRationale ?? null,
          },
          { id: resolvedStaff.id, name: resolvedStaff.name },
        );
      } else {
        pushTimelineEvent(
          caseId,
          overrideRationale ? "step_assigned_override" : "step_assigned",
          `Step assigned: ${stepTitle}`,
          overrideRationale
            ? `Assigned to ${resolvedStaff.name} (${resolvedStaff.role}) via attorney override — ${overrideRationale}`
            : `Assigned to ${resolvedStaff.name} (${resolvedStaff.role})`,
          {
            stepId,
            stepTitle,
            moduleId,
            moduleName,
            staffId: resolvedStaff.id,
            staffName: resolvedStaff.name,
            staffRole: resolvedStaff.role,
            overrideRationale: overrideRationale ?? null,
          },
          { id: resolvedStaff.id, name: resolvedStaff.name },
        );
      }

      // Persist and return clone
      workflowInstances.set(caseId, instance);
      return structuredClone(instance);
    }
  }

  throw new Error(`Step ${stepId} not found in workflow for case ${caseId}`);
}

/**
 * Marks a step as complete and cascades activation to the next step / module.
 * Returns the updated instance together with metadata about what was activated.
 */
export function completeStep(
  caseId: string,
  stepId: string,
  notes?: string,
  completedByOverride?: { id: string; name: string } | null,
): {
  instance: CaseWorkflowInstance;
  nextStepId: string | null;
  moduleCompleted: boolean;
  nextModuleId: string | null;
} {
  const instance = workflowInstances.get(caseId);
  if (!instance) throw new Error(`No workflow found for case ${caseId}`);

  let nextStepId: string | null = null;
  let moduleCompleted = false;
  let nextModuleId: string | null = null;

  // Iterate modules to find the step
  for (
    let moduleIndex = 0;
    moduleIndex < instance.modules.length;
    moduleIndex++
  ) {
    const module = instance.modules[moduleIndex];
    const stepIndex = module.steps.findIndex((s) => s.stepId === stepId);

    if (stepIndex === -1) continue;

    const step = module.steps[stepIndex];
    step.status = "complete";
    step.completedAt = new Date().toISOString();
    if (notes) step.notes = notes;

    // Determine who completed (use override if provided, otherwise the assigned staff)
    const completedBy = completedByOverride ?? step.completedBy ?? (step.assignedTo ? { id: step.assignedTo.id, name: step.assignedTo.name } : null);
    if (completedByOverride) step.completedBy = completedByOverride;

    // Push step completed event
    const stepTitle = getStepTitle(stepId);
    const moduleId = getModuleIdForStep(stepId);
    const moduleName = moduleId ? getModuleName(moduleId) : null;
    const timeTaken = getTimeTaken(step);
    const dueLabel = step.dueDate
      ? `Due: ${new Date(step.dueDate).toLocaleDateString()}`
      : null;
    pushTimelineEvent(
      caseId,
      "step_completed",
      timeTaken
        ? `Step completed: ${stepTitle} (${timeTaken.label})`
        : `Step completed: ${stepTitle}`,
      [notes ? `Completed by ${completedBy?.name ?? "Unknown"} — ${notes}` : `Completed by ${completedBy?.name ?? "Unknown"}`, dueLabel]
        .filter(Boolean)
        .join(" | "),
      {
        stepId,
        stepTitle,
        moduleId,
        moduleName,
        completedBy: completedBy?.id ?? null,
        completedByName: completedBy?.name ?? null,
        hasNotes: !!notes,
        notes: notes ?? null,
        assignedAt: step.assignedAt,
        completedAt: step.completedAt,
        timeTakenMs: timeTaken?.ms ?? null,
        timeTakenLabel: timeTaken?.label ?? null,
        dueDate: step.dueDate,
      },
      completedBy,
    );

    // Activate next step in the same module
    const nextStep = module.steps[stepIndex + 1];
    if (nextStep) {
      nextStep.status = "in_progress";
      nextStepId = nextStep.stepId;

      // Auto-assign the next step
      const templateMod = piTemplate.modules.find((m) => m.moduleId === moduleId);
      const templateStep = templateMod?.steps.find((s) => s.stepId === nextStep.stepId);
      if (templateStep) {
        autoAssignStep(caseId, nextStep, templateStep.requiredCertification, instance.modules);
      }

      // Push next step activation event
      const nextStepTitle = getStepTitle(nextStep.stepId);
      pushTimelineEvent(
        caseId,
        "step_activated",
        `Next step opened: ${nextStepTitle}`,
        `Auto-activated after completing "${stepTitle}"`,
        {
          stepId: nextStep.stepId,
          stepTitle: nextStepTitle,
          moduleId,
          moduleName,
          previousStepId: stepId,
          previousStepTitle: stepTitle,
        },
        null,
      );
    } else {
      // Module is fully complete
      module.status = "completed";
      moduleCompleted = true;

      // Push module completed event
      pushTimelineEvent(
        caseId,
        "module_completed",
        `Module completed: ${moduleName ?? moduleId}`,
        `All ${module.steps.length} steps are complete`,
        { moduleId, moduleName, phase: piTemplate.modules.find((m) => m.moduleId === moduleId)?.phase ?? null },
        null,
      );

      // Activate the next module
      const nextModule = instance.modules[moduleIndex + 1];
      if (nextModule && nextModule.status === "locked") {
        const templateModule = piTemplate.modules.find(
          (tm) => tm.moduleId === nextModule.moduleId,
        );
        if (!templateModule?.conditionalActivation) {
          nextModule.status = "active";
          if (nextModule.steps.length > 0) {
            nextModule.steps[0].status = "in_progress";
            const nextTemplateStep = templateModule?.steps[0];
            if (nextTemplateStep) {
              autoAssignStep(caseId, nextModule.steps[0], nextTemplateStep.requiredCertification, instance.modules);
            }
          }
          nextModuleId = nextModule.moduleId;

          // Push module activation event
          const nextModuleName = getModuleName(nextModule.moduleId);
          pushTimelineEvent(
            caseId,
            "module_activated",
            `Module activated: ${nextModuleName}`,
            `Auto-activated after completing "${moduleName ?? moduleId}"`,
            { moduleId: nextModule.moduleId, moduleName: nextModuleName, autoActivated: true },
            null,
          );
        }
      }
    }

    // Persist
    workflowInstances.set(caseId, instance);
    const cloned = structuredClone(instance);
    return { instance: cloned, nextStepId, moduleCompleted, nextModuleId };
  }

  throw new Error(`Step ${stepId} not found in workflow for case ${caseId}`);
}

/**
 * Manually triggers a conditionally-activated module (e.g. Litigation).
 */
export function manuallyTriggerModule(
  caseId: string,
  moduleId: string,
): CaseWorkflowInstance {
  const instance = workflowInstances.get(caseId);
  if (!instance) throw new Error(`No workflow found for case ${caseId}`);

  const module = instance.modules.find((m) => m.moduleId === moduleId);
  if (!module) throw new Error(`Module ${moduleId} not found`);

  module.status = "active";
  if (module.steps.length > 0 && module.steps[0].status === "not_started") {
    module.steps[0].status = "in_progress";
    const templateMod = piTemplate.modules.find((m) => m.moduleId === moduleId);
    const templateStep = templateMod?.steps[0];
    if (templateStep) {
      autoAssignStep(caseId, module.steps[0], templateStep.requiredCertification, instance.modules);
    }
  }

  const moduleName = getModuleName(moduleId);
  pushTimelineEvent(
    caseId,
    "module_activated",
    `Module activated: ${moduleName}`,
    "Manually triggered by attorney",
    { moduleId, moduleName, manualTrigger: true },
    null,
  );

  workflowInstances.set(caseId, instance);
  return structuredClone(instance);
}

/**
 * Returns the timeline events for a case, in chronological order.
 */
export function getCaseTimeline(caseId: string): TimelineEvent[] {
  if (!timelineEventsStore.has(caseId)) {
    // Ensure workflow is initialised so timeline store is seeded
    getOrCreateCaseWorkflow(caseId);
  }
  return structuredClone(timelineEventsStore.get(caseId) ?? []);
}

/**
 * Simulates an API delay to mimic network latency.
 */
export function simulateNetworkDelay(ms = 350): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
