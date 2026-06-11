import { Download, Plus } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { NavLink } from "react-router";
import { intakeStages, intakeTabs } from "../data";

function stepStyle(color: string): CSSProperties {
  return { "--step-color": color } as CSSProperties;
}

export function PipelineFrame({ children }: { children: ReactNode }) {
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

      {children}
    </>
  );
}
