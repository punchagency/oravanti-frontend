import { useDocumentTitle } from "@/hooks/use-document-title";
import { AlertTriangle, Download, Plus, Search, Send, Shield } from "lucide-react";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router";
import {
  conflictReviews,
  intakeStages,
  intakeTabs,
  leadInboxLeads,
  leadSources,
  leadStatuses,
} from "./data";

function stepStyle(color: string): CSSProperties {
  return { "--step-color": color } as CSSProperties;
}

export function IntakePipelinePage() {
  const location = useLocation();
  const isConflictCheck = location.pathname.endsWith("/conflict-check");

  useDocumentTitle(
    isConflictCheck
      ? "Conflict check - Intake pipeline - Oravanti"
      : "Intake pipeline - Oravanti",
  );

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Intake pipeline</h1>
          <p className="page-subtitle">Manage leads from first contact to active case</p>
        </div>
        <div className="page-actions">
          <button className="brand-button" type="button">
            <Plus size={15} />
            Add lead
          </button>
          <button className="secondary-button" type="button">
            <Download size={14} />
            Export
          </button>
        </div>
      </header>

      <section className="pipeline-progress" aria-label="Intake pipeline stages">
        {intakeStages.map((stage, index) => (
          <NavLink
            key={stage.path}
            className="pipeline-step"
            style={stepStyle(stage.color)}
            to={stage.path}
          >
            <span className="pipeline-step__number">{index + 1}</span>
            <span className="pipeline-step__label">{stage.label}</span>
            <span className="pipeline-step__count">{stage.countLabel}</span>
          </NavLink>
        ))}
      </section>

      <nav className="pipeline-tabs" aria-label="Intake pipeline views">
        {intakeTabs.map(([label, path]) => (
          <NavLink
            key={path}
            className={({ isActive }) =>
              isActive ? "tab-link is-active" : "tab-link"
            }
            to={path}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {isConflictCheck ? <ConflictCheckView /> : <LeadInboxView />}
    </>
  );
}

function LeadInboxView() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("All sources");
  const [status, setStatus] = useState("All statuses");

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return leadInboxLeads.filter((lead) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          lead.name,
          lead.email,
          lead.phone,
          lead.practiceArea,
          lead.source,
          lead.status,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));

      const matchesSource = source === "All sources" || lead.source === source;
      const matchesStatus = status === "All statuses" || lead.status === status;

      return matchesQuery && matchesSource && matchesStatus;
    });
  }, [query, source, status]);

  return (
    <>
      <section className="toolbar" aria-label="Lead inbox controls">
        <div className="toolbar__filters">
          <label className="input-shell">
            <Search size={15} />
            <input
              aria-label="Search leads"
              placeholder="Search leads..."
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <label className="select-shell">
            <select
              aria-label="Filter by source"
              value={source}
              onChange={(event) => setSource(event.target.value)}
            >
              <option>All sources</option>
              {leadSources.map((leadSource) => (
                <option key={leadSource}>{leadSource}</option>
              ))}
            </select>
          </label>

          <label className="select-shell">
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option>All statuses</option>
              {leadStatuses.map((leadStatus) => (
                <option key={leadStatus}>{leadStatus}</option>
              ))}
            </select>
          </label>
        </div>
        <span className="record-count">
          {filteredLeads.length} {filteredLeads.length === 1 ? "lead" : "leads"}
        </span>
      </section>

      <div className="data-table intake-table" role="region" aria-label="Lead inbox table">
        <table>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Contact</th>
              <th scope="col">Practice area interest</th>
              <th scope="col">Source</th>
              <th scope="col">Received</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => (
              <tr key={lead.email}>
                <td>
                  <span className="table-name">{lead.name}</span>
                  <span className={`lead-status lead-status--${lead.status.toLowerCase()}`}>
                    {lead.status}
                  </span>
                </td>
                <td>
                  {lead.email}
                  <span className="table-subtext">{lead.phone}</span>
                </td>
                <td>
                  <span className={`practice-pill practice-pill--${lead.practiceTone}`}>
                    {lead.practiceArea}
                  </span>
                  {!lead.addOnActive ? (
                    <span className="lead-add-on-warning">
                      <AlertTriangle size={11} />
                      Not active
                    </span>
                  ) : null}
                </td>
                <td>{lead.source}</td>
                <td className="table-muted">{lead.received}</td>
                <td>
                  <button className="table-action-button" type="button">
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ConflictCheckView() {
  return (
    <section className="conflict-check-section" aria-label="Conflict check review queue">
      <div className="conflict-alert-banner">
        <Shield size={15} />
        <span>
          All leads must pass a conflict of interest check (ABA Rules 1.7 and 1.9)
          before any engagement. Attorney review required.
        </span>
      </div>

      <div className="conflict-review-list">
        {conflictReviews.map((review) => (
          <article key={review.name} className="surface-card work-card conflict-card">
            <header className="work-card__header">
              <div>
                <h2 className="work-card__title">Conflict review: {review.name}</h2>
                <div className="work-card__meta conflict-card__meta">
                  <span className={`practice-pill practice-pill--${review.practiceTone}`}>
                    {review.practiceArea}
                  </span>
                  <span>Received {review.received}</span>
                </div>
                {!review.addOnActive ? (
                  <span className="lead-add-on-warning conflict-card__warning">
                    <AlertTriangle size={11} />
                    Not active
                  </span>
                ) : null}
              </div>
              <span
                className={`conflict-status-badge conflict-status-badge--${review.statusTone}`}
              >
                {review.statusTone === "danger" ? <AlertTriangle size={11} /> : null}
                {review.statusLabel}
              </span>
            </header>

            <div className="work-card__note">Matter focus: {review.matterFocus}</div>

            <div
              className={
                review.outcomeTone === "danger"
                  ? "work-card__alert conflict-card__outcome"
                  : "work-card__success conflict-card__outcome"
              }
            >
              {review.outcomeTone === "danger" ? (
                <AlertTriangle size={15} />
              ) : (
                <Shield size={15} />
              )}
              <span>
                {review.outcomeTone === "danger" ? "Alert details: " : ""}
                {review.outcome}
              </span>
            </div>

            <div className="work-card__actions conflict-card__actions">
              {review.actions.map((action) => (
                <button
                  key={action.label}
                  className={
                    action.tone === "danger"
                      ? "danger-button conflict-card__button"
                      : "brand-button conflict-card__button"
                  }
                  type="button"
                >
                  {action.label === "Proceed to Questionnaire" ? <Send size={14} /> : null}
                  {action.label}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
