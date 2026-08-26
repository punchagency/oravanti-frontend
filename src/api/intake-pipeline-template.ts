import { API } from "./index";

/**
 * The firm's intake checklist — the fixed list of steps every new lead is
 * stamped with.
 *
 * Unlike a case workflow, this is not per case type and has no conditional or
 * manual modules: intake is the same sequence for everyone, which is why it is
 * one flat ordered list rather than a module tree. What it shares with the
 * workflow template is clone-on-first-edit — a firm that has never edited its
 * checklist reads the shared system default (`organizationId: null`), and the
 * first save forks it.
 */

export type PipelineStage =
  | "lead_inbox"
  | "conflict_check"
  | "questionnaire"
  | "consultation"
  | "fee_agreement"
  | "case_opening";

export interface IntakePipelineTemplateStep {
  id: string;
  templateId: string;
  title: string;
  description: string | null;
  pipelineStage: PipelineStage;
  /** Position within the stage. Derived from list order on save. */
  orderIndex: number;
  isRequired: boolean;
  /** Roles the step is auto-assigned to when a lead is stamped. Empty leaves it unassigned. */
  assignableRoles: string[];
  createdAt: string;
}

export interface IntakePipelineTemplate {
  id: string;
  /** Null means this is the shared system default — saving forks it for the firm. */
  organizationId: string | null;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  steps: IntakePipelineTemplateStep[];
}

/** One step as the editor sends it: no id, no `orderIndex` — the array's order is the order. */
export interface IntakePipelineStepInput {
  title: string;
  description?: string | null;
  pipelineStage: PipelineStage;
  isRequired?: boolean;
  assignableRoles?: string[];
}

export async function getIntakePipelineTemplate(): Promise<IntakePipelineTemplate> {
  const { data } = await API.get<{ data: IntakePipelineTemplate }>(
    "/leads/intake-pipeline/template",
  );
  return data.data;
}

export async function saveIntakePipelineSteps(
  steps: IntakePipelineStepInput[],
): Promise<IntakePipelineTemplate> {
  const { data } = await API.put<{ data: IntakePipelineTemplate }>(
    "/leads/intake-pipeline/template/steps",
    { steps },
  );
  return data.data;
}
