export type PrimarySection =
  | "overview"
  | "intake"
  | "cases"
  | "staff"
  | "finance"
  | "analytics"
  | "settings";

export type NavigationIcon =
  | "analytics"
  | "billing"
  | "briefcase"
  | "calendar"
  | "chart"
  | "lock"
  | "chevron"
  | "clipboard"
  | "dashboard"
  | "download"
  | "education"
  | "file"
  | "folder"
  | "signature"
  | "mail"
  | "message"
  | "moon"
  | "intake"
  | "search"
  | "settings"
  | "shield"
  | "globe"
  | "landmark"
  | "book-open-check"
  | "overview"
  | "users";

export type PrimaryNavigationItem = {
  label: string;
  section: PrimarySection;
  path: string;
  icon: NavigationIcon;
};

export type ContextNavigationItem = {
  label: string;
  path: string;
  icon: NavigationIcon;
  children?: ContextNavigationItem[];
};

export type ContextNavigationGroup = {
  label: string;
  items: ContextNavigationItem[];
};

export const primaryNavigation: PrimaryNavigationItem[] = [
  { label: "Overview", section: "overview", path: "/dashboard", icon: "dashboard" },
  { label: "Intake", section: "intake", path: "/intake/pipeline/lead-inbox", icon: "intake" },
  { label: "Cases", section: "cases", path: "/cases", icon: "folder" },
  { label: "Staff", section: "staff", path: "/staff", icon: "users" },
  { label: "Finance", section: "finance", path: "/finance", icon: "billing" },
  { label: "Analytics", section: "analytics", path: "/analytics", icon: "analytics" },
  { label: "Settings", section: "settings", path: "/settings", icon: "settings" },
];

export const contextNavigation: Record<PrimarySection, ContextNavigationGroup[]> = {
  overview: [
    {
      label: "Overview",
      items: [{ label: "Dashboard", path: "/dashboard", icon: "dashboard" }],
    },
  ],
  intake: [
    {
      label: "Client intake",
      items: [
        {
          label: "Intake pipeline",
          path: "/intake/pipeline/lead-inbox",
          icon: "search",
          children: [
            { label: "Lead inbox", path: "/intake/pipeline/lead-inbox", icon: "mail" },
            { label: "Conflict check", path: "/intake/pipeline/conflict-check", icon: "shield" },
            { label: "Questionnaire", path: "/intake/pipeline/questionnaire", icon: "clipboard" },
            { label: "Consultation & notes", path: "/intake/pipeline/consultation", icon: "file" },
            { label: "Fee agreement", path: "/intake/pipeline/fee-agreement", icon: "signature" },
            { label: "Case opening", path: "/intake/pipeline/case-opening", icon: "folder" },
          ],
        },
        { label: "CRM & leads", path: "/intake/crm-leads", icon: "chart" },
      ],
    },
  ],
  cases: [
    {
      label: "Cases",
      items: [
        {
          label: "Cases",
          path: "/cases",
          icon: "folder",
          children: [
            { label: "All matters", path: "/cases/all-matters", icon: "briefcase" },
            { label: "Policy alerts", path: "/cases/policy-alerts", icon: "shield" },
          ],
        },
      ],
    },
  ],
  staff: [
    {
      label: "Staff",
      items: [
        {
          label: "Staff & users",
          path: "/staff",
          icon: "users",
          children: [
            { label: "Staff accounts", path: "/staff/accounts", icon: "users" },
            { label: "Certifications", path: "/staff/certifications", icon: "book-open-check" },
            { label: "Performance", path: "/staff/performance", icon: "analytics" },
            { label: "Leave management", path: "/staff/leave-management", icon: "calendar" },
          ],
        },
        {
          label: "Contractors",
          path: "/staff/contractors",
          icon: "briefcase",
          children: [
            { label: "Marketplace", path: "/staff/contractors/marketplace", icon: "search" },
            { label: "Active engagements", path: "/staff/contractors/active-engagements", icon: "lock" },
          ],
        },
      ],
    },
  ],
  finance: [
    {
      label: "Finance",
      items: [
        {
          label: "Billing & finance",
          path: "/finance",
          icon: "billing",
          children: [
            { label: "Invoicing", path: "/finance/invoicing", icon: "file" },
            { label: "Trust accounts", path: "/finance/trust-accounts", icon: "landmark" },
            { label: "International payments", path: "/finance/international-payments", icon: "globe" },
          ],
        },
      ],
    },
  ],
  analytics: [
    {
      label: "Analytics",
      items: [
        {
          label: "Analytics",
          path: "/analytics",
          icon: "analytics",
          children: [
            { label: "Firm overview", path: "/analytics/firm-overview", icon: "overview" },
            { label: "Revenue & billing", path: "/analytics/revenue-billing", icon: "billing" },
            { label: "Staff performance", path: "/analytics/staff-performance", icon: "users" },
            { label: "Intake & CRM", path: "/analytics/intake-crm", icon: "intake" },
            { label: "Compliance", path: "/analytics/compliance", icon: "shield" },
          ],
        },
      ],
    },
  ],
  settings: [
    {
      label: "Settings",
      items: [
        {
          label: "Settings",
          path: "/settings",
          icon: "settings",
          children: [
            { label: "Add-on activation", path: "/settings/add-on-activation", icon: "intake" },
            { label: "RBAC", path: "/settings/rbac", icon: "shield" },
            { label: "Integrations", path: "/settings/integrations", icon: "briefcase" },
            { label: "Firm settings", path: "/settings/firm-settings", icon: "settings" },
            { label: "Training platform", path: "/settings/training-platform", icon: "education" },
            { label: "Education & leads", path: "/settings/education-leads", icon: "education" },
          ],
        },
      ],
    },
  ],
};

export function getSectionForPath(pathname: string): PrimarySection {
  if (pathname.startsWith("/intake")) return "intake";
  if (pathname.startsWith("/cases")) return "cases";
  if (pathname.startsWith("/staff")) return "staff";
  if (pathname.startsWith("/finance")) return "finance";
  if (pathname.startsWith("/analytics")) return "analytics";
  if (pathname.startsWith("/settings")) return "settings";
  return "overview";
}
