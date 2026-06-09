import {
  AlertTriangle,
  BriefcaseBusiness,
  Clock,
  FileText,
  Plus,
  ShieldCheck,
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

const pipelineStages = [
  ["Lead inbox", "4", "#8c8f87", 110],
  ["Conflict check", "3", "#d18400", 82],
  ["Questionnaire", "2", "#4b78dd", 55],
  ["Consultation & notes", "2", "#6a00c7", 55],
  ["Fee agreement", "1", "#d18400", 28],
  ["Case opening", "2", "#00a878", 55],
] as const;

const matterStageStats = [
  ["Intake", "4", "#8c8f87", 8],
  ["Forms preparation", "11", "#4b78dd", 23],
  ["Filed / Submitted", "9", "#6a00c7", 19],
  ["Under review", "12", "#d18400", 25],
  ["Response due", "5", "#e82c45", 10],
  ["Interview scheduled", "4", "#6a00c7", 8],
  ["Decision received", "3", "#00a878", 6],
] as const;

const practiceAreaStats = [
  ["IMMIGRATION", "35", "73%", "#00a878", "success", 73],
  ["BUSINESS", "0", "0%", "#6a00c7", "purple", 0],
  ["EMPLOYMENT", "0", "0%", "#e14a2d", "red", 0],
  ["CRIMINAL DEFENSE", "0", "0%", "#5e4500", "gold", 0],
] as const;

const deadlines = [
  ["#e82c45", "Ahmed Hassan", "ORV-2026-0109", "EEOC Charge · Response due", "Today", "urgent"],
  ["#e82c45", "Sofia Reyes", "ORV-2026-0094", "Protective Order (TRO)", "Tomorrow", "urgent"],
  ["#d18400", "James Okonkwo", "ORV-2026-0139", "I-130 RFE Response", "3 days", "warning"],
  ["#d18400", "Aisha Patel", "ORV-2026-0131", "I-485 AOS Interview", "4 days", "warning"],
  ["#377dff", "Roberto Morales", "ORV-2026-0118", "N-400 Interview", "6 days", "info"],
] as const;

const velocityWeeks = [
  ["Apr 21", "3", 36],
  ["Apr 28", "5", 62],
  ["May 05", "4", 50],
  ["May 12", "7", 86],
  ["May 19", "6", 74],
  ["May 26", "8", 100],
  ["Jun 02", "5", 62],
  ["Jun 09", "4", 50],
] as const;

const healthIndicators = [
  ["Firm RFE rate", "12%", "Target: below 10%", "warning", 56, AlertTriangle],
  ["Avg lead to case", "11d", "↓ 3 days from last month", "success", 54, Clock],
  ["Conflict check clearance", "94%", "6% declined / referred out", "success", 94, ShieldCheck],
] as const;

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

export function AdminDashboardPipeline() {
  useDocumentTitle("Pipeline dashboard - Oravanti");

  return (
    <>
      <DashboardHeader />

      <section className="pipeline-overview">
        <header className="dashboard-section-header">
          <h2 className="section-heading">Intake pipeline</h2>
          <Link className="section-card__footer-link" to="/admin/intake/pipeline/lead-inbox">
            Go to intake →
          </Link>
        </header>

        <div className="pipeline-bar-chart" aria-label="Intake pipeline counts by stage">
          {pipelineStages.map(([label, count, color, height]) => (
            <div key={label} className="pipeline-bar-item">
              <span className="pipeline-bar-count" style={{ color }}>
                {count}
              </span>
              <span
                className="pipeline-stage-bar"
                style={{ height: `${height}px`, backgroundColor: color }}
              />
              <span className="pipeline-bar-label">{label}</span>
            </div>
          ))}
        </div>

        <div className="pipeline-summary-row">
          <span className="chip">
            <span className="chip-dot" style={{ background: "var(--text-primary)" }} />
            14 total leads in pipeline
          </span>
          <span className="chip">
            <span className="chip-dot" style={{ background: "var(--status-success)" }} />
            48% avg conversion rate
          </span>
        </div>
      </section>

      <section className="pipeline-section">
        <header className="dashboard-section-header">
          <h2 className="section-heading">Active cases by practice area</h2>
          <select className="pipeline-select" aria-label="Filter practice area">
            <option>All practice areas</option>
          </select>
        </header>

        <div className="pipeline-card-grid">
          <article className="surface-card section-card pipeline-stat-card">
            <h3 className="pipeline-card-title">Matters by stage</h3>
            <div className="progress-list">
              {matterStageStats.map(([label, count, color, percent]) => (
                <div key={label} className="progress-row">
                  <span className="progress-label">{label}</span>
                  <span className="progress-track">
                    <span
                      className="progress-fill"
                      style={{ width: `${percent}%`, backgroundColor: color }}
                    />
                  </span>
                  <span className="count-pill count-pill--neutral">{count}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="surface-card section-card pipeline-stat-card">
            <h3 className="pipeline-card-title">Matters by practice area</h3>
            <div className="practice-progress-list">
              {practiceAreaStats.map(([label, count, percentText, color, tone, percent]) => (
                <div key={label} className="practice-progress-row">
                  <span className={`practice-pill practice-pill--${tone}`}>
                    {label}
                  </span>
                  <span className="progress-track">
                    <span
                      className="progress-fill"
                      style={{ width: `${percent}%`, backgroundColor: color }}
                    />
                  </span>
                  <span className="practice-progress-value">
                    <strong>{count}</strong> {percentText}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <article className="surface-card section-card dashboard-panel deadline-card">
        <header className="section-card__header">
          <h2 className="section-heading">Deadlines this week</h2>
          <span className="alert-count">7 deadlines</span>
        </header>
        <div className="deadline-list">
          {deadlines.map(([color, name, id, matter, due, tone]) => (
            <div key={id} className="deadline-row">
              <span className="chip-dot" style={{ background: color }} />
              <div>
                <p className="row-title">{name}</p>
                <p className="row-meta">{id}</p>
              </div>
              <span className="deadline-matter">{matter}</span>
              <span className={`deadline-due deadline-due--${tone}`}>{due}</span>
              <Link className="deadline-view-button" to="/admin/cases/all-matters">
                View
              </Link>
            </div>
          ))}
        </div>
        <Link className="section-card__footer-link" to="/admin/cases/all-matters">
          View all deadlines →
        </Link>
      </article>

      <section className="pipeline-section">
        <header className="pipeline-copy-header">
          <h2 className="section-heading">Case opening velocity</h2>
          <p className="section-subtitle">New matters opened per week — last 8 weeks</p>
        </header>

        <div className="velocity-chart" aria-label="Case opening velocity">
          {velocityWeeks.map(([label, value, height]) => (
            <div key={label} className="velocity-bar-item">
              <span className="velocity-value">{value}</span>
              <span className="velocity-bar" style={{ height: `${height}px` }} />
              <span className="velocity-label">{label}</span>
            </div>
          ))}
        </div>

        <div className="pipeline-summary-row">
          <span className="chip">
            <span className="chip-dot" style={{ background: "var(--text-primary)" }} />
            Avg 5.25 cases / week
          </span>
          <span className="chip">
            <span className="chip-dot" style={{ background: "var(--status-success)" }} />
            ↑ 33% from 8 weeks ago
          </span>
        </div>
      </section>

      <section className="pipeline-section">
        <h2 className="section-heading">Pipeline health indicators</h2>
        <div className="health-grid">
          {healthIndicators.map(([label, value, helper, tone, percent, Icon]) => (
            <article key={label} className="surface-card health-card">
              <div>
                <p className="health-label">{label}</p>
                <p className={`health-value health-value--${tone}`}>{value}</p>
                <p className={`health-helper health-helper--${tone}`}>{helper}</p>
              </div>
              <span className={`health-icon health-icon--${tone}`}>
                <Icon size={14} strokeWidth={1.8} />
              </span>
              <span className="progress-track">
                <span className={`health-fill health-fill--${tone}`} style={{ width: `${percent}%` }} />
              </span>
            </article>
          ))}
        </div>
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
