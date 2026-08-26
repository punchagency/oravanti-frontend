import type { PipelineStage } from "@/api/intake-pipeline-template";

/**
 * The stages a lead moves through, in order.
 *
 * `lead_inbox` is deliberately absent: it is where a lead sits before anyone has
 * touched it, so a checklist step there has nobody to do it. The backend accepts
 * the value — it is part of the stage enum — but the editor does not offer it.
 */
export const STAGE_ORDER = [
  "conflict_check",
  "questionnaire",
  "consultation",
  "fee_agreement",
  "case_opening",
] as const satisfies readonly PipelineStage[];

const LABELS: Record<PipelineStage, string> = {
  lead_inbox: "Lead inbox",
  conflict_check: "Conflict check",
  questionnaire: "Questionnaire",
  consultation: "Consultation",
  fee_agreement: "Fee agreement",
  case_opening: "Case opening",
};

export const stageLabel = (stage: PipelineStage) => LABELS[stage] ?? stage;
