export const pipelineStageLabels: Record<string, string> = {
  lead_inbox: "Lead Inbox",
  conflict_check: "Conflict Check",
  questionnaire: "Questionnaire",
  consultation: "Consultation",
  fee_agreement: "Fee Agreement",
  case_opening: "Case Opening",
};

export const pipelineStageColors: Record<string, string> = {
  lead_inbox: "#8c8f87",
  conflict_check: "#d18400",
  questionnaire: "#377dff",
  consultation: "#6a00c7",
  fee_agreement: "#e66767",
  case_opening: "#00a878",
};

export const taskStatusColors: Record<string, { borderColor: string; textColor: string; bg: string }> = {
  pending: { borderColor: "border", textColor: "fg.muted", bg: "bg.subtle" },
  in_progress: { borderColor: "brand.emphasized", textColor: "brand.fg", bg: "brand.subtle" },
  completed: { borderColor: "green.emphasized", textColor: "green.fg", bg: "green.subtle" },
  skipped: { borderColor: "border", textColor: "fg.muted", bg: "bg.subtle" },
};
