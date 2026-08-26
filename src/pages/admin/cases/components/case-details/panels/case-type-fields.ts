import type {
  Condition,
  ConditionField,
  WorkflowTemplate,
} from "@/api/workflows";
import type { CaseMilestone } from "@/api/case-details";

/**
 * Which fields and cards a given case is allowed to show, derived from the
 * workflow it actually runs.
 *
 * ─── Why this is derived and not a list ─────────────────────────────────────
 *
 * A practice area is far too coarse to decide this. Immigration alone has
 * ~90 case types and three of them have a workflow template; an N-400 and an
 * I-485 are both "Immigration" and share almost no facts. Keying on the
 * practice area put a priority date, a preference category and an I-864
 * sponsor block on naturalization matters they have nothing to do with, and
 * put an LPR/eligibility date on adjustment matters.
 *
 * Keying on the *case type* instead would fix that, but only by shipping a
 * name-to-fieldset table that is a second source of truth: it goes stale the
 * moment a template changes, and it says nothing about the ~87 case types
 * nobody has written an entry for.
 *
 * So the template decides. It already declares exactly what the engine reads —
 * a conditional module names the `immigrationDetails` field it branches on, and
 * a step names the date it anchors its deadline to. A field earns its place on
 * the panel by being one this case's workflow consults. Nothing to maintain,
 * and a firm that clones and edits its own template gets a panel that follows
 * it.
 *
 * ─── Why both conditions and anchors ────────────────────────────────────────
 *
 * Conditions alone are not enough, and the N-400 is why: it branches on nothing
 * at all. Every one of its modules is unconditional, so a rule reading only
 * activation conditions would hide the naturalization fields on the one case
 * type they exist for. What distinguishes it is what its steps count from —
 * `oath_ceremony_date`, which no other template anchors on.
 *
 * ─── What this does not do ──────────────────────────────────────────────────
 *
 * Hiding a field never touches its stored value. A case that was recategorised,
 * or that was edited while the old practice-area panel showed everything, keeps
 * whatever was entered — it simply stops being offered. If the case type or its
 * template later changes, the value is still there.
 */
export interface CaseFieldVisibility {
  /**
   * The adjustment-of-status package: filing track, preference category,
   * chargeability, priority date, and the sponsor/medical inputs the pre-filing
   * checks read. Also gates the checks and fee cards, which quote the I-485
   * package specifically.
   */
  adjustment: boolean;
  /** Naturalization track, LPR date, eligibility date. */
  naturalization: boolean;
  /** The I-751 conditional-residence flag. */
  conditionalResidence: boolean;
  /** A district-court mandamus matter, which files no USCIS form at all. */
  mandamus: boolean;
  /** The milestone timeline and its recorder. */
  milestones: boolean;
  /**
   * True when this case type has no workflow template at all. The panel falls
   * back to the fields true of any USCIS filing rather than guessing.
   */
  untemplated: boolean;
}

/**
 * What each group of fields is evidence of, in the template's own vocabulary.
 *
 * A group shows if the template branches on any of its `conditionFields` or
 * anchors a step on any of its `anchors`. The entries are deliberately narrow:
 * a signal that would also be true of some neighbouring workflow is not a
 * signal, it is the practice-area mistake again one level down.
 */
const GROUP_SIGNALS = {
  /**
   * How the seeded template gates its I-485 / I-765 / I-131 / I-864 / I-693
   * modules: a concurrent filing qualifies immediately, a sequential one
   * qualifies the month its priority date becomes current.
   *
   * No anchors here on purpose. `card_valid_to` and `green_card_expiration_date`
   * appear in the AOS template, but only because adjustment can end in
   * conditional residence — they are evidence of an I-751, not of a package.
   */
  adjustment: {
    conditionFields: [
      "immigrationDetails.filingTrack",
      "immigrationDetails.priorityDateIsCurrent",
    ] as ConditionField[],
    anchors: [] as string[],
  },
  /**
   * `oath_ceremony_date` is unique to naturalization and is what the N-400's
   * post-approval steps count from. `eligibility_date` is deliberately absent:
   * it is in the anchor vocabulary but no seeded step uses it, so treating it
   * as a signal would be asserting something the template does not say.
   */
  naturalization: {
    conditionFields: ["immigrationDetails.naturalizationTrack"] as ConditionField[],
    anchors: ["oath_ceremony_date"],
  },
  /** The I-751 window: both ends count back from the conditional card's expiry. */
  conditionalResidence: {
    conditionFields: ["immigrationDetails.isConditionalResidence"] as ConditionField[],
    anchors: ["green_card_expiration_date"],
  },
  /**
   * A civil action, not a filing. `service_completed_date` and `ruling_date`
   * are court events and appear in no other template.
   */
  mandamus: {
    conditionFields: [] as ConditionField[],
    anchors: ["service_completed_date", "ruling_date"],
  },
} as const;

/** Anchors that resolve from a recordable milestone. */
const MILESTONE_ANCHORS: Record<string, CaseMilestone> = {
  receipt_date: "receipt",
  biometrics_appointment: "biometrics_appointment",
  interview_scheduled_date: "interview_scheduled",
  decision_date: "decision",
  card_valid_to: "card_valid_to",
  green_card_expiration_date: "green_card_expiration",
};

/**
 * Every field a condition consults, flattened through `allOf` / `anyOf`.
 *
 * Composite conditions nest arbitrarily, so reading `.field` off the top level
 * would silently return nothing for the ones that matter most — the AOS gate is
 * an `anyOf` of two leaves.
 */
export function fieldsReferencedBy(condition: Condition | null | undefined): ConditionField[] {
  if (!condition) return [];
  if ("allOf" in condition) return condition.allOf.flatMap(fieldsReferencedBy);
  if ("anyOf" in condition) return condition.anyOf.flatMap(fieldsReferencedBy);
  return [condition.field];
}

/** Every condition field this template branches on, across all its modules. */
export function templateConditionFields(template: WorkflowTemplate): Set<ConditionField> {
  return new Set(
    template.modules.flatMap((mod) => fieldsReferencedBy(mod.activationCondition)),
  );
}

/** Every date this template's steps anchor a deadline to. */
export function templateAnchors(template: WorkflowTemplate): Set<string> {
  const anchors = new Set<string>();
  for (const mod of template.modules) {
    for (const step of mod.steps) {
      if (step.dueDateAnchor) anchors.add(step.dueDateAnchor);
    }
  }
  return anchors;
}

/** The milestones this template actually schedules work from. */
export function templateMilestones(template: WorkflowTemplate): Set<CaseMilestone> {
  const milestones = new Set<CaseMilestone>();
  for (const anchor of templateAnchors(template)) {
    const milestone = MILESTONE_ANCHORS[anchor];
    if (milestone) milestones.add(milestone);
  }
  return milestones;
}

/**
 * What this case may show.
 *
 * `template` is null for a case type nobody has seeded a workflow for — most of
 * the taxonomy. That is a real configuration state, not an error: the panel
 * shows the filing type and RFE dates, which are true of any USCIS filing, and
 * asserts nothing else.
 */
export function visibilityFor(template: WorkflowTemplate | null | undefined): CaseFieldVisibility {
  if (!template) {
    return {
      adjustment: false,
      naturalization: false,
      conditionalResidence: false,
      mandamus: false,
      milestones: false,
      untemplated: true,
    };
  }

  const fields = templateConditionFields(template);
  const anchors = templateAnchors(template);

  const shows = (group: keyof typeof GROUP_SIGNALS) =>
    GROUP_SIGNALS[group].conditionFields.some((f) => fields.has(f)) ||
    GROUP_SIGNALS[group].anchors.some((a) => anchors.has(a));

  return {
    adjustment: shows("adjustment"),
    naturalization: shows("naturalization"),
    conditionalResidence: shows("conditionalResidence"),
    mandamus: shows("mandamus"),
    milestones: templateMilestones(template).size > 0,
    untemplated: false,
  };
}
