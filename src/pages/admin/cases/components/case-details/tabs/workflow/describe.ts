import type { Condition, ConditionField } from "@/api/workflows";

/**
 * Turns engine data into the sentence a paralegal reads.
 *
 * Two rules, both borrowed from the audit registry's conventions (see
 * `@/lib/audit`):
 *
 *   • Never key on a re-cased variant of a backend value. These maps are keyed
 *     on the exact strings the API sends.
 *   • Always fall through gracefully. A case written by a newer deployment can
 *     carry a condition field or date anchor this build has never seen; every
 *     lookup here degrades to a readable de-snake-cased fallback rather than
 *     rendering "undefined" or throwing.
 */

const CONDITION_FIELD_LABELS: Record<ConditionField, string> = {
  "immigrationDetails.filingTrack": "filing track",
  "immigrationDetails.naturalizationTrack": "naturalization track",
  "immigrationDetails.isConditionalResidence": "conditional residence",
  "immigrationDetails.priorityDateIsCurrent": "priority date current",
  "personalInjuryDetails.defendantType": "defendant type",
  "personalInjuryDetails.isMinorPlaintiff": "minor plaintiff",
  "case.priority": "case priority",
};

/** `government_entity` → `government entity`. Enum values arrive snake_cased. */
const humanize = (value: string) => value.replace(/_/g, " ");

/**
 * `immigrationDetails.someNewFlag` → `some new flag`.
 *
 * Field names are camelCase after the dot, so the fallback splits on case as
 * well as underscores — a condition field added by a newer deployment reads as
 * a phrase rather than as an identifier.
 */
const fieldLabel = (field: ConditionField): string =>
  CONDITION_FIELD_LABELS[field] ??
  humanize(String(field).split(".").pop() ?? field)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase();

const valueLabel = (value: string | boolean | string[]): string => {
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (Array.isArray(value)) return value.map(humanize).join(", ");
  return humanize(value);
};

/**
 * A one-line explanation of what has to be true for a conditional module to
 * activate, e.g. "filing track is concurrent".
 *
 * Shown on modules that haven't unlocked yet — a paralegal should be able to
 * see what's coming and why it isn't here, not wonder where a module went.
 */
export function describeCondition(condition: Condition): string {
  if ("allOf" in condition) return condition.allOf.map(describeCondition).join(" and ");
  if ("anyOf" in condition) return condition.anyOf.map(describeCondition).join(" or ");

  const subject = fieldLabel(condition.field);

  switch (condition.op) {
    case "eq":
      return `${subject} is ${valueLabel(condition.value)}`;
    case "neq":
      return `${subject} is not ${valueLabel(condition.value)}`;
    case "in":
      return `${subject} is one of ${valueLabel(condition.value)}`;
    default:
      // A newer deployment's operator. Say what is known rather than nothing.
      return subject;
  }
}

/**
 * The noun phrase for a `date_anchor` value, written to read inside
 * "Due once ___ is recorded".
 */
const DATE_ANCHOR_LABELS: Record<string, string> = {
  case_opened: "the case is opened",
  filing_deadline: "the filing deadline",
  next_court_date: "the next court date",
  uscis_interview: "the USCIS interview",

  receipt_date: "the receipt notice",
  biometrics_appointment: "the biometrics appointment",
  card_valid_to: "the card expiry",
  interview_scheduled_date: "the interview date",
  decision_date: "the decision",
  green_card_expiration_date: "the green card expiry",
  eligibility_date: "the eligibility date",
  oath_ceremony_date: "the oath ceremony",
  demand_letter_sent_date: "the demand letter",
  service_completed_date: "service",
  ruling_date: "the ruling",
  filed_date: "the filing date",

  incident_date: "the incident date",
  statute_of_limitations_date: "the SOL date",
  mmi_date: "MMI",
  demand_sent_date: "the demand",
  defendant_answer_date: "the defendant's answer",
  msj_filed_date: "the MSJ filing",
  mediation_scheduled_date: "mediation",
  trial_date: "the trial date",
  verdict_date: "the verdict",
  funds_received_date: "receipt of funds",
};

/**
 * What to show in a task's due-date slot.
 *
 * A workflow task's due date is computed from an anchor milestone, so a null
 * one means the milestone hasn't happened yet — not that nobody set a
 * deadline. Saying which milestone is what makes the blank actionable: record
 * that date and the deadline appears.
 */
export function describeDueDate(
  dueDate: string | null,
  anchor?: string | null,
): { text: string; isPending: boolean } {
  if (dueDate) return { text: dueDate, isPending: false };
  if (!anchor) return { text: "No due date", isPending: false };

  const label = DATE_ANCHOR_LABELS[anchor] ?? humanize(anchor);
  return { text: `Due once ${label} is recorded`, isPending: true };
}
