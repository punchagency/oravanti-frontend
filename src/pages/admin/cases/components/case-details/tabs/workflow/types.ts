/** Represents the roles that can be assigned to perform a workflow step */
export type AssignableRole =
  | "attorney"
  | "paralegal"
  | "case_manager"
  | "trial_paralegal";

/** The current status of a workflow step within a case instance */
export type StepStatus =
  | "not_started"
  | "in_progress"
  | "in_review"
  | "complete"
  | "blocked"
  /** Sent back by a reviewer; terminal until the assignee reopens it. */
  | "rejected";

/** Activation behaviour for conditional modules (e.g. Litigation only triggers manually) */
export type ModuleActivationType = "auto" | "manual_trigger" | "condition_met";

// ---------------------------------------------------------------------------
// Template definitions (read-only — seeded per practice area)
// ---------------------------------------------------------------------------

/** A single checklist item within a workflow module */
export interface WorkflowStep {
  /** Unique identifier for this step definition (e.g. "pi-wf01-s01") */
  stepId: string;
  /** Human-readable step title */
  title: string;
  /** Optional longer description of what this step entails */
  description: string;
  /** Which staff roles are permitted to be assigned to this step */
  assignableTo: AssignableRole[];
  /** Filing-type certification required to be assigned (null = no restriction) */
  requiredCertification: string | null;
  /** Position within the parent module */
  orderIndex: number;
  /** Default duration in business days for completing this step from assignment */
  defaultDurationDays: number;
}

/** A module groups related steps together (maps to one of the 20 PI workflows) */
export interface WorkflowModule {
  /** Unique identifier for this module definition (e.g. "pi-wf01") */
  moduleId: string;
  /** Display name of the module */
  name: string;
  /** Lifecycle phase grouping label (e.g. "Investigation", "Pre-Litigation") */
  phase: string;
  /** Position within the template */
  orderIndex: number;
  /** Ordered list of steps belonging to this module */
  steps: WorkflowStep[];
  /** If present, this module does not activate automatically and requires a trigger */
  conditionalActivation?: {
    type: ModuleActivationType;
    /** Identifier of the condition or module this depends on */
    dependsOn?: string;
    /** Human-readable label shown in the UI when the module is locked */
    label?: string;
  };
}

/** A workflow template is the blueprint for a specific practice area + filing type combination */
export interface WorkflowTemplate {
  /** Unique template identifier */
  templateId: string;
  /** Practice area key (e.g. "personal-injury") */
  practiceArea: string;
  /** Human-readable practice area label */
  practiceAreaLabel: string;
  /** Filing types that trigger this template */
  filingTypes: string[];
  /** Display name for the template */
  name: string;
  /** Ordered list of modules that make up this workflow */
  modules: WorkflowModule[];
}

// ---------------------------------------------------------------------------
// Case instance types (per-case runtime state)
// ---------------------------------------------------------------------------

/** The runtime state of a single step within a specific case */
export interface CaseStepInstance {
  /** References WorkflowStep.stepId */
  stepId: string;
  /** Current progress status */
  status: StepStatus;
  /** Staff member currently assigned to this step, if any */
  assignedTo: { id: string; name: string; role: string } | null;
  /** Timestamp when the step was first assigned to a staff member */
  assignedAt: string | null;
  /** Deadline for this step, auto-calculated or manually set */
  dueDate: string | null;
  /** Timestamp when the step was marked complete */
  completedAt: string | null;
  /** Staff member who completed the step */
  completedBy: { id: string; name: string } | null;
  /** If an attorney overrode the certification gate, the required rationale is stored here */
  overrideRationale: string | null;
  /** Free-text notes attached to this step instance */
  notes: string;
}

/** The runtime state of a module within a specific case */
export interface CaseModuleInstance {
  /** References WorkflowModule.moduleId */
  moduleId: string;
  /** Whether this module is currently available, active, or finished */
  status: "locked" | "active" | "completed";
  /** Runtime state for each step in this module */
  steps: CaseStepInstance[];
}

/** The full workflow state for a single case */
export interface CaseWorkflowInstance {
  /** The case this workflow belongs to */
  caseId: string;
  /** References WorkflowTemplate.templateId */
  templateId: string;
  /** Module-level runtime states, in order */
  modules: CaseModuleInstance[];
  /** When the workflow was first started for this case */
  startedAt: string;
}

// ---------------------------------------------------------------------------
// Staff certification types
// ---------------------------------------------------------------------------

/** A staff member's filing-type certification record used by the certification gate */
export interface StaffCertification {
  /** Staff unique identifier */
  id: string;
  /** Full display name */
  name: string;
  /** Staff role within the organisation */
  role: AssignableRole | "admin";
  /** Whether the staff member is currently active */
  active: boolean;
  /** List of filing-type certifications held (e.g. ["PI Intake", "PI Medical"]) */
  certifications: string[];
}

// ---------------------------------------------------------------------------
// Timeline event types
// ---------------------------------------------------------------------------

/** An event recorded on the case timeline, typically triggered by workflow actions */
export interface TimelineEvent {
  id: string;
  /** Discriminator for the type of event (e.g. "step_completed", "step_assigned") */
  eventType: string;
  /** Short summary of what happened */
  title: string;
  /** Optional longer description */
  description: string | null;
  /** Arbitrary payload with event-specific data */
  metadata: Record<string, unknown> | null;
  /** Staff member who performed the action */
  createdBy: { id: string; name: string } | null;
  /** ISO timestamp of when the event occurred */
  createdAt: string;
}
