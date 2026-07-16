import type { LeadSource, PipelineStage } from "@/api/leads";
import type { PublicPracticeArea } from "@/pages/contractor-sign-up/types";

export const crmTabs = [
  "Pipeline",
  "Conversion metrics",
  "Education flywheel",
  "Archived leads",
] as const;

export type CrmTab = (typeof crmTabs)[number];

/**
 * Single source of truth for stage wording. These labels were previously
 * duplicated across the tabs and had drifted apart — the pipeline table said
 * "Questionnaire sent" / "Case opened" where the archived table said
 * "Questionnaire" / "Case opening" for the same stage.
 */
export const stageLabel: Record<PipelineStage, string> = {
  lead_inbox: "New lead",
  conflict_check: "Conflict check",
  questionnaire: "Questionnaire sent",
  consultation: "Consultation",
  fee_agreement: "Fee agreement",
  case_opening: "Case opened",
};

export const stageTone: Record<
  PipelineStage,
  "neutral" | "warning" | "info" | "brand" | "gold" | "success"
> = {
  lead_inbox: "neutral",
  conflict_check: "warning",
  questionnaire: "info",
  consultation: "brand",
  fee_agreement: "gold",
  case_opening: "success",
};

export const stageOrder: PipelineStage[] = [
  "lead_inbox",
  "conflict_check",
  "questionnaire",
  "consultation",
  "fee_agreement",
  "case_opening",
];

export const stageOptions: { label: string; value: PipelineStage | "" }[] = [
  { label: "All stages", value: "" },
  ...stageOrder.map((value) => ({ label: stageLabel[value], value })),
];

export function buildPracticeAreaMap(areas: PublicPracticeArea[]) {
  return new Map(areas.map((area) => [area.id, area.name]));
}

export function practiceAreaName(
  map: Map<string, string>,
  practiceAreaId: string | null,
): string | null {
  if (!practiceAreaId) return null;
  return map.get(practiceAreaId) ?? null;
}

export const sourceFilterOptions: { label: string; value: LeadSource | "" }[] = [
  { label: "All sources", value: "" },
  { label: "Education flywheel", value: "education_flywheel" },
  { label: "Referral", value: "referral" },
  { label: "Direct", value: "direct" },
  { label: "Walk in", value: "walk_in" },
  { label: "Phone enquiry", value: "phone_enquiry" },
  { label: "Client portal", value: "client_portal" },
];
