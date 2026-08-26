/**
 * Groups the `ac` statement's resources into the product's matrix sections.
 * Not derived from the backend — the resource vocabulary and the product's
 * grouping are different concerns, and better-auth's own `organization`/
 * `member`/`invitation`/`team` defaults don't need a firm-facing row at all.
 */
export const RESOURCE_GROUPS: Record<string, string[]> = {
  Dashboard: ["dashboard"],
  Leads: ["leads"],
  Cases: ["cases", "conflicts", "case_review"],
  // Their own section rather than a row under Cases: one `tasks` grant covers
  // case workflow steps, intake pipeline steps and ad-hoc to-dos alike, and
  // `workflow` gates the template editors behind both.
  "Tasks & workflow": ["tasks", "workflow"],
  Clients: ["clients"],
  Documents: ["documents"],
  Calendar: ["calendar"],
  "AI Review": ["ai_review"],
  Finance: ["finance"],
  Staff: ["staffs", "invitations"],
  Portal: ["portal"],
  Analytics: ["analytics"],
  Settings: [
    "ac",
    "audit",
    "firm_settings",
    "email_accounts",
    "add_ons",
    "integrations",
    "training",
  ],
};
