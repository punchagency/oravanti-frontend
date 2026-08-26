import { describe, expect, it } from "vitest";
import type { Condition } from "@/api/workflows";
import { describeCondition, describeDueDate } from "./describe";

/*
  These two functions are the whole of what the workflow tab says about things
  that haven't happened yet — why a module hasn't unlocked, and what a blank due
  date is waiting on. Both are the difference between a paralegal understanding
  the screen and wondering what's broken, and neither is covered by tsc.
*/

describe("describeCondition", () => {
  it("describes the conditions the seeded templates actually use", () => {
    const cases: [Condition, string][] = [
      [
        { field: "personalInjuryDetails.defendantType", op: "eq", value: "government_entity" },
        "defendant type is government entity",
      ],
      [
        { field: "immigrationDetails.filingTrack", op: "eq", value: "concurrent" },
        "filing track is concurrent",
      ],
      [
        { field: "immigrationDetails.isConditionalResidence", op: "eq", value: true },
        "conditional residence is yes",
      ],
    ];

    for (const [condition, expected] of cases) {
      expect(describeCondition(condition)).toBe(expected);
    }
  });

  it("reads as English for neq and in", () => {
    expect(
      describeCondition({ field: "case.priority", op: "neq", value: "low" }),
    ).toBe("case priority is not low");

    expect(
      describeCondition({ field: "case.priority", op: "in", value: ["high", "critical"] }),
    ).toBe("case priority is one of high, critical");
  });

  it("joins groups with and / or", () => {
    expect(
      describeCondition({
        allOf: [
          { field: "case.priority", op: "eq", value: "high" },
          { field: "immigrationDetails.filingTrack", op: "eq", value: "concurrent" },
        ],
      }),
    ).toBe("case priority is high and filing track is concurrent");

    expect(
      describeCondition({
        anyOf: [
          { field: "personalInjuryDetails.isMinorPlaintiff", op: "eq", value: true },
          { field: "case.priority", op: "eq", value: "critical" },
        ],
      }),
    ).toBe("minor plaintiff is yes or case priority is critical");
  });

  it("degrades readably for a field this build has never seen", () => {
    // A case written by a newer deployment can carry a field added since. The
    // sentence must stay readable rather than rendering "undefined".
    const fromTheFuture = {
      field: "immigrationDetails.someNewFlag",
      op: "eq",
      value: "yes",
    } as unknown as Condition;

    expect(describeCondition(fromTheFuture)).toBe("some new flag is yes");
  });
});

describe("describeDueDate", () => {
  it("shows a real due date as-is", () => {
    expect(describeDueDate("2026-04-01", "mmi_date")).toEqual({
      text: "2026-04-01",
      isPending: false,
    });
  });

  it("names the milestone a blank due date is waiting on", () => {
    // The whole point: a blank date is not "nobody set a deadline", it is
    // "the anchor hasn't happened yet" — and saying which one makes it
    // actionable.
    expect(describeDueDate(null, "mmi_date")).toEqual({
      text: "Due once MMI is recorded",
      isPending: true,
    });

    expect(describeDueDate(null, "incident_date").text).toBe(
      "Due once the incident date is recorded",
    );
  });

  it("falls back to a de-snake-cased anchor it has never seen", () => {
    expect(describeDueDate(null, "some_future_anchor").text).toBe(
      "Due once some future anchor is recorded",
    );
  });

  it("says there is no due date when there is no anchor either", () => {
    // An ad-hoc task with no deadline. Not pending anything.
    expect(describeDueDate(null, null)).toEqual({ text: "No due date", isPending: false });
  });
});

describe("the AOS package gate reads as a sentence", () => {
  // The real shipped condition, not an invented one: both AOS package modules
  // open on either filing track, so a paralegal looking at a locked module on a
  // sequential matter needs to be told it is waiting on the priority date.
  it("explains an either/or gate", () => {
    expect(
      describeCondition({
        anyOf: [
          { field: "immigrationDetails.filingTrack", op: "eq", value: "concurrent" },
          { field: "immigrationDetails.priorityDateIsCurrent", op: "eq", value: true },
        ],
      }),
    ).toBe("filing track is concurrent or priority date current is yes");
  });
});
