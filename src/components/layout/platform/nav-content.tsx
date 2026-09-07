import { ScrollArea } from "@chakra-ui/react";
import { useLocation } from "react-router";

import { NavItem } from "@/components/layout/shared/nav-item";
import type { ContextNavigationItem } from "@/utils/navigation";

/*
  The CRM's three destinations.

  Declared here rather than in `utils/navigation.ts` for the reason the client
  portal declares its own: that module's `primaryNavigation` is keyed by
  `PrimarySection`, which is the firm app's own vocabulary — leads, matters,
  billing. Adding platform sections to it would widen a union that
  `getSectionForPath` then has to ignore on every firm request.

  Flat, with no children. The firm's nav nests because a section like Matters
  has six pages under it; a form catalogue has one list and the detail behind
  it, and a collapsible group holding a single link is a chevron that does
  nothing.
*/
const PLATFORM_NAV: ContextNavigationItem[] = [
  { label: "Overview", path: "/platform", icon: "overview" },
  { label: "Practice areas", path: "/platform/practice-areas", icon: "briefcase" },
  { label: "Forms", path: "/platform/forms", icon: "file" },
];

/*
  Questionnaires has no entry of its own, deliberately.

  A questionnaire belongs to a case type — that is the unique key it is stored
  under — so the way to reach one is that case type's page, where the Intake and
  Case tabs each show the one that exists or offer to create the one that does
  not. A top-level entry would be a second way in that answers neither of the
  two questions the page needs answered before it can create anything.

  `/platform/questionnaires` is still a route and still a real answer to "show
  me every questionnaire we ship"; it is simply not a place to start from.
*/

/**
 * Whether `path` is the page being looked at, or the list a detail page came
 * from.
 *
 * Most of the routes here are detail pages — `/platform/forms/I-485`, a case
 * type, a questionnaire by id — so an exact match would leave the rail showing
 * nothing selected for most of the time somebody spends working. Overview is
 * the exception: it is the prefix of everything, so it only lights up on
 * itself.
 */
const isCurrent = (pathname: string, path: string) => {
  if (path === "/platform") return pathname === "/platform";
  if (pathname === path || pathname.startsWith(`${path}/`)) return true;

  /*
    Everything below a practice area is addressed from the root — see the
    router — so those pages do not sit under `/platform/practice-areas` as
    paths even though they do as a hierarchy. Named here rather than by nesting
    the routes, because the alternative was carrying redundant ids in every URL.

    Questionnaires are in this list rather than in the nav for the reason above:
    the rail should say where you are in the tree, and a questionnaire is at the
    bottom of one.
  */
  return (
    path === "/platform/practice-areas" &&
    (pathname.startsWith("/platform/subcategories/") ||
      pathname.startsWith("/platform/case-types/") ||
      pathname.startsWith("/platform/questionnaires"))
  );
};

export function PlatformNavContent({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const location = useLocation();

  return (
    <ScrollArea.Root flex="1" size="xs">
      <ScrollArea.Viewport
        py={3}
        pl={collapsed ? 1 : 2}
        pr={collapsed ? 1 : 2.5}
      >
        <ScrollArea.Content>
          {PLATFORM_NAV.map((item) => (
            <NavItem
              key={item.path}
              item={item}
              active={isCurrent(location.pathname, item.path)}
              onNavigate={onNavigate}
              collapsed={collapsed}
            />
          ))}
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar>
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}
