import { describe, expect, it } from "vitest";
import type { WorkflowTemplate, WorkflowTemplateModule } from "@/api/workflows";
import {
  fieldsReferencedBy,
  templateMilestones,
  visibilityFor,
} from "./case-type-fields";

/*
  What each case type is allowed to show.

  An N-400 and an I-485 are both Immigration and read the same extension table.
  Keyed on the practice area, the panel showed the union of both, so a
  naturalization matter carried a preference category, a priority date and an
  I-864 sponsor block, and an adjustment matter carried an LPR/eligibility date.

  The fixtures below are the shape of the three seeded immigration templates —
  in particular the N-400's, which branches on nothing at all and is the reason
  this reads due-date anchors as well as conditions.
*/

const mod = (over: Partial<WorkflowTemplateModule>): WorkflowTemplateModule => ({
  id: "m",
  templateId: "t",
  name: "Module",
  description: null,
  phase: "intake",
  orderIndex: 0,
  activationType: "auto",
  activationCondition: null,
  assignableRoles: [],
  steps: [],
  ...over,
});

const step = (dueDateAnchor: string | null) => ({
  id: "s",
  moduleId: "m",
  title: "Step",
  description: null,
  orderIndex: 0,
  isRequired: true,
  isLocked: false,
  dueDateAnchor,
  dueDateOffsetDays: null,
  requiredCertifications: [],
  assignableRoles: [],
});

const template = (modules: WorkflowTemplateModule[]): WorkflowTemplate => ({
  id: "t",
  name: "Template",
  caseTypeId: "ct",
  organizationId: null,
  isActive: true,
  modules,
});

/** The shape of the seeded family-based AOS template. */
const AOS = template([
  mod({
    name: "AOS Package Assembly",
    activationType: "conditional",
    activationCondition: {
      anyOf: [
        { field: "immigrationDetails.filingTrack", op: "eq", value: "concurrent" },
        { field: "immigrationDetails.priorityDateIsCurrent", op: "eq", value: true },
      ],
    },
    steps: [step("receipt_date"), step("interview_scheduled_date")],
  }),
  mod({
    name: "I-751 Removal of Conditions",
    activationType: "conditional",
    activationCondition: {
      field: "immigrationDetails.isConditionalResidence",
      op: "eq",
      value: true,
    },
    steps: [step("green_card_expiration_date")],
  }),
]);

/** The shape of the seeded N-400 template: no conditions anywhere. */
const N400 = template([
  mod({ name: "Filing", steps: [step("receipt_date"), step("biometrics_appointment")] }),
  mod({ name: "Oath", steps: [step("oath_ceremony_date")] }),
]);

/** The shape of the seeded mandamus template: no conditions, no milestones. */
const MANDAMUS = template([
  mod({ name: "Complaint", steps: [step("filed_date"), step("service_completed_date")] }),
  mod({ name: "Ruling", steps: [step("ruling_date")] }),
]);

describe("an adjustment matter shows adjustment fields", () => {
  it("shows the filing-track and priority-date group", () => {
    expect(visibilityFor(AOS).adjustment).toBe(true);
  });

  it("shows the I-751 flag, which its own module gates on", () => {
    expect(visibilityFor(AOS).conditionalResidence).toBe(true);
  });

  it("does not show naturalization fields", () => {
    // An adjustment matter has no naturalization track and no LPR date.
    expect(visibilityFor(AOS).naturalization).toBe(false);
  });

  it("shows the milestone timeline its deadlines count from", () => {
    expect(visibilityFor(AOS).milestones).toBe(true);
  });
});

describe("a naturalization matter shows naturalization fields", () => {
  it("shows them even though the template branches on nothing", () => {
    // The whole reason anchors are read as well as conditions. Every N-400
    // module is unconditional, so a conditions-only rule would hide the
    // naturalization fields on the one case type they exist for.
    expect(visibilityFor(N400).naturalization).toBe(true);
  });

  it("does not show the adjustment group", () => {
    // No petitioner, no preference category, no priority date, and none of the
    // I-864 sponsor block. This is the mixing the split exists to stop.
    expect(visibilityFor(N400).adjustment).toBe(false);
  });

  it("does not show the I-751 flag", () => {
    expect(visibilityFor(N400).conditionalResidence).toBe(false);
  });

  it("still shows the milestone timeline", () => {
    // It has receipts, biometrics and interviews like any USCIS filing.
    expect(visibilityFor(N400).milestones).toBe(true);
  });
});

describe("a mandamus matter shows almost nothing", () => {
  it("shows no practice-area-specific group", () => {
    const show = visibilityFor(MANDAMUS);

    expect(show.adjustment).toBe(false);
    expect(show.naturalization).toBe(false);
    expect(show.conditionalResidence).toBe(false);
  });

  it("shows no milestone timeline, because it counts from court dates", () => {
    // `filed_date`, `service_completed_date` and `ruling_date` are not USCIS
    // notice milestones, so there is nothing for the recorder to record.
    expect(visibilityFor(MANDAMUS).milestones).toBe(false);
  });
});

describe("a case type with no workflow at all", () => {
  it("is reported as untemplated rather than as an adjustment matter", () => {
    // Most of the ~90 immigration case types. The panel falls back to the
    // fields true of any USCIS filing rather than guessing at a workflow.
    const show = visibilityFor(null);

    expect(show.untemplated).toBe(true);
    expect(show.adjustment).toBe(false);
    expect(show.naturalization).toBe(false);
    expect(show.conditionalResidence).toBe(false);
    expect(show.milestones).toBe(false);
  });

  it("treats a still-loading template the same way", () => {
    expect(visibilityFor(undefined).untemplated).toBe(true);
  });

  it("is not claimed for a template that does exist", () => {
    expect(visibilityFor(N400).untemplated).toBe(false);
  });
});

describe("a mandamus matter is recognised as one", () => {
  it("is flagged by its court anchors", () => {
    expect(visibilityFor(MANDAMUS).mandamus).toBe(true);
  });

  it("is not flagged for an adjustment or naturalization matter", () => {
    // Which is what keeps the candidacy card on a stalled I-485 — it belongs
    // there — while keeping it off the mandamus matter that answers it.
    expect(visibilityFor(AOS).mandamus).toBe(false);
    expect(visibilityFor(N400).mandamus).toBe(false);
  });
});

describe("reading the fields a condition consults", () => {
  it("reads through anyOf rather than off the top level", () => {
    // The AOS gate is a composite. `.field` on it is undefined, which would
    // silently hide the adjustment group on every adjustment matter.
    expect(
      fieldsReferencedBy({
        anyOf: [
          { field: "immigrationDetails.filingTrack", op: "eq", value: "concurrent" },
          { field: "immigrationDetails.priorityDateIsCurrent", op: "eq", value: true },
        ],
      }),
    ).toStrictEqual([
      "immigrationDetails.filingTrack",
      "immigrationDetails.priorityDateIsCurrent",
    ]);
  });

  it("returns an empty array for no condition, not [undefined]", () => {
    expect(fieldsReferencedBy(null)).toStrictEqual([]);
  });
});

describe("the milestones a template schedules from", () => {
  it("lists only anchors that are recordable milestones", () => {
    // `filed_date` and `case_opened` are dates the system already knows; they
    // are not notices anyone transcribes off a USCIS letter.
    expect([...templateMilestones(N400)].sort()).toStrictEqual([
      "biometrics_appointment",
      "receipt",
    ]);
  });

  it("is empty for a template that anchors only on court dates", () => {
    expect(templateMilestones(MANDAMUS).size).toBe(0);
  });
});
