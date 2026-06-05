export type NavigationItem = {
  label: string;
  path: string;
  icon: "analytics" | "cases" | "clients" | "dashboard" | "settings";
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

export const primaryNavigation: NavigationItem[] = [
  { label: "Home", path: "/dashboard", icon: "dashboard" },
  { label: "Clients", path: "/clients", icon: "clients" },
  { label: "Cases", path: "/cases", icon: "cases" },
  { label: "Reports", path: "/analytics", icon: "analytics" },
  { label: "Settings", path: "/settings", icon: "settings" },
];

export const contextNavigation: NavigationGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", path: "/dashboard", icon: "dashboard" }],
  },
  {
    label: "Client intake",
    items: [{ label: "CRM and leads", path: "/clients", icon: "clients" }],
  },
  {
    label: "Cases and operations",
    items: [{ label: "Cases", path: "/cases", icon: "cases" }],
  },
  {
    label: "Analytics",
    items: [{ label: "Firm overview", path: "/analytics", icon: "analytics" }],
  },
  {
    label: "Platform settings",
    items: [{ label: "Settings", path: "/settings", icon: "settings" }],
  },
];
