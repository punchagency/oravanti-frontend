import { AlertTriangle, Send, Shield } from "lucide-react";
import { conflictReviews } from "../data";

export function ConflictCheckView() {
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
