export { NavProvider, useNav, usePageTitle, PageTitle } from "./nav-context";
export { TopBar } from "./top-bar";
export { DesktopNav } from "./desktop-nav";
export { MobileNavDrawer } from "./mobile-nav-drawer";
export { QuickActions } from "./quick-actions";
export { NavContent } from "./nav-content";
export { NavItem, iconMap, hasActiveChild } from "./nav-item";

import { DesktopNav } from "./desktop-nav";

export {
  DesktopNav as ContextNavigation,
  DesktopNav as PrimaryNavigation,
  DesktopNav as SideNavigation,
};
