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
  | "folder-open"
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
  | "chart-pie"
  | "chart-column-big"
  | "rss"
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
  { label: "Overview", section: "overview", path: "/admin", icon: "dashboard" },
  {
    label: "Intake",
    section: "intake",
    path: "/admin/intake/pipeline/lead-inbox",
    icon: "intake",
  },
  {
    label: "Cases",
    section: "cases",
    path: "/admin/cases/all-matters",
    icon: "folder",
  },
  {
    label: "Staff",
    section: "staff",
    path: "/admin/staff-management",
    icon: "users",
  },
  {
    label: "Finance",
    section: "finance",
    path: "/admin/finance/invoicing",
    icon: "billing",
  },
  {
    label: "Analytics",
    section: "analytics",
    path: "/admin/analytics/firm-overview",
    icon: "analytics",
  },
  {
    label: "Settings",
    section: "settings",
    path: "/admin/settings/add-on-activation",
    icon: "settings",
  },
];

export const contextNavigation: Record<
  PrimarySection,
  ContextNavigationGroup[]
> = {
  overview: [
    {
      label: "Overview",
      items: [{ label: "Dashboard", path: "/admin", icon: "dashboard" }],
    },
  ],
  intake: [
    {
      label: "Client intake",
      items: [
        {
          label: "Intake pipeline",
          path: "/admin/intake/pipeline/lead-inbox",
          icon: "intake",
          children: [
            {
              label: "Lead inbox",
              path: "/admin/intake/pipeline/lead-inbox",
              icon: "mail",
            },
            {
              label: "Conflict check",
              path: "/admin/intake/pipeline/conflict-check",
              icon: "shield",
            },
            {
              label: "Questionnaire",
              path: "/admin/intake/pipeline/questionnaire",
              icon: "clipboard",
            },
            {
              label: "Consultation & notes",
              path: "/admin/intake/pipeline/consultation",
              icon: "file",
            },
            {
              label: "Fee agreement",
              path: "/admin/intake/pipeline/fee-agreement",
              icon: "signature",
            },
            {
              label: "Case opening",
              path: "/admin/intake/pipeline/case-opening",
              icon: "folder",
            },
          ],
        },
        {
          label: "CRM & leads",
          path: "/admin/intake/crm-leads",
          icon: "chart-pie",
        },
      ],
    },
  ],
  cases: [
    {
      label: "Cases & operations",
      items: [
        {
          label: "Cases",
          path: "/admin/cases/all-matters",
          icon: "folder",
          children: [
            {
              label: "All matters",
              path: "/admin/cases/all-matters",
              icon: "folder-open",
            },
            {
              label: "Policy alerts",
              path: "/admin/cases/policy-alerts",
              icon: "rss",
            },
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
          label: "Staff Management",
          path: "/admin/staff-management",
          icon: "users",
          children: [
            {
              label: "Staff accounts",
              path: "/admin/staff-management",
              icon: "users",
            },
            {
              label: "Certifications",
              path: "/admin/staff-management/certifications",
              icon: "book-open-check",
            },
            {
              label: "Performance",
              path: "/admin/staff-management/performance",
              icon: "chart-column-big",
            },
            {
              label: "Leave management",
              path: "/admin/staff-management/leave",
              icon: "calendar",
            },
          ],
        },
        {
          label: "Contractors",
          path: "/admin/staff/contractors/marketplace",
          icon: "briefcase",
          children: [
            {
              label: "Marketplace",
              path: "/admin/staff/contractors/marketplace",
              icon: "search",
            },
            {
              label: "Active engagements",
              path: "/admin/staff/contractors/active-engagements",
              icon: "lock",
            },
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
          path: "/admin/finance/invoicing",
          icon: "billing",
          children: [
            {
              label: "Invoicing",
              path: "/admin/finance/invoicing",
              icon: "file",
            },
            {
              label: "Trust accounts",
              path: "/admin/finance/trust-accounts",
              icon: "landmark",
            },
            {
              label: "International payments",
              path: "/admin/finance/international-payments",
              icon: "globe",
            },
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
          path: "/admin/analytics/firm-overview",
          icon: "analytics",
          children: [
            {
              label: "Firm overview",
              path: "/admin/analytics/firm-overview",
              icon: "overview",
            },
            {
              label: "Revenue & billing",
              path: "/admin/analytics/revenue-billing",
              icon: "billing",
            },
            {
              label: "Staff performance",
              path: "/admin/analytics/staff-performance",
              icon: "users",
            },
            {
              label: "Intake & CRM",
              path: "/admin/analytics/intake-crm",
              icon: "intake",
            },
            {
              label: "Compliance",
              path: "/admin/analytics/compliance",
              icon: "shield",
            },
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
          path: "/admin/settings/add-on-activation",
          icon: "settings",
          children: [
            {
              label: "Add-on activation",
              path: "/admin/settings/add-on-activation",
              icon: "intake",
            },
            { label: "RBAC", path: "/admin/settings/rbac", icon: "shield" },
            {
              label: "Integrations",
              path: "/admin/settings/integrations",
              icon: "briefcase",
            },
            {
              label: "Email accounts",
              path: "/admin/settings/email-accounts",
              icon: "mail",
            },
            {
              label: "Firm settings",
              path: "/admin/settings/firm-settings",
              icon: "settings",
            },
            {
              label: "Training platform",
              path: "/admin/settings/training-platform",
              icon: "education",
            },
            {
              label: "Education & leads",
              path: "/admin/settings/education-leads",
              icon: "education",
            },
          ],
        },
      ],
    },
  ],
};

export function getSectionForPath(pathname: string): PrimarySection {
  const adminScopedPath = pathname.startsWith("/admin/")
    ? pathname.slice("/admin".length)
    : pathname;

  if (adminScopedPath.startsWith("/intake")) return "intake";
  if (adminScopedPath.startsWith("/cases")) return "cases";
  if (adminScopedPath.startsWith("/staff")) return "staff";
  if (adminScopedPath.startsWith("/finance")) return "finance";
  if (adminScopedPath.startsWith("/analytics")) return "analytics";
  if (adminScopedPath.startsWith("/settings")) return "settings";
  return "overview";
}
