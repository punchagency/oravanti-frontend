import { ColorModeButton } from "@/components/ui/color-mode";
import {
  contextNavigation,
  getSectionForPath,
  primaryNavigation,
  type ContextNavigationItem,
  type NavigationIcon,
} from "@/utils/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarDays,
  ChartColumn,
  ChartColumnBig,
  ChartNetwork,
  ChartPie,
  ChevronDown,
  ClipboardList,
  Download,
  FileText,
  Folder,
  FolderOpen,
  Globe,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  Lock,
  Mail,
  MessageSquareText,
  Moon,
  Rss,
  Search,
  Settings,
  Shield,
  Signature,
  UserRoundPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router";

const iconMap: Record<NavigationIcon, LucideIcon> = {
  analytics: ChartNetwork,
  billing: FileText,
  briefcase: BriefcaseBusiness,
  calendar: CalendarDays,
  chart: BarChart3,
  "chart-column-big": ChartColumnBig,
  lock: Lock,
  chevron: ChevronDown,
  clipboard: ClipboardList,
  dashboard: LayoutDashboard,
  download: Download,
  education: GraduationCap,
  file: FileText,
  folder: Folder,
  "folder-open": FolderOpen,
  globe: Globe,
  landmark: Landmark,
  mail: Mail,
  message: MessageSquareText,
  moon: Moon,
  intake: UserRoundPlus,
  rss: Rss,
  search: Search,
  settings: Settings,
  shield: Shield,
  signature: Signature,
  users: Users,
  overview: ChartColumn,
  "book-open-check": BookOpenCheck,
  "chart-pie": ChartPie,
};

function isPathActive(currentPath: string, item: ContextNavigationItem) {
  if (currentPath === item.path) return true;
  return item.children?.some((child) => currentPath === child.path) ?? false;
}

function ContextItem({
  item,
  nested = false,
  collapsedItems,
  onToggle,
}: {
  item: ContextNavigationItem;
  nested?: boolean;
  collapsedItems: Set<string>;
  onToggle: (path: string) => void;
}) {
  const location = useLocation();
  const Icon = iconMap[item.icon];
  const active = isPathActive(location.pathname, item);
  const hasChildren = Boolean(item.children?.length);
  const expanded = hasChildren && active && !collapsedItems.has(item.path);
  const className = [
    nested ? "context-nav__sub-item" : "context-nav__item",
    active ? "is-active" : "",
    expanded ? "is-expanded" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <NavLink
        to={item.path}
        className={className}
        onClick={(event) => {
          if (!hasChildren) return;

          if (active) {
            event.preventDefault();
            onToggle(item.path);
          }
        }}
      >
        <Icon size={nested ? 13 : 15} strokeWidth={1.8} />
        <span>{item.label}</span>
        {hasChildren ? (
          <ChevronDown className="context-nav__chevron" size={14} />
        ) : null}
      </NavLink>
      {expanded ? (
        <div className="context-nav__children">
          {item.children?.map((child) => (
            <ContextItem
              key={child.path}
              item={child}
              nested
              collapsedItems={collapsedItems}
              onToggle={onToggle}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}

export function PrimaryNavigation() {
  const location = useLocation();
  const activeSection = getSectionForPath(location.pathname);
  const topItems = primaryNavigation.slice(0, 5);
  const bottomItems = primaryNavigation.slice(5);

  return (
    <nav className="primary-nav" aria-label="Primary navigation">
      <div className="primary-nav__brand" aria-label="Oravanti">
        Ov
      </div>

      <div className="primary-nav__items">
        {topItems.map((item) => {
          const Icon = iconMap[item.icon];
          const active = item.section === activeSection;

          return (
            <NavLink
              key={item.section}
              to={item.path}
              className={
                active ? "primary-nav__item is-active" : "primary-nav__item"
              }
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="primary-nav__bottom">
        {bottomItems.map((item) => {
          const Icon = iconMap[item.icon];
          const active = item.section === activeSection;

          return (
            <NavLink
              key={item.section}
              to={item.path}
              className={
                active ? "primary-nav__item is-active" : "primary-nav__item"
              }
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
        <ColorModeButton className="primary-nav__theme-button" />
        <div className="primary-nav__avatar" aria-label="Rachel Abubakar">
          RA
        </div>
      </div>
    </nav>
  );
}

export function ContextNavigation() {
  const location = useLocation();
  const activeSection = getSectionForPath(location.pathname);
  const groups = contextNavigation[activeSection];
  const [collapsedState, setCollapsedState] = useState<{
    pathname: string;
    items: Set<string>;
  }>({ pathname: "", items: new Set() });
  const collapsedItems =
    collapsedState.pathname === location.pathname
      ? collapsedState.items
      : new Set<string>();

  function toggleOpenItem(path: string) {
    setCollapsedState((current) => {
      const next =
        current.pathname === location.pathname
          ? new Set(current.items)
          : new Set<string>();

      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }

      return { pathname: location.pathname, items: next };
    });
  }

  return (
    <aside className="context-nav" aria-label="Section navigation">
      <header className="context-nav__header">
        <h1 className="context-nav__title">Oravanti</h1>
        <span className="context-nav__badge">Firm admin</span>
      </header>

      <div className="context-nav__scroll">
        {groups.map((group) => (
          <section key={group.label} className="context-nav__group">
            <div className="context-nav__group-label">{group.label}</div>
            {group.items.map((item) => (
              <ContextItem
                key={item.path}
                item={item}
                collapsedItems={collapsedItems}
                onToggle={toggleOpenItem}
              />
            ))}
          </section>
        ))}
      </div>

      <footer className="context-nav__footer">
        <div className="trial-card">
          <div className="trial-card__ring" />
          <div>
            <p className="trial-card__title">Advanced free trial</p>
            <p className="trial-card__copy">5 days left</p>
          </div>
          <button className="trial-card__button" type="button">
            Upgrade plan
          </button>
        </div>

        <button className="context-nav__invite" type="button">
          <Mail size={13} />
          Invite staff
        </button>

        <div className="context-nav__user">
          <div className="context-nav__avatar">RA</div>
          <div>
            <p>Rachel Abubakar</p>
            <span>Managing partner</span>
          </div>
        </div>
      </footer>
    </aside>
  );
}
