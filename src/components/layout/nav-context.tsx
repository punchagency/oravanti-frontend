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
