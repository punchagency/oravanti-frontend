export const crmTabs = [
  "Pipeline",
  "Conversion metrics",
  "Education flywheel",
  "Archived leads",
] as const;

export type CrmTab = (typeof crmTabs)[number];

export const archiveReasons = [
  "All reasons",
  "Conflict of interest",
  "Referred elsewhere",
  "Unresponsive",
  "Withdrawn",
] as const;

export const educationTiers = [
  "All tiers",
  "Free tier",
  "Tier 2",
  "Tier 3",
] as const;
