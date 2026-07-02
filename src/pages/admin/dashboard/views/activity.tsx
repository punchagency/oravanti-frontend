import { Link } from "react-router";
import {
  activityStats,
  afternoonActivity,
  closedThisWeek,
  morningActivity,
  staffDuty,
  systemStatuses,
  teamCaseload,
} from "../data";

function ActivityRow({
  time,
  color,
  title,
  meta,
  action,
}: {
  time: string;
  color: string;
  title: string;
  meta: string;
  action: string;
}) {
  return (
    <div className="activity-row">
      <time className="activity-time">{time}</time>
      <span className="activity-marker" style={{ backgroundColor: color }} />
      <div className="activity-copy">
        <p className="row-title">{title}</p>
        <p className="row-meta">{meta}</p>
      </div>
      {action ? (
        <Link className="activity-action-button" to="/cases">
          {action}
        </Link>
      ) : null}
    </div>
  );
}

export function ActivityView() {
  return (
    <section className="activity-page">
      <header className="activity-heading-row">
        <h2 className="section-heading">Firm activity feed</h2>
        <div className="activity-filters">
          <select className="pipeline-select" aria-label="Activity date range">
            <option>Today</option>
            <option>Last 7 days</option>
            <option>Last 14 days</option>
            <option>Last 30 days</option>
          </select>
          <select className="pipeline-select" aria-label="Activity type">
            <option>All activity</option>
            <option>Cases</option>
            <option>Intake</option>
            <option>Deadlines</option>
            <option>Staff</option>
            <option>Teams</option>
          </select>
        </div>
      </header>

      <div className="activity-summary-row">
        {activityStats.map(([label, color]) => (
          <span key={label} className="chip activity-summary-chip">
            <span className="chip-dot" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>

      <div className="activity-layout">
        <article className="surface-card activity-feed-card">
          <header className="activity-card-header">
            <h3 className="pipeline-card-title">
              Today — Tuesday, June 9, 2026
            </h3>
            <span className="alert-count">24 events</span>
          </header>

          <div className="activity-period">Morning</div>
          <div className="activity-list">
            {morningActivity.map(([time, color, title, meta, action]) => (
              <ActivityRow
                key={`${time}-${title}`}
                time={time}
                color={color}
                title={title}
                meta={meta}
                action={action}
              />
            ))}
          </div>

          <div className="activity-period">Afternoon</div>
          <div className="activity-list">
            {afternoonActivity.map(([time, color, title, meta, action]) => (
              <ActivityRow
                key={`${time}-${title}`}
                time={time}
                color={color}
                title={title}
                meta={meta}
                action={action}
              />
            ))}
          </div>

          <footer className="activity-feed-footer">
            <button className="secondary-button" type="button">
              Load earlier activity
            </button>
          </footer>
        </article>

        <aside className="activity-sidebar">
          <article className="surface-card section-card activity-side-card">
            <h3 className="pipeline-card-title">Staff on duty today</h3>
            <p className="section-subtitle">Caseload vs individual cap</p>
            <div className="activity-staff-list">
              {staffDuty.map(
                ([name, role, initials, load, percent, tone, avatarTone]) => (
                  <div key={name} className="activity-staff-row">
                    <div className="staff-person">
                      <span
                        className={`staff-avatar staff-avatar--${avatarTone}`}
                      >
                        {initials}
                      </span>
                      <div>
                        <p className="row-title">{name}</p>
                        <p className="row-meta">{role}</p>
                      </div>
                    </div>
                    <span className="activity-capacity-track">
                      <span
                        className={`activity-capacity-fill activity-capacity-fill--${tone}`}
                        style={{ width: `${percent}%` }}
                      />
                    </span>
                    <span className="activity-load-value">{load}</span>
                    <span
                      className={`activity-status-dot activity-status-dot--${tone}`}
                    />
                  </div>
                ),
              )}
            </div>
          </article>

          <article className="surface-card section-card activity-side-card">
            <h3 className="pipeline-card-title">Team caseload</h3>
            <p className="section-subtitle">Active vs team cap</p>
            <div className="activity-team-list">
              {teamCaseload.map(([label, load, percent, tone]) => (
                <div key={label} className="activity-team-row">
                  <span className="row-title">{label}</span>
                  <span className="activity-capacity-track">
                    <span
                      className={`activity-capacity-fill activity-capacity-fill--${tone}`}
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="activity-load-value">{load}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="surface-card section-card activity-side-card">
            <h3 className="pipeline-card-title">System status</h3>
            <div className="system-status-list">
              {systemStatuses.map(([label, status, tone, Icon]) => (
                <div key={label} className="system-status-row">
                  <Icon size={13} strokeWidth={1.8} />
                  <span className="row-meta">{label}</span>
                  <span className={`practice-pill practice-pill--${tone}`}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="surface-card section-card activity-side-card">
            <h3 className="pipeline-card-title">Closed this week</h3>
            <p className="section-subtitle">2 matters resolved</p>
            <div className="closed-list">
              {closedThisWeek.map(([title, meta]) => (
                <div key={title} className="closed-row">
                  <span
                    className="chip-dot"
                    style={{ background: "var(--status-success)" }}
                  />
                  <div>
                    <p className="row-title">{title}</p>
                    <p className="row-meta">{meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}
