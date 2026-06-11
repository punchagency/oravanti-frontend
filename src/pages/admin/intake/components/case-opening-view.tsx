import { AlertTriangle, Check, FolderOpen, Lock } from "lucide-react";
import { caseOpenings } from "../data";

export function CaseOpeningView() {
  return (
    <section className="case-opening-section" aria-label="Case opening queue">
      <header className="case-opening-toolbar">
        <p>2 cases ready to open</p>
        <span className="conflict-status-badge conflict-status-badge--success">
          Retainers confirmed
        </span>
      </header>

      <div className="case-opening-list">
        {caseOpenings.map((caseOpening) => (
          <article
            key={caseOpening.title}
            className="surface-card work-card case-opening-card"
          >
            <header className="work-card__header">
              <div>
                <h2 className="work-card__title">{caseOpening.title}</h2>
                <div className="work-card__meta case-opening-card__meta">
                  <span className={`practice-pill practice-pill--${caseOpening.practiceTone}`}>
                    {caseOpening.practiceArea}
                  </span>
                  <span>{caseOpening.retainerCopy}</span>
                </div>
                {!caseOpening.addOnActive ? (
                  <span className="lead-add-on-warning case-opening-card__warning">
                    <AlertTriangle size={11} />
                    Not active
                  </span>
                ) : null}
              </div>
              <span className="conflict-status-badge conflict-status-badge--success">
                <Check size={11} />
                Retainer Received
              </span>
            </header>

            <div className="work-card__note case-opening-summary">
              Active Situation Summary: {caseOpening.summary}
            </div>

            <div className="work-card__actions case-opening-card__actions">
              <button
                className={
                  caseOpening.actionTone === "danger"
                    ? "case-opening-danger-button"
                    : "brand-button case-opening-card__button"
                }
                type="button"
              >
                {caseOpening.actionTone === "danger" ? (
                  <Lock size={14} />
                ) : (
                  <FolderOpen size={14} />
                )}
                {caseOpening.actionLabel}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
