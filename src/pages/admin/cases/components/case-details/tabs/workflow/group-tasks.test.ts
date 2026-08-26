import { describe, expect, it } from "vitest";
import type { Task } from "@/api/tasks";
import type { WorkflowTemplate, WorkflowTemplateModule } from "@/api/workflows";
import { groupTasksByPhase } from "./group-tasks";

/*
  Conditional-module visibility.

  A conditional module whose condition is false has no tasks — it is invisible
  in the task list by construction. The tab is only able to show it as "not yet
  unlocked" by comparing the task list against the template, and getting that
  comparison wrong fails silently in the worst way: a module that hasn't
  activated looks identical to one that doesn't exist.
*/

const step = (id: string) => ({
  id,
  moduleId: "m",
  title: id,
  description: null,
  orderIndex: 1,
  isRequired: true,
  isLocked: false,
  dueDateAnchor: null,
  dueDateOffsetDays: null,
  requiredCertifications: [],
  assignableRoles: [],
});

const moduleOf = (
  overrides: Partial<WorkflowTemplateModule> & { id: string; phase: string },
): WorkflowTemplateModule => ({
  templateId: "t",
  name: overrides.id,
  description: null,
  orderIndex: 1,
  activationType: "auto",
  activationCondition: null,
  assignableRoles: [],
  steps: [],
  ...overrides,
});

const taskOf = (overrides: Partial<Task> & { id: string }): Task => ({
  title: overrides.id,
  description: null,
  purpose: null,
  guidance: [],
  doneWhen: null,
  pitfalls: null,
  authority: null,
  teamId: null,
  dueDate: null,
  priority: null,
  status: "pending",
  requiredCertifications: [],
  source: "workflow",
  phase: null,
  orderIndex: null,
  isRequired: true,
  isLocked: false,
  workflowTemplateStepId: null,
  leadId: null,
  notes: null,
  overrideRationale: null,
  createdAt: "",
  updatedAt: "",
  case: { id: null, caseNumber: null, caseType: null },
  client: { id: null, name: "" },
  assignedTo: null,
  assignedBy: null,
  ...overrides,
});

const templateOf = (modules: WorkflowTemplateModule[]): WorkflowTemplate => ({
  id: "t",
  name: "T",
  caseTypeId: "ct",
  organizationId: null,
  isActive: true,
  modules,
});

describe("groupTasksByPhase", () => {
  it("groups by the task's phase, not by module", () => {
    const groups = groupTasksByPhase(
      [
        taskOf({ id: "a", phase: "Investigation" }),
        taskOf({ id: "b", phase: "Litigation" }),
        taskOf({ id: "c", phase: "Investigation" }),
      ],
      templateOf([
        moduleOf({ id: "m1", phase: "Investigation" }),
        moduleOf({ id: "m2", phase: "Litigation" }),
      ]),
    );

    expect(groups.map((g) => g.phase)).toEqual(["Investigation", "Litigation"]);
    expect(groups[0].tasks.map((t) => t.id)).toEqual(["a", "c"]);
  });

  it("orders phases by the template, not alphabetically", () => {
    // "Investigation" sorts after "Discovery" but comes first in the workflow.
    const groups = groupTasksByPhase(
      [taskOf({ id: "a", phase: "Discovery" }), taskOf({ id: "b", phase: "Investigation" })],
      templateOf([
        moduleOf({ id: "m1", phase: "Investigation" }),
        moduleOf({ id: "m2", phase: "Discovery" }),
      ]),
    );

    expect(groups.map((g) => g.phase)).toEqual(["Investigation", "Discovery"]);
  });

  it("shows a conditional module with no materialized steps as pending", () => {
    const groups = groupTasksByPhase(
      [],
      templateOf([
        moduleOf({
          id: "gov-notice",
          phase: "Pre-Litigation",
          activationType: "conditional",
          activationCondition: {
            field: "personalInjuryDetails.defendantType",
            op: "eq",
            value: "government_entity",
          },
          steps: [step("s1")],
        }),
      ]),
    );

    expect(groups).toHaveLength(1);
    expect(groups[0].pendingModules.map((m) => m.id)).toEqual(["gov-notice"]);
  });

  it("stops showing it as pending once its steps exist", () => {
    // The condition flipped, materialization ran, the tasks are here. The
    // module is now simply active — showing "unlocks when..." beside its own
    // live tasks would be nonsense.
    const groups = groupTasksByPhase(
      [taskOf({ id: "a", phase: "Pre-Litigation", workflowTemplateStepId: "s1" })],
      templateOf([
        moduleOf({
          id: "gov-notice",
          phase: "Pre-Litigation",
          activationType: "conditional",
          steps: [step("s1")],
        }),
      ]),
    );

    expect(groups[0].pendingModules).toEqual([]);
    expect(groups[0].tasks).toHaveLength(1);
  });

  it("treats a partially materialized module as active, not pending", () => {
    const groups = groupTasksByPhase(
      [taskOf({ id: "a", phase: "Trial", workflowTemplateStepId: "s1" })],
      templateOf([
        moduleOf({
          id: "trial",
          phase: "Trial",
          activationType: "manual",
          steps: [step("s1"), step("s2")],
        }),
      ]),
    );

    expect(groups[0].pendingModules).toEqual([]);
  });

  it("never lists an auto module as pending", () => {
    // An auto module with no tasks means materialization hasn't run yet, not
    // that something is waiting on a decision. Announcing it as locked would
    // be a lie.
    const groups = groupTasksByPhase(
      [],
      templateOf([moduleOf({ id: "intake", phase: "Intake", steps: [step("s1")] })]),
    );

    expect(groups).toEqual([]);
  });

  it("keeps ad-hoc tasks with no phase, in their own group at the end", () => {
    const groups = groupTasksByPhase(
      [
        taskOf({ id: "adhoc", source: "ad_hoc", phase: null }),
        taskOf({ id: "step", phase: "Intake" }),
      ],
      templateOf([moduleOf({ id: "m1", phase: "Intake" })]),
    );

    expect(groups.map((g) => g.phase)).toEqual(["Intake", "Other tasks"]);
  });

  it("survives a module with no steps array", () => {
    // Regression: the template endpoint used to return `{template, modules,
    // steps}` with steps as a sibling array, so every module arrived without a
    // `steps` key and the whole tab died on "mod.steps is not iterable". The
    // API returns a tree now, but a client running against an older deployment
    // must degrade rather than crash.
    const legacyModule = {
      id: "m1",
      phase: "Intake",
      activationType: "manual",
    } as unknown as WorkflowTemplateModule;

    expect(() =>
      groupTasksByPhase([taskOf({ id: "a", phase: "Intake" })], templateOf([legacyModule])),
    ).not.toThrow();

    const groups = groupTasksByPhase(
      [taskOf({ id: "a", phase: "Intake" })],
      templateOf([legacyModule]),
    );
    expect(groups[0].tasks).toHaveLength(1);
  });

  it("renders tasks even with no template at all", () => {
    // A case type with no seeded template still has whatever ad-hoc tasks
    // someone put on it. Losing them because the template 404s would be worse
    // than the missing template.
    const groups = groupTasksByPhase([taskOf({ id: "a", phase: "Intake" })], undefined);

    expect(groups).toHaveLength(1);
    expect(groups[0].tasks).toHaveLength(1);
  });
});
