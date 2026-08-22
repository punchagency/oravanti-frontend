import { createContext, useContext } from "react";

/*
  Contexts and hooks live here, apart from the components that provide
  them (nav-context.tsx), so that file exports components only and Vite
  fast refresh keeps working on it.
*/

/*
  Sidebar hover-expand fix (Quick Actions menu→dialog flow)
  ───────────────────────────────────────────────────────────
  PROBLEM: When sidebar is in collapsed+click mode, hovering
  expands it. The Quick Actions menu is portaled outside the
  sidebar DOM. Moving the mouse from sidebar into the menu
  triggers onMouseLeave → sidebar collapses, closing dialogs.

  MECHANISM:
  ┌─────────────────────────────────────────────────────────────┐
  │ suppressCollapse (boolean)                                   │
  │   – set by QuickActions when menu OR any dialog is open      │
  │   – desktop-nav: gated on both onMouseEnter & onMouseLeave   │
  │     so sidebar stays in its current state (expanded stays    │
  │     expanded, collapsed stays collapsed)                     │
  ├─────────────────────────────────────────────────────────────┤
  │ forceCollapse() → collapseSignal (number, bumped each call)  │
  │   – called when a menu item is clicked (dialog opens)        │
  │   – desktop-nav: compares collapseSignal against its previous │
  │     value during render → setHovered(false), instantly        │
  │     collapsing the sidebar                                    │
  │   – then suppressCollapse keeps it collapsed while dialog    │
  │     is open (mouse can't re-expand it via onMouseEnter)      │
  ├─────────────────────────────────────────────────────────────┤
  │ QuickActions: also renders unconditionally in nav-content    │
  │ (not inside a conditional branch) so dialog useState         │
  │ survives sidebar collapse/expand remounts.                   │
  └─────────────────────────────────────────────────────────────┘
*/

export interface NavContextValue {
  collapsed: boolean;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  onMobileOpen: () => void;
  onMobileClose: () => void;
  suppressCollapse: boolean;
  setSuppressCollapse: (v: boolean) => void;
  forceCollapse: () => void;
  collapseSignal: number;
}

export const NavContext = createContext<NavContextValue>({
  collapsed: false,
  toggleCollapsed: () => {},
  mobileOpen: false,
  onMobileOpen: () => {},
  onMobileClose: () => {},
  suppressCollapse: false,
  setSuppressCollapse: () => {},
  forceCollapse: () => {},
  collapseSignal: 0,
});

export function useNav() {
  return useContext(NavContext);
}

export interface PageTitleContextValue {
  title: string;
  isVisible: boolean;
  setTitle: (title: string) => void;
  setIsVisible: (visible: boolean) => void;
}

export const PageTitleContext = createContext<PageTitleContextValue>({
  title: "",
  isVisible: true,
  setTitle: () => {},
  setIsVisible: () => {},
});

export function usePageTitle() {
  return useContext(PageTitleContext);
}
