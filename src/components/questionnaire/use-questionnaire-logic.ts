import { fieldName, type DraftForm } from "@/components/questionnaire/use-draft-form";
import { evaluateLogic, type LogicRule } from "@/lib/questionnaire/logic";
import { fromInputValue } from "@/utils/answer-value";
import type { ValueType } from "@/components/ui/typed-value-input";
import { useMemo } from "react";
import { useWatch } from "react-hook-form";

/** The least a question must be for the rules to reach it. */
type LogicQuestion = { id: string; type: string; isRequired: boolean };

/** The least a section must be. */
type LogicSection<Q> = { id: string; questions: Q[] };

/**
 * Branching, applied to a questionnaire on screen.
 *
 * The evaluator itself is `@/lib/questionnaire/logic`, mirrored byte-for-byte
 * from the backend so the client and the server never disagree about what was
 * asked. This hook is the React half: it decides *which answers* to evaluate
 * against, and hands back sections with the hidden questions taken out.
 *
 * ─── It watches the draft, not the saved answers ────────────────────────────
 *
 * A branch that only opened after a save would be useless: the client answers
 * "yes", nothing happens, and the questions they now need are behind a button
 * they have no reason to press. So the source questions are read from the form
 * as they are typed.
 *
 * Which is also why it watches *only* the sources. Subscribing to the whole
 * form would re-render every row on the page on every keystroke — the exact
 * cost `useDraftForm` exists to avoid, and it grows with the size of the
 * section. A handful of names is a handful of re-renders, each of them one the
 * screen genuinely has to do.
 *
 * ─── A hidden answer is a withdrawn answer ──────────────────────────────────
 *
 * Hiding a question is not the same as leaving it blank, and treating it that
 * way is how an ex-spouse the client removed reaches a signed federal form. So
 * `withdrawn` lists the answers a save must clear, and callers are expected to
 * send them: the server clears them too, at submission, but a draft saved and
 * never submitted is what the firm reads in the meantime.
 */
export function useQuestionnaireLogic<
  Q extends LogicQuestion,
  S extends LogicSection<Q>,
>({
  rules,
  sections,
  saved,
  control,
}: {
  /** Every rule on the questionnaire. Undefined until the fetch lands. */
  rules: LogicRule[] | undefined;
  /** Every section, before hiding. */
  sections: S[];
  /** What the server holds, by question id. */
  saved: Map<string, unknown>;
  control: DraftForm["control"];
}) {
  const allRules = useMemo(() => rules ?? [], [rules]);

  const questionsById = useMemo(() => {
    const map = new Map<string, Q>();
    for (const section of sections) {
      for (const question of section.questions) map.set(question.id, question);
    }
    return map;
  }, [sections]);

  /*
    Only the questions a rule actually asks about, and only those on screen: a
    rule pointing at a question this send did not carry has nothing to read, and
    watching a name the form never registered would subscribe to `undefined`
    forever.
  */
  const sources = useMemo(
    () =>
      [...new Set(allRules.map((rule) => rule.sourceQuestionId))].filter((id) =>
        questionsById.has(id),
      ),
    [allRules, questionsById],
  );

  const names = useMemo(() => sources.map(fieldName), [sources]);
  const drafts = useWatch({ control, name: names });

  const answers = useMemo(() => {
    const map = new Map(saved);
    sources.forEach((id, index) => {
      const draft = drafts[index];
      // Undefined means the field has not registered yet, which is not the same
      // as cleared — the saved answer still stands until the control appears.
      if (draft === undefined) return;
      const type = (questionsById.get(id)?.type ?? "short_text") as ValueType;
      map.set(id, fromInputValue(draft, type));
    });
    return map;
    // `drafts` is a fresh array on every render, so this recomputes each time.
    // It is a handful of entries over a handful of rules; the alternative is
    // hashing the values, which costs the same and reads worse.
  }, [saved, sources, drafts, questionsById]);

  const result = useMemo(
    () => evaluateLogic(allRules, answers),
    [allRules, answers],
  );

  /**
   * Every question out of sight, whether by its own rule or by its section's.
   * One set, because every caller asks the same question of it and a second
   * reading is a second thing to get wrong.
   */
  const hidden = useMemo(() => {
    const ids = new Set(result.hiddenQuestionIds);
    for (const section of sections) {
      if (!result.hiddenSectionIds.has(section.id)) continue;
      for (const question of section.questions) ids.add(question.id);
    }
    return ids;
  }, [result, sections]);

  /** The sections to render: hidden ones gone, hidden questions removed. */
  const visibleSections = useMemo(() => {
    if (allRules.length === 0) return sections;
    return sections
      .filter((section) => !result.hiddenSectionIds.has(section.id))
      .map((section) => ({
        ...section,
        questions: section.questions.filter((q) => !hidden.has(q.id)),
      }));
  }, [sections, result, hidden, allRules]);

  /**
   * Whether a question must be answered — its own flag, plus any rule that adds
   * one. Never subtracts: a question required on its own row stays required.
   */
  const isRequired = useMemo(
    () => (question: LogicQuestion) =>
      question.isRequired || result.requiredQuestionIds.has(question.id),
    [result],
  );

  /**
   * Answers to clear, because the question that asked for them is no longer on
   * screen. Only ones the server actually holds — a question hidden from the
   * start has nothing to withdraw.
   */
  const withdrawn = useMemo(
    () =>
      [...hidden].filter((id) => {
        const value = saved.get(id);
        return value != null && value !== "";
      }),
    [hidden, saved],
  );

  return { sections: visibleSections, hidden, isRequired, withdrawn };
}
