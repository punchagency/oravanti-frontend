import { Plus } from "lucide-react";
import { Link, NavLink } from "react-router";
import { dashboardTabs } from "../data";

export function DashboardHeader() {
  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Chen & Associates LLP — firm overview</p>
        </div>
        <Link className="brand-button" to="/admin/intake/pipeline/lead-inbox">
          <Plus size={15} />
          Add new matter
        </Link>
      </header>

      <nav className="content-tabs" aria-label="Dashboard views">
        {dashboardTabs.map(([label, path]) => (
          <NavLink
            key={label}
            className={({ isActive }) =>
              isActive ? "tab-link is-active" : "tab-link"
            }
            end={path === "/admin"}
            to={path}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
