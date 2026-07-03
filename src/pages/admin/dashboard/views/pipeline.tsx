import type { PipelineStage } from "@/api/leads";
import { useCases } from "@/hooks/use-cases";
import { useLeads } from "@/hooks/use-leads";
import { Link } from "react-router";
import {
  deadlines,
  healthIndicators,
  matterStageStats,
  velocityWeeks,
} from "../data";

const PIPELINE_STAGE_DEFS: Array<{
  label: string;
  stage: PipelineStage;
  color: string;
}> = [
  { label: "Lead inbox", stage: "lead_inbox", color: "#8c8f87" },
  { label: "Conflict check", stage: "conflict_check", color: "#d18400" },
  { label: "Questionnaire", stage: "questionnaire", color: "#4b78dd" },
  { label: "Consultation", stage: "consultation", color: "#6a00c7" },
  { label: "Fee agreement", stage: "fee_agreement", color: "#d18400" },
  { label: "Case opening", stage: "case_opening", color: "#00a878" },
];

const MAX_BAR_HEIGHT = 110;

const PRACTICE_AREA_COLORS = [
  "#00a878",
  "#6a00c7",
  "#e14a2d",
  "#5e4500",
  "#377dff",
  "#d18400",
  "#b00020",
];

const PRACTICE_AREA_TONES = [
  "success",
  "purple",
  "red",
  "gold",
  "info",
  "warning",
  "red",
];

export function PipelineView() {
  const { data: allLeadsData } = useLeads({ all: true });
  const allLeads = Array.isArray(allLeadsData)
    ? allLeadsData
    : (allLeadsData?.leads ?? []);

  const { data: casesData } = useCases();
  const allCases = casesData ?? [];

  const stageCounts = PIPELINE_STAGE_DEFS.map((def) => ({
    ...def,
    count: allLeads.filter((l) => l.pipelineStage === def.stage).length,
  }));
  const maxCount = Math.max(...stageCounts.map((s) => s.count), 1);
  const pipelineStagesLive = stageCounts.map((s) => ({
    ...s,
    height: Math.max(Math.round((s.count / maxCount) * MAX_BAR_HEIGHT), 8),
  }));
  const totalLeads = stageCounts.reduce((sum, s) => sum + s.count, 0);

  const practiceAreaCounts = new Map<string, { name: string; count: number }>();
  for (const c of allCases) {
    const id = c.practiceArea?.id ?? "__none";
    const name = c.practiceArea?.name ?? "Unknown";
    const existing = practiceAreaCounts.get(id);
    if (existing) {
      existing.count++;
    } else {
      practiceAreaCounts.set(id, { name, count: 1 });
    }
  }
  const totalCases = allCases.length;
  const practiceAreaStatsLive = Array.from(practiceAreaCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .map(([, { name, count }], i) => {
      const pct = totalCases > 0 ? Math.round((count / totalCases) * 100) : 0;
      return {
        label: name.toUpperCase(),
        count: String(count),
        percentText: `${pct}%`,
        color: PRACTICE_AREA_COLORS[i % PRACTICE_AREA_COLORS.length],
        tone: PRACTICE_AREA_TONES[i % PRACTICE_AREA_TONES.length],
        percent: pct,
      };
    });

  return (
    <>
      <section className="pipeline-overview">
        <header className="dashboard-section-header">
          <h2 className="section-heading">Intake pipeline</h2>
          <Link
            className="section-card__footer-link"
            to="/intake/pipeline/lead-inbox"
          >
            Go to intake →
          </Link>
        </header>

        <div
          className="pipeline-bar-chart"
          aria-label="Intake pipeline counts by stage"
        >
          {pipelineStagesLive.map(({ label, count, color, height }) => (
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
            <span
              className="chip-dot"
              style={{ background: "var(--text-primary)" }}
            />
            {totalLeads} total leads in pipeline
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
                  <span className="count-pill count-pill--neutral">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="surface-card section-card pipeline-stat-card">
            <h3 className="pipeline-card-title">Matters by practice area</h3>
            <div className="practice-progress-list">
              {practiceAreaStatsLive.length === 0 ? (
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "13px",
                    margin: 0,
                  }}
                >
                  No cases yet.
                </p>
              ) : (
                practiceAreaStatsLive.map(
                  ({ label, count, percentText, color, tone, percent }) => (
                    <div key={label} className="practice-progress-row">
                      <span className={`practice-pill practice-pill--${tone}`}>
                        {label}
                      </span>
                      <span className="progress-track">
                        <span
                          className="progress-fill"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: color,
                          }}
                        />
                      </span>
                      <span className="practice-progress-value">
                        <strong>{count}</strong> {percentText}
                      </span>
                    </div>
                  ),
                )
              )}
            </div>
          </article>
        </div>
      </section>

      <article className="surface-card section-card dashboard-panel deadline-card">
        <header className="section-card__header">
          <h2 className="section-heading">Deadlines this week</h2>
          <span className="alert-count">{deadlines.length} deadlines</span>
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
              <span className={`deadline-due deadline-due--${tone}`}>
                {due}
              </span>
              <Link className="deadline-view-button" to="/cases">
                View
              </Link>
            </div>
          ))}
        </div>
        <Link className="section-card__footer-link" to="/cases">
          View all deadlines →
        </Link>
      </article>

      <section className="pipeline-section">
        <header className="pipeline-copy-header">
          <h2 className="section-heading">Case opening velocity</h2>
          <p className="section-subtitle">
            New matters opened per week — last 8 weeks
          </p>
        </header>

        <div className="velocity-chart" aria-label="Case opening velocity">
          {velocityWeeks.map(([label, value, height]) => (
            <div key={label} className="velocity-bar-item">
              <span className="velocity-value">{value}</span>
              <span
                className="velocity-bar"
                style={{ height: `${height}px` }}
              />
              <span className="velocity-label">{label}</span>
            </div>
          ))}
        </div>

        <div className="pipeline-summary-row">
          <span className="chip">
            <span
              className="chip-dot"
              style={{ background: "var(--text-primary)" }}
            />
            Avg 5.25 cases / week
          </span>
          <span className="chip">
            <span
              className="chip-dot"
              style={{ background: "var(--status-success)" }}
            />
            ↑ 33% from 8 weeks ago
          </span>
        </div>
      </section>

      <section className="pipeline-section">
        <h2 className="section-heading">Pipeline health indicators</h2>
        <div className="health-grid">
          {healthIndicators.map(
            ([label, value, helper, tone, percent, Icon]) => (
              <article key={label} className="surface-card health-card">
                <div>
                  <p className="health-label">{label}</p>
                  <p className={`health-value health-value--${tone}`}>
                    {value}
                  </p>
                  <p className={`health-helper health-helper--${tone}`}>
                    {helper}
                  </p>
                </div>
                <span className={`health-icon health-icon--${tone}`}>
                  <Icon size={14} strokeWidth={1.8} />
                </span>
                <span className="progress-track">
                  <span
                    className={`health-fill health-fill--${tone}`}
                    style={{ width: `${percent}%` }}
                  />
                </span>
              </article>
            ),
          )}
        </div>
      </section>
    </>
  );
}
