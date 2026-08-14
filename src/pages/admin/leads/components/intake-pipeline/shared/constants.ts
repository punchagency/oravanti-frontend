export const pipelineStageLabels: Record<string, string> = {
  conflict_check: "Conflict Check",
  questionnaire: "Questionnaire",
  consultation: "Consultation",
  fee_agreement: "Fee Agreement",
  case_opening: "Case Opening",
};

export const pipelineStageColors: Record<string, string> = {
  conflict_check: "#d18400",
  questionnaire: "#377dff",
  consultation: "#6a00c7",
  fee_agreement: "#e66767",
  case_opening: "#00a878",
};

/**
 * Which pipeline page a task's stage opens. `fee_agreement` has no page of its
 * own — the agreement is drafted and signed from the consultation page.
 */
export const stagePathSuffix: Record<string, string> = {
  conflict_check: "conflict-check",
  questionnaire: "questionnaire",
  consultation: "consultation",
  fee_agreement: "consultation",
  case_opening: "case-opening",
};

export function leadStagePath(leadId: string, stage: string): string {
  return `/leads/${leadId}/${stagePathSuffix[stage] ?? "conflict-check"}`;
}

/** Where "back" lands when a stage page is opened without an explicit origin. */
export function leadPipelineTabPath(leadId: string): string {
  return `/leads/${leadId}/intake-pipeline`;
}

/**
 * Router state carried into a stage page so it can offer a way back to
 * wherever the task was opened from — the lead's pipeline tab, My Tasks, the
 * review queue. Without it a stage page is a dead end, since it renders
 * outside the lead detail layout that owns the tabs.
 */
export interface PipelineOrigin {
  from: string;
  fromLabel: string;
}

export function pipelineOrigin(from: string, fromLabel: string): PipelineOrigin {
  return { from, fromLabel };
}

export const taskStatusColors: Record<string, { borderColor: string; textColor: string; bg: string }> = {
  pending: { borderColor: "border", textColor: "fg.muted", bg: "bg.subtle" },
  in_progress: { borderColor: "brand.emphasized", textColor: "brand.fg", bg: "brand.subtle" },
  in_review: { borderColor: "orange.400", textColor: "orange.600", bg: "orange.subtle" },
  completed: { borderColor: "green.emphasized", textColor: "green.fg", bg: "green.subtle" },
  skipped: { borderColor: "border", textColor: "fg.muted", bg: "bg.subtle" },
};
