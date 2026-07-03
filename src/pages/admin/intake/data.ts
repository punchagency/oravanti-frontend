export const intakeStages = [
  {
    label: "Lead inbox",
    path: "/intake/pipeline/lead-inbox",
    stage: "lead_inbox" as const,
    color: "#8c8f87",
  },
  {
    label: "Conflict check",
    path: "/intake/pipeline/conflict-check",
    stage: "conflict_check" as const,
    color: "#d18400",
  },
  {
    label: "Questionnaire",
    path: "/intake/pipeline/questionnaire",
    stage: "questionnaire" as const,
    color: "#377dff",
  },
  {
    label: "Consultation",
    path: "/intake/pipeline/consultation",
    stage: "consultation" as const,
    color: "#6a00c7",
  },
  {
    label: "Case opening",
    path: "/intake/pipeline/case-opening",
    stage: "case_opening" as const,
    color: "#00a878",
  },
] as const;

export const intakeTabs = [
  ["Lead inbox", "/intake/pipeline/lead-inbox"],
  ["Conflict check", "/intake/pipeline/conflict-check"],
  ["Questionnaire", "/intake/pipeline/questionnaire"],
  ["Consultation & notes", "/intake/pipeline/consultation"],
  ["Case opening", "/intake/pipeline/case-opening"],
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
