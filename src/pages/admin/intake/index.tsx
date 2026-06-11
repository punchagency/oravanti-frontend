import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileText,
  Lock,
  MapPin,
  PenLine,
  Plus,
  Search,
  Send,
  Shield,
  Video,
  X,
} from "lucide-react";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router";
import {
  consultations,
  feeAgreements,
  conflictReviews,
  intakeStages,
  intakeTabs,
  leadInboxLeads,
  leadSources,
  leadStatuses,
  questionnaires,
} from "./data";

function stepStyle(color: string): CSSProperties {
  return { "--step-color": color } as CSSProperties;
}

export function IntakePipelinePage() {
  const location = useLocation();
  const isConflictCheck = location.pathname.endsWith("/conflict-check");
  const isQuestionnaire = location.pathname.endsWith("/questionnaire");
  const isConsultation = location.pathname.endsWith("/consultation");
  const isFeeAgreement = location.pathname.endsWith("/fee-agreement");

  useDocumentTitle(
    isConflictCheck || isQuestionnaire || isConsultation || isFeeAgreement
      ? `${
          isConflictCheck
            ? "Conflict check"
            : isQuestionnaire
              ? "Questionnaire"
              : isConsultation
                ? "Consultation & notes"
                : "Fee agreement"
        } - Intake pipeline - Oravanti`
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

      {isConflictCheck ? (
        <ConflictCheckView />
      ) : isQuestionnaire ? (
        <QuestionnaireView />
      ) : isConsultation ? (
        <ConsultationView />
      ) : isFeeAgreement ? (
        <FeeAgreementView />
      ) : (
        <LeadInboxView />
      )}
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

function QuestionnaireView() {
  return (
    <section className="questionnaire-section" aria-label="Questionnaire queue">
      <header className="questionnaire-toolbar">
        <p>2 questionnaires sent</p>
        <button className="secondary-button" type="button">
          <Send size={14} />
          Send new questionnaire
        </button>
      </header>

      <div className="questionnaire-list">
        {questionnaires.map((questionnaire) => (
          <article
            key={questionnaire.title}
            className="surface-card work-card questionnaire-card"
          >
            <header className="work-card__header">
              <div>
                <h2 className="work-card__title">{questionnaire.title}</h2>
                <div className="work-card__meta questionnaire-card__meta">
                  <span
                    className={`practice-pill practice-pill--${questionnaire.practiceTone}`}
                  >
                    {questionnaire.practiceArea}
                  </span>
                  <span>Received from {questionnaire.receivedFrom}</span>
                </div>
                {!questionnaire.addOnActive ? (
                  <span className="lead-add-on-warning questionnaire-card__warning">
                    <AlertTriangle size={11} />
                    Not active
                  </span>
                ) : null}
              </div>
              <span className="conflict-status-badge conflict-status-badge--success">
                {questionnaire.statusLabel}
              </span>
            </header>

            <div className="work-card__actions questionnaire-card__actions">
              <button className="secondary-button questionnaire-card__button" type="button">
                View response
              </button>
              <button className="brand-button questionnaire-card__button" type="button">
                <FileText size={14} />
                Generate fee agreement
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ConsultationView() {
  return (
    <section className="consultation-section" aria-label="Consultation and notes">
      <header className="questionnaire-toolbar">
        <p>2 consultations in progress</p>
        <button className="secondary-button" type="button">
          <CalendarDays size={14} />
          Schedule consultation
        </button>
      </header>

      <div className="consultation-list">
        {consultations.map((consultation) => (
          <article
            key={consultation.name}
            className="surface-card work-card consultation-card"
          >
            <header className="consultation-card__header">
              <div className="consultation-person">
                <span className={`consultation-avatar consultation-avatar--${consultation.avatarTone}`}>
                  {consultation.initials}
                </span>
                <div>
                  <h2 className="work-card__title">{consultation.name}</h2>
                  <p className="consultation-subtitle">{consultation.matter}</p>
                </div>
              </div>
              <div className="consultation-schedule">
                <span
                  className={`conflict-status-badge conflict-status-badge--${consultation.statusTone}`}
                >
                  {consultation.status}
                </span>
                <span className="consultation-mode">
                  {consultation.mode === "Video call" ? (
                    <Video size={11} />
                  ) : (
                    <MapPin size={11} />
                  )}
                  {consultation.mode}
                </span>
                <span>{consultation.date}</span>
              </div>
            </header>

            <div className="consultation-questionnaire-row">
              <div className="consultation-person">
                <span className="consultation-icon consultation-icon--success">
                  <ClipboardCheck size={15} />
                </span>
                <div>
                  <h3 className="consultation-row-title">Questionnaire completed</h3>
                  <p className="consultation-subtitle">{consultation.questionnaire}</p>
                </div>
              </div>
              <button className="link-button" type="button">
                View responses
              </button>
            </div>

            <section className="consultation-documents" aria-label={`${consultation.name} documents`}>
              <header className="consultation-documents__header">
                <p>
                  <strong>Documents</strong>
                  <span>{consultation.documentsReceived}</span>
                </p>
                <button className="link-button" type="button">
                  Request missing
                </button>
              </header>

              <p className="consultation-documents__group-label">Uploaded by client</p>
              <div className="consultation-document-list">
                {consultation.uploadedDocuments.map((document) => (
                  <DocumentRow
                    key={document.title}
                    title={document.title}
                    meta={document.meta}
                    received
                    downloadable
                    checkedTone="success"
                  />
                ))}
              </div>

              <p className="consultation-documents__group-label">
                Required — pending receipt
              </p>
              <div className="consultation-document-list">
                {consultation.requiredDocuments.map((document) => (
                  <DocumentRow
                    key={document.title}
                    title={document.title}
                    meta="Required"
                    received={document.received}
                    checkedTone="warning"
                  />
                ))}
              </div>
              <p className="consultation-helper">
                Check the box to manually confirm receipt of documents provided outside the
                client portal (e.g. in-person, by email, or via scan).
              </p>
            </section>

            <section className="consultation-notes" aria-label={`${consultation.name} attorney notes`}>
              <div>
                <h3 className="consultation-row-title">Attorney notes</h3>
                <p className="consultation-subtitle">
                  Notes are internal and not visible to the client.
                </p>
              </div>
              <textarea
                aria-label={`${consultation.name} attorney notes`}
                defaultValue={consultation.notes}
              />
              <button className="secondary-button consultation-save-button" type="button">
                Save notes
              </button>
            </section>

            <footer className="consultation-footer">
              <div className="consultation-assignee">
                <span className="consultation-assignee__avatar">
                  {consultation.assigneeInitials}
                </span>
                <span>{consultation.assignee}</span>
                <span>(Assigned)</span>
              </div>
              <div className="consultation-actions">
                <button className="brand-button" type="button">
                  <Send size={14} />
                  Proceed to fee agreement
                </button>
                <button className="secondary-button" type="button">
                  <CalendarDays size={14} />
                  Schedule follow-up
                </button>
                <button className="secondary-button" type="button">
                  <X size={14} />
                  Close — no case
                </button>
                <button className="secondary-button" type="button">
                  <ExternalLink size={14} />
                  Refer elsewhere
                </button>
              </div>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

function DocumentRow({
  title,
  meta,
  received,
  downloadable = false,
  checkedTone,
}: {
  title: string;
  meta: string;
  received: boolean;
  downloadable?: boolean;
  checkedTone: "success" | "warning";
}) {
  return (
    <div className="consultation-document-row">
      <span
        className={
          received
            ? `document-check document-check--${checkedTone}`
            : "document-check document-check--empty"
        }
        aria-hidden="true"
      >
        {received ? <Check size={11} /> : null}
      </span>
      <div>
        <p className="consultation-row-title">{title}</p>
        <p className="consultation-subtitle">
          {meta}
          {meta === "Required" ? <Lock size={10} /> : null}
        </p>
      </div>
      <span
        className={
          received
            ? "document-status document-status--received"
            : "document-status document-status--pending"
        }
      >
        {received ? "Received" : "Pending"}
      </span>
      {downloadable ? (
        <button className="icon-button" type="button" aria-label={`Download ${title}`}>
          <Download size={14} />
        </button>
      ) : null}
    </div>
  );
}

function FeeAgreementView() {
  return (
    <section className="fee-agreement-section" aria-label="Fee agreements">
      <header className="questionnaire-toolbar">
        <p>1 fee agreement pending signature</p>
        <button className="secondary-button" type="button">
          <FileText size={14} />
          Generate agreement
        </button>
      </header>

      <div className="fee-agreement-list">
        {feeAgreements.map((agreement) => (
          <article
            key={agreement.title}
            className="surface-card work-card fee-agreement-card"
          >
            <header className="work-card__header">
              <div>
                <h2 className="work-card__title">{agreement.title}</h2>
                <div className="work-card__meta fee-agreement-card__meta">
                  <span className={`practice-pill practice-pill--${agreement.practiceTone}`}>
                    {agreement.practiceArea}
                  </span>
                  <span>Generated by {agreement.generatedBy}</span>
                </div>
                {!agreement.addOnActive ? (
                  <span className="lead-add-on-warning fee-agreement-card__warning">
                    <AlertTriangle size={11} />
                    Not active
                  </span>
                ) : null}
              </div>
              <span className="document-status document-status--pending fee-agreement-status">
                <PenLine size={11} />
                {agreement.statusLabel}
              </span>
            </header>

            <div className="fee-progress">
              <div className="fee-progress__copy">
                <span>Awaiting client digital signature</span>
                <span>{agreement.progressLabel}</span>
              </div>
              <span className="fee-progress__track">
                <span
                  className="fee-progress__fill"
                  style={{ width: `${agreement.progress}%` }}
                />
              </span>
            </div>

            <div className="work-card__actions fee-agreement-card__actions">
              <button className="secondary-button fee-agreement-card__button" type="button">
                Nudge client
              </button>
              <button className="brand-button fee-agreement-card__button" type="button">
                <PenLine size={14} />
                Advance stage (Digital Sign)
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
