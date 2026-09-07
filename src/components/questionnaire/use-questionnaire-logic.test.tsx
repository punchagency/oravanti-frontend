import { renderHook } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it } from "vitest";

import type { LogicRule } from "@/lib/questionnaire/logic";
import { useDraftForm } from "./use-draft-form";
import { useQuestionnaireLogic } from "./use-questionnaire-logic";

/*
  `logic.ts` decides what a set of answers hides; this hook decides which
  answers those are — the saved ones, or the ones being typed right now. Both of
  its failures are silent:

  - reading only the saved answers leaves a branch shut until the client presses
    Save, so the questions they now need are behind a button they have no reason
    to press;
  - forgetting to withdraw leaves an answer the client took back sitting on the
    response, where nothing downstream will ever question it and
    `populateCaseForms` will print it.
*/

const SECTIONS = [
  {
    id: "sec-1",
    questions: [
      { id: "married-before", type: "yes_no", isRequired: true },
      { id: "ex-spouse", type: "short_text", isRequired: false },
      { id: "notes", type: "short_text", isRequired: false },
    ],
  },
];

const RULES: LogicRule[] = [
  {
    id: "r1",
    sourceQuestionId: "married-before",
    targetQuestionId: "ex-spouse",
    targetSectionId: null,
    condition: { operator: "equals", value: "yes" },
    actionType: "show_question",
    priority: 0,
  },
  {
    id: "r2",
    sourceQuestionId: "married-before",
    targetQuestionId: "ex-spouse",
    targetSectionId: null,
    condition: { operator: "equals", value: "yes" },
    actionType: "require_question",
    priority: 1,
  },
];

/**
 * The hook as a page uses it: over one draft form, against saved answers.
 *
 * `stored` is built once outside the render, because `useDraftForm` re-seeds
 * itself whenever that object changes identity — a fresh literal per render
 * loops forever. The pages memoize it for the same reason.
 */
const setup = (saved: Map<string, unknown>, rules: LogicRule[] = RULES) => {
  const stored = {
    "married-before": String(saved.get("married-before") ?? ""),
    "ex-spouse": String(saved.get("ex-spouse") ?? ""),
    notes: String(saved.get("notes") ?? ""),
  };

  return renderHook(() => {
    const form = useDraftForm(stored);
    const logic = useQuestionnaireLogic({
      rules,
      sections: SECTIONS,
      saved,
      control: form.control,
    });
    return { form, logic };
  });
};

const questionIds = (result: { logic: { sections: typeof SECTIONS } }) =>
  result.logic.sections.flatMap((s) => s.questions.map((q) => q.id));

describe("branching on screen", () => {
  it("keeps a branch shut while its question is unanswered", () => {
    const { result } = setup(new Map());
    expect(questionIds(result.current)).toEqual(["married-before", "notes"]);
  });

  it("opens it as the answer is typed, before any save", () => {
    const { result } = setup(new Map());

    act(() => {
      result.current.form.setValue("married-before", "true", {
        shouldDirty: true,
      });
    });

    expect(questionIds(result.current)).toContain("ex-spouse");
  });

  it("makes a revealed question required, and an unrevealed one not", () => {
    const { result } = setup(new Map([["married-before", true]]));
    const exSpouse = SECTIONS[0].questions[1];
    expect(result.current.logic.isRequired(exSpouse)).toBe(true);

    const { result: shut } = setup(new Map([["married-before", false]]));
    expect(shut.current.logic.isRequired(exSpouse)).toBe(false);
  });

  it("withdraws an answer the client has just taken back", () => {
    // Saved as "yes, and here is the name". The client changes their mind.
    const { result } = setup(
      new Map<string, unknown>([
        ["married-before", true],
        ["ex-spouse", "Jordan Ellis"],
      ]),
    );
    expect(result.current.logic.withdrawn).toEqual([]);

    act(() => {
      result.current.form.setValue("married-before", "false", {
        shouldDirty: true,
      });
    });

    expect(result.current.logic.withdrawn).toEqual(["ex-spouse"]);
  });

  it("has nothing to withdraw for a branch that never opened", () => {
    const { result } = setup(new Map([["married-before", false]]));
    expect(result.current.logic.withdrawn).toEqual([]);
  });

  it("leaves the questionnaire alone when it has no rules", () => {
    const { result } = setup(new Map(), []);
    expect(result.current.logic.sections).toBe(SECTIONS);
    expect(result.current.logic.withdrawn).toEqual([]);
  });
});
