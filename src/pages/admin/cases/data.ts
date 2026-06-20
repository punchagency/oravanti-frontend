export const casesTabsConfig = [
  { label: "All cases", value: "all-matters" },
  { label: "Active", value: "active" },
  { label: "RFE / Urgent", value: "rfe-urgent" },
  { label: "Closed", value: "closed" },
] as const;

export type CasesTabs = (typeof casesTabsConfig)[number]["value"];

export const caseStatuses = [
  { label: "Active", count: 44, color: "green" },
  { label: "RFE / Urgent", count: 3, color: "orange" },
  { label: "Pending", count: 11, color: "blue" },
  { label: "Closed (30d)", count: 18, color: "gray" },
] as const;
