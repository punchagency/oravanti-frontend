import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Box } from "@chakra-ui/react";
import {
  NavContext,
  PageTitleContext,
  usePageTitle,
} from "@/components/layout/shared/use-nav";

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
    forceCollapse: bump collapseSignal so DesktopNav collapses the
    sidebar on its next render. Used when a Quick Actions menu item
    is clicked so the sidebar shrinks back while the dialog opens in
    front of it. See the mechanism comment in use-nav.ts.
  */
  const forceCollapse = useCallback(() => setCollapseSignal((c) => c + 1), []);

  /*
    Memoized values: a fresh object literal here re-renders every consumer
    whenever ANY provider state changes (e.g. a page-title update would
    re-render the whole nav tree for nothing).
  */
  const navValue = useMemo(
    () => ({
      collapsed,
      toggleCollapsed,
      mobileOpen,
      onMobileOpen,
      onMobileClose,
      suppressCollapse,
      setSuppressCollapse,
      forceCollapse,
      collapseSignal,
    }),
    [
      collapsed,
      mobileOpen,
      suppressCollapse,
      collapseSignal,
      toggleCollapsed,
      onMobileOpen,
      onMobileClose,
      setSuppressCollapse,
      forceCollapse,
    ],
  );

  const pageTitleValue = useMemo(
    () => ({
      title: pageTitle,
      isVisible: pageTitleVisible,
      setTitle: setPageTitle,
      setIsVisible: setPageTitleVisible,
    }),
    [pageTitle, pageTitleVisible],
  );

  return (
    <NavContext.Provider value={navValue}>
      <PageTitleContext.Provider value={pageTitleValue}>
        {children}
      </PageTitleContext.Provider>
    </NavContext.Provider>
  );
}
