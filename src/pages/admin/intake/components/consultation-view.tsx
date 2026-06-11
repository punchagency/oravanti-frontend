import {
  CalendarDays,
  Check,
  ClipboardCheck,
  Download,
  ExternalLink,
  Lock,
  MapPin,
  Send,
  Video,
  X,
} from "lucide-react";
import { consultations } from "../data";

export function ConsultationView() {
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
