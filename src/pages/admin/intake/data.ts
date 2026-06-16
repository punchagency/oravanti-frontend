export const intakeStages = [
  {
    label: "Lead inbox",
    path: "/admin/intake/pipeline/lead-inbox",
    stage: "lead_inbox" as const,
    color: "#8c8f87",
  },
  {
    label: "Conflict check",
    path: "/admin/intake/pipeline/conflict-check",
    stage: "conflict_check" as const,
    color: "#d18400",
  },
  {
    label: "Questionnaire",
    path: "/admin/intake/pipeline/questionnaire",
    stage: "questionnaire" as const,
    color: "#377dff",
  },
  {
    label: "Consultation",
    path: "/admin/intake/pipeline/consultation",
    stage: "consultation" as const,
    color: "#6a00c7",
  },
  {
    label: "Fee agreement",
    path: "/admin/intake/pipeline/fee-agreement",
    stage: "fee_agreement" as const,
    color: "#d18400",
  },
  {
    label: "Case opening",
    path: "/admin/intake/pipeline/case-opening",
    stage: "case_opening" as const,
    color: "#00a878",
  },
] as const;

export const intakeTabs = [
  ["Lead inbox", "/admin/intake/pipeline/lead-inbox"],
  ["Conflict check", "/admin/intake/pipeline/conflict-check"],
  ["Questionnaire", "/admin/intake/pipeline/questionnaire"],
  ["Consultation & notes", "/admin/intake/pipeline/consultation"],
  ["Fee agreement", "/admin/intake/pipeline/fee-agreement"],
  ["Case opening", "/admin/intake/pipeline/case-opening"],
] as const;

export const leadSources = [
  "Education flywheel",
  "Referral",
  "Direct",
  "Walk in",
  "Phone enquiry",
  "Client portal",
] as const;

export const leadStatuses = ["New", "Reviewed", "Archived"] as const;
