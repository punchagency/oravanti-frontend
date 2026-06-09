import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router";
import { alerts, chips, matters, metrics, pipeline, staff } from "../data";

export function OverviewView() {
  const [activeChip, setActiveChip] = useState<string>(chips[0][0]);

  return (
    <>
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
