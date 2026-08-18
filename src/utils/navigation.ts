export type PrimarySection =
  | "overview"
  | "intake"
  | "cases"
  | "staff-management"
  | "billing-and-finance"
  | "calendar"
  | "analytics"
  | "ai-review"
  | "settings";

export type NavigationIcon =
  | "analytics"
  | "billing"
  | "briefcase"
  | "calendar"
  | "calendar-check"
  | "chart"
  | "lock"
  | "chevron"
  | "clipboard"
  | "dashboard"
  | "documents"
  | "download"
  | "education"
  | "file"
  | "file-clock"
  | "file-plus"
  | "package"
  | "template"
  | "folder"
  | "folder-open"
  | "gavel"
  | "signature"
  | "mail"
  | "message"
  | "moon"
  | "intake"
  | "search"
  | "settings"
  | "shield"
  | "shield-check"
  | "globe"
  | "landmark"
  | "book-open-check"
  | "chart-pie"
  | "chart-column-big"
  | "rss"
  | "overview"
  | "ai-review"
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
  { label: "Overview", section: "overview", path: "/", icon: "dashboard" },
  {
    label: "Leads",
    section: "intake",
    path: "/leads",
    icon: "intake",
  },
  {
    label: "Cases",
    section: "cases",
    path: "/cases",
    icon: "folder",
  },
  {
    label: "Calendar",
    section: "calendar",
    path: "/calendar",
    icon: "calendar",
  },
  {
    label: "AI Review",
    section: "ai-review",
    path: "/ai-review",
    icon: "ai-review",
  },
  {
    label: "Staff Management",
    section: "staff-management",
    path: "/staff-management",
    icon: "users",
  },
  {
    label: "Billing & Finance",
    section: "billing-and-finance",
    path: "/finance/invoicing",
    icon: "billing",
  },
  {
    label: "Analytics",
    section: "analytics",
    path: "/analytics/firm-overview",
    icon: "analytics",
  },
  {
    label: "Settings",
    section: "settings",
    path: "/settings/add-on-activation",
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
      items: [{ label: "Dashboard", path: "/", icon: "dashboard" }],
    },
  ],
  intake: [
    {
      label: "Leads",
      items: [
        {
          label: "All leads",
          path: "/leads",
          icon: "intake",
        },
        {
          label: "My tasks",
          path: "/leads/my-tasks",
          icon: "clipboard",
        },
        {
          label: "Review queue",
          path: "/leads/review-queue",
          icon: "clipboard",
        },
        {
          label: "CRM & leads",
          path: "/intake/crm-leads",
          icon: "chart-pie",
        },
      ],
    },
  ],
  cases: [
    {
      label: "Cases",
      items: [
        {
          label: "All matters",
          path: "/cases",
          icon: "folder-open",
        },
        {
          label: "My tasks",
          path: "/cases/my-tasks",
          icon: "clipboard",
        },
        {
          label: "Review queue",
          path: "/cases/review-queue",
          icon: "shield",
        },
        {
          label: "Policy alerts",
          path: "/cases/policy-alerts",
          icon: "rss",
        },
      ],
    },
  ],
  ["staff-management"]: [
    {
      label: "Staff Management",
      items: [
        // Mirrors `tabsConfig` in the staff-management page, so the sidebar and
        // the page's own tab strip stay in the same order.
        {
          label: "Staff accounts",
          path: "/staff-management",
          icon: "users",
        },
        {
          label: "Teams",
          path: "/staff-management/teams",
          icon: "briefcase",
        },
        {
          label: "Certifications",
          path: "/staff-management/certifications",
          icon: "book-open-check",
        },
        {
          label: "Performance",
          path: "/staff-management/performance",
          icon: "chart-column-big",
        },
        {
          label: "Time tracking",
          path: "/staff-management/time-tracking",
          icon: "file-clock",
        },
        {
          label: "Leave management",
          path: "/staff-management/leave",
          icon: "calendar",
        },
        {
          label: "Invitations",
          path: "/staff-management/invitations",
          icon: "mail",
        },
      ],
    },
    {
      label: "Contractors",
      items: [
        {
          label: "Marketplace",
          path: "/staff/contractors/marketplace",
          icon: "search",
        },
        {
          label: "Active engagements",
          path: "/staff/contractors/active-engagements",
          icon: "lock",
        },
      ],
    },
  ],
  ["billing-and-finance"]: [
    {
      label: "Billing & finance",
      items: [
        {
          label: "Invoicing",
          path: "/finance/invoicing",
          icon: "file",
        },
        {
          label: "Time & billing",
          path: "/finance/time-billing",
          icon: "file-clock",
        },
        {
          label: "Reports",
          path: "/finance/reports",
          icon: "chart",
        },
      ],
    },
  ],
  calendar: [
    {
      label: "Calendar",
      items: [
        {
          label: "All events",
          path: "/calendar",
          icon: "calendar",
        },
        {
          label: "Hearings",
          path: "/calendar/hearings",
          icon: "gavel",
        },
        {
          label: "Gov. interviews",
          path: "/calendar/interviews",
          icon: "landmark",
        },
        {
          label: "Filing deadlines",
          path: "/calendar/deadlines",
          icon: "file-clock",
        },
        {
          label: "Appointments",
          path: "/calendar/appointments",
          icon: "calendar-check",
        },
      ],
    },
    {
      label: "Management",
      items: [
        {
          label: "Deadline rules",
          path: "/calendar/deadline-rules",
          icon: "shield-check",
        },
        {
          label: "Service requests",
          path: "/calendar/service-requests",
          icon: "clipboard",
        },
      ],
    },
  ],
  analytics: [
    {
      label: "Analytics",
      items: [
        {
          label: "Firm overview",
          path: "/analytics/firm-overview",
          icon: "overview",
        },
        {
          label: "Revenue & billing",
          path: "/analytics/revenue-billing",
          icon: "billing",
        },
        {
          label: "Staff performance",
          path: "/analytics/staff-performance",
          icon: "users",
        },
        {
          label: "Intake & CRM",
          path: "/analytics/intake-crm",
          icon: "intake",
        },
        {
          label: "Compliance",
          path: "/analytics/compliance",
          icon: "shield",
        },
      ],
    },
  ],
  "ai-review": [
    {
      label: "AI Detection",
      items: [
        { label: "Error dashboard", path: "/ai-review", icon: "shield" },
        { label: "By case", path: "/ai-review/by-case", icon: "briefcase" },
        { label: "By document", path: "/ai-review/by-document", icon: "file" },
      ],
    },
    {
      label: "Resolved",
      items: [
        {
          label: "Resolution log",
          path: "/ai-review/resolution-log",
          icon: "clipboard",
        },
      ],
    },
    {
      label: "Configuration",
      items: [
        { label: "Settings", path: "/ai-review/settings", icon: "settings" },
      ],
    },
  ],
  settings: [
    {
      label: "Settings",
      items: [
        {
          label: "My profile",
          path: "/profile",
          icon: "users",
        },
        {
          label: "Add-on activation",
          path: "/settings/add-on-activation",
          icon: "intake",
        },
        {
          label: "RBAC",
          path: "/settings/rbac",
          icon: "shield",
        },
        {
          label: "Integrations",
          path: "/settings/integrations",
          icon: "briefcase",
        },
        {
          label: "Email accounts",
          path: "/settings/email-accounts",
          icon: "mail",
        },
        {
          label: "Firm settings",
          path: "/settings/firm-settings",
          icon: "settings",
        },
        {
          label: "Audit trail",
          path: "/settings/audit-trail",
          icon: "clipboard",
        },
        {
          label: "Training platform",
          path: "/settings/training-platform",
          icon: "education",
        },
        {
          label: "Education & leads",
          path: "/settings/education-leads",
          icon: "education",
        },
      ],
    },
  ],
};

export function getSectionForPath(pathname: string): PrimarySection {
  if (pathname.startsWith("/intake") || pathname.startsWith("/leads"))
    return "intake";
  if (pathname.startsWith("/cases")) return "cases";
  if (pathname.startsWith("/ai-review")) return "ai-review";
  if (pathname.startsWith("/staff")) return "staff-management";
  if (pathname.startsWith("/finance")) return "billing-and-finance";
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/analytics")) return "analytics";
  if (pathname.startsWith("/settings")) return "settings";
  return "overview";
}
