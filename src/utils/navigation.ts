export type PrimarySection =
  | "overview"
  | "intake"
  | "cases"
  | "staff"
  | "finance"
  | "calendar"
  | "analytics"
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
  | "download"
  | "education"
  | "file"
  | "file-clock"
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
    label: "Staff",
    section: "staff",
    path: "/staff-management",
    icon: "users",
  },
  {
    label: "Finance",
    section: "finance",
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
      label: "Cases & operations",
      items: [
        {
          label: "Cases",
          path: "/cases",
          icon: "folder",
          children: [
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
    },
  ],
  staff: [
    {
      label: "Staff",
      items: [
        {
          label: "Staff Management",
          path: "/staff-management",
          icon: "users",
          children: [
            {
              label: "Staff accounts",
              path: "/staff-management",
              icon: "users",
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
              label: "Leave management",
              path: "/staff-management/leave",
              icon: "calendar",
            },
          ],
        },
        {
          label: "Contractors",
          path: "/staff/contractors/marketplace",
          icon: "briefcase",
          children: [
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
    },
  ],
  finance: [
    {
      label: "Finance",
      items: [
        {
          label: "Billing & finance",
          path: "/finance/invoicing",
          icon: "billing",
          children: [
            {
              label: "Invoicing",
              path: "/finance/invoicing",
              icon: "file",
            },
            {
              label: "Trust accounts",
              path: "/finance/trust-accounts",
              icon: "landmark",
            },
            {
              label: "International payments",
              path: "/finance/international-payments",
              icon: "globe",
            },
          ],
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
          label: "Analytics",
          path: "/analytics/firm-overview",
          icon: "analytics",
          children: [
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
    },
  ],
  settings: [
    {
      label: "Settings",
      items: [
        {
          label: "Settings",
          path: "/settings/add-on-activation",
          icon: "settings",
          children: [
            {
              label: "Add-on activation",
              path: "/settings/add-on-activation",
              icon: "intake",
            },
            { label: "RBAC", path: "/settings/rbac", icon: "shield" },
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
    },
  ],
};

export function getSectionForPath(pathname: string): PrimarySection {
  if (pathname.startsWith("/intake") || pathname.startsWith("/leads")) return "intake";
  if (pathname.startsWith("/cases")) return "cases";
  if (pathname.startsWith("/staff")) return "staff";
  if (pathname.startsWith("/finance")) return "finance";
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/analytics")) return "analytics";
  if (pathname.startsWith("/settings")) return "settings";
  return "overview";
}
