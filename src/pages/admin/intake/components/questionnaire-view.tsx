import { AlertTriangle, FileText, Send } from "lucide-react";
import { questionnaires } from "../data";

export function QuestionnaireView() {
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
