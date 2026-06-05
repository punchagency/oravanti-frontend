import { Button } from "@chakra-ui/react";
import {
  BarChart3,
  BriefcaseBusiness,
  Home,
  Settings,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router";
import { ColorModeButton } from "@/components/ui/color-mode";
import { contextNavigation, primaryNavigation } from "@/utilities/navigation";

const iconMap: Record<string, LucideIcon> = {
  analytics: BarChart3,
  cases: BriefcaseBusiness,
  clients: Users,
  dashboard: Home,
  settings: Settings,
};

function getLinkClass(baseClassName: string, isActive: boolean) {
  return isActive ? `${baseClassName} is-active` : baseClassName;
}

export function PrimaryNavigation() {
  return (
    <nav className="primary-nav" aria-label="Primary navigation">
      <div className="primary-nav__brand" aria-label="Oravanti">
        O
      </div>
      {primaryNavigation.map((item) => {
        const Icon = iconMap[item.icon];

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              getLinkClass("primary-nav__item", isActive)
            }
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export function ContextNavigation() {
  return (
    <aside className="context-nav" aria-label="Admin navigation">
      <header className="context-nav__header">
        <h1 className="context-nav__title">Oravanti</h1>
        <p className="context-nav__subtitle">Firm admin portal</p>
      </header>

      {contextNavigation.map((group) => (
        <section key={group.label} className="context-nav__group">
          <div className="context-nav__group-label">{group.label}</div>
          {group.items.map((item) => {
            const Icon = iconMap[item.icon];

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  getLinkClass("context-nav__item", isActive)
                }
              >
                <Icon size={16} strokeWidth={1.8} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </section>
      ))}

      <footer className="context-nav__footer">
        <div className="trial-card">
          <p className="trial-card__title">Complete tier preview</p>
          <p className="trial-card__copy">
            Core shell ready for module buildout.
          </p>
        </div>
        <Button className="brand-button" size="sm" borderRadius="8px">
          Invite staff
        </Button>
        <ColorModeButton color="var(--nav-active-text)" />
      </footer>
    </aside>
  );
}
