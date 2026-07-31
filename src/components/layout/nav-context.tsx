import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Box } from "@chakra-ui/react";

const NavContext = createContext<{
  collapsed: boolean;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  onMobileOpen: () => void;
  onMobileClose: () => void;
  suppressCollapse: boolean;
  setSuppressCollapse: (v: boolean) => void;
  forceCollapse: () => void;
  collapseSignal: number;
}>({
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
  │   – desktop-nav: useEffect watches collapseSignal →          │
  │     setHovered(false), instantly collapsing the sidebar       │
  │   – then suppressCollapse keeps it collapsed while dialog    │
  │     is open (mouse can't re-expand it via onMouseEnter)      │
  ├─────────────────────────────────────────────────────────────┤
  │ QuickActions: also renders unconditionally in nav-content    │
  │ (not inside a conditional branch) so dialog useState         │
  │ survives sidebar collapse/expand remounts.                   │
  └─────────────────────────────────────────────────────────────┘
*/

export function useNav() {
  return useContext(NavContext);
}

const PageTitleContext = createContext<{
  title: string;
  isVisible: boolean;
  setTitle: (title: string) => void;
  setIsVisible: (visible: boolean) => void;
}>({
  title: "",
  isVisible: true,
  setTitle: () => {},
  setIsVisible: () => {},
});

export function usePageTitle() {
  return useContext(PageTitleContext);
}

export function PageTitle({ children }: { children: ReactNode }) {
  const { setTitle, setIsVisible } = usePageTitle();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const text = node.textContent?.trim() ?? "";
    if (text) setTitle(text);

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-52px 0px 0px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [setTitle, setIsVisible]);

  return <Box ref={ref}>{children}</Box>;
}

export function NavProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState("");
  const [pageTitleVisible, setPageTitleVisible] = useState(true);
  const [suppressCollapse, setSuppressCollapse] = useState(false);
  const [collapseSignal, setCollapseSignal] = useState(0);
  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), []);
  const onMobileOpen = useCallback(() => setMobileOpen(true), []);
  const onMobileClose = useCallback(() => setMobileOpen(false), []);
  /*
    forceCollapse: bump collapseSignal so DesktopNav's useEffect
    fires setHovered(false), immediately collapsing the sidebar.
    Used when a Quick Actions menu item is clicked so the sidebar
    shrinks back while the dialog opens in front of it.
  */
  const forceCollapse = useCallback(() => setCollapseSignal((c) => c + 1), []);

  return (
    <NavContext.Provider
      value={{
        collapsed,
        toggleCollapsed,
        mobileOpen,
        onMobileOpen,
        onMobileClose,
        suppressCollapse,
        setSuppressCollapse,
        forceCollapse,
        collapseSignal,
      }}
    >
      <PageTitleContext.Provider
        value={{
          title: pageTitle,
          isVisible: pageTitleVisible,
          setTitle: setPageTitle,
          setIsVisible: setPageTitleVisible,
        }}
      >
        {children}
      </PageTitleContext.Provider>
    </NavContext.Provider>
  );
}
