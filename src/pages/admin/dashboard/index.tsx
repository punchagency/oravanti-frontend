import {
  AlertTriangle,
  BriefcaseBusiness,
  Clock,
  FileText,
  Plus,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router";
import { useDocumentTitle } from "@/hooks/use-document-title";

const metrics = [
  {
    label: "Active cases",
    value: "80",
    helper: "↑ from active add-ons",
    icon: BriefcaseBusiness,
  },
  {
    label: "Pending actions",
    value: "46",
    helper: "Awaiting review/action",
    icon: Clock,
  },
  {
    label: "Processing / issues",
    value: "33",
    helper: "Outside processing window",
    icon: UserRound,
  },
  {
    label: "Estimated revenue",
    value: "$96,000",
    helper: "Based on case volumes",
    icon: FileText,
  },
];

const chips = [
  ["All active", "#6b6252"],
  ["Immigration", "#00a878"],
  ["Business", "#6a00c7"],
  ["Employment", "#e14a2d"],
  ["Criminal defense", "#5e4500"],
  ["Family law", "#377dff"],
  ["Estate planning", "#d18400"],
  ["Real estate", "#007f67"],
  ["Personal injury", "#b00020"],
];

const alerts = [
  ["#e82c45", "RFE received — Chen Immigration matter", "Response due in 14 days · I-485 AOS", "2h ago"],
  ["#d18400", "Staff certification expiring", "Yemi Okafor — I-130 recertification due", "Today"],
  ["#d18400", "3 leads awaiting conflict check", "Assigned to Sandra Adeyemi for review", "Yesterday"],
  ["#6a00c7", "New policy alert — USCIS processing update", "I-485 average processing time revised", "1d ago"],
  ["#377dff", "Invoice overdue — Okonkwo matter", "$3,200 outstanding — 7 days overdue", "2d ago"],
];

const pipeline = [
  ["Lead inbox", "Awaiting review", "4", "neutral"],
  ["Conflict check", "Attorney review pending", "3", "warning"],
  ["Questionnaire", "Sent, awaiting completion", "2", "info"],
  ["Fee agreement", "Sent for eSignature", "1", "gold"],
  ["Case opening", "Ready to open", "2", "success"],
];

const matters = [
  ["Amara Chen", "I-485 AOS", "Active", "Yemi Okafor", "success"],
  ["James Okonkwo", "I-130", "RFE", "Sandra Adeyemi", "red"],
  ["Maria Santos", "N-400", "Active", "Yemi Okafor", "success"],
  ["David Kim", "H-1B", "Pending", "Unassigned", "gold"],
  ["Aisha Patel", "I-589 Asylum", "Active", "Sandra Adeyemi", "success"],
];

const staff = [
  ["Sandra Adeyemi", "Attorney", "SA", "Active", "success", "mint"],
  ["Yemi Okafor", "Paralegal", "YO", "Active", "success", "gold"],
  ["Ruth Babatunde", "Case manager", "RB", "On leave", "neutral", "gold"],
  ["James Martinez", "Contractor", "JM", "Assigned", "purple", "rose"],
  ["Ayo Osei", "Paralegal", "AO", "Recertify", "red", "gold"],
];

const dashboardTabs = [
  ["Overview", "/admin"],
  ["Pipeline", "/admin/dashboard/pipeline"],
  ["Activity", "/admin/dashboard/activity"],
];

function DashboardHeader() {
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

export function AdminDashboardOverview() {
  useDocumentTitle("Dashboard - Oravanti");
  const [activeChip, setActiveChip] = useState(chips[0][0]);

  return (
    <>
      <DashboardHeader />

      <section className="metric-grid" aria-label="Dashboard metrics">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <article key={metric.label} className="surface-card metric-card">
              <p className="metric-label">
                <Icon size={14} strokeWidth={1.8} />
                {metric.label}
              </p>
              <p className="metric-value">{metric.value}</p>
              <p className="metric-helper">{metric.helper}</p>
            </article>
          );
        })}
      </section>

      <div className="chip-row">
        {chips.map(([label, color]) => (
          <button
            key={label}
            className={activeChip === label ? "chip is-active" : "chip"}
            type="button"
            onClick={() => setActiveChip(label)}
          >
            <span className="chip-dot" style={{ background: color }} />
            {label}
          </button>
        ))}
      </div>

      <section className="dashboard-grid">
        <article className="surface-card section-card dashboard-panel">
          <header className="section-card__header">
            <h2 className="section-heading section-heading-icon">
              <AlertTriangle size={16} color="var(--brand-cta)" /> Priority alerts
            </h2>
            <span className="alert-count">{alerts.length}</span>
          </header>
          <div className="alert-list">
            {alerts.map(([color, title, meta, time]) => (
              <div key={title} className="alert-row">
                <span className="chip-dot" style={{ background: color }} />
                <div>
                  <p className="row-title">{title}</p>
                  <p className="row-meta">{meta}</p>
                </div>
                <span className="row-time">{time}</span>
              </div>
            ))}
          </div>
          <Link className="section-card__footer-link" to="/admin/intake/pipeline/conflict-check">
            View all alerts →
          </Link>
        </article>

        <article className="surface-card section-card dashboard-panel">
          <h2 className="section-heading">Intake pipeline</h2>
          <p className="section-subtitle">Active leads by stage</p>
          <div className="pipeline-list">
            {pipeline.map(([title, meta, count, tone]) => (
              <NavLink key={title} className="pipeline-row" to="/admin/intake/pipeline/lead-inbox">
                <div>
                  <p className="row-title">{title}</p>
                  <p className="row-meta">{meta}</p>
                </div>
                <span className={`count-pill count-pill--${tone}`}>{count}</span>
              </NavLink>
            ))}
          </div>
          <Link className="section-card__footer-link" to="/admin/intake/pipeline/lead-inbox">
            Go to intake pipeline →
          </Link>
        </article>

        <article className="surface-card section-card dashboard-panel">
          <h2 className="section-heading">Recent matters</h2>
          <p className="section-subtitle">Last 5 opened or updated</p>
          <div className="matter-list">
            {matters.map(([name, matter, status, owner, tone]) => (
              <div key={name} className="matter-row">
                <p className="row-title">{name}</p>
                <span className="matter-type">{matter}</span>
                <span className={`practice-pill practice-pill--${tone}`}>{status}</span>
                <span className="row-meta">{owner}</span>
              </div>
            ))}
          </div>
          <Link className="section-card__footer-link" to="/admin/cases/all-matters">
            View all matters →
          </Link>
        </article>

        <article className="surface-card section-card dashboard-panel">
          <h2 className="section-heading">Staff snapshot</h2>
          <p className="section-subtitle">Active staff and certification status</p>
          <div className="staff-list">
            {staff.map(([name, role, initials, status, statusTone, avatarTone]) => (
              <div key={name} className="staff-row">
                <div className="staff-person">
                  <span className={`staff-avatar staff-avatar--${avatarTone}`}>{initials}</span>
                  <div>
                    <p className="row-title">{name}</p>
                    <p className="row-meta">{role}</p>
                  </div>
                </div>
                <span className={`practice-pill practice-pill--${statusTone}`}>
                  {status}
                </span>
              </div>
            ))}
          </div>
          <Link className="section-card__footer-link" to="/admin/staff/accounts">
            Manage staff →
          </Link>
        </article>
      </section>
    </>
  );
}

export function AdminDashboardPlaceholder({ view }: { view: "Pipeline" | "Activity" }) {
  useDocumentTitle(`${view} dashboard - Oravanti`);

  return (
    <>
      <DashboardHeader />

      <section className="surface-card section-card dashboard-placeholder">
        <h2 className="section-heading">{view}</h2>
        <p className="section-subtitle">{view} dashboard view placeholder.</p>
      </section>
    </>
  );
}
