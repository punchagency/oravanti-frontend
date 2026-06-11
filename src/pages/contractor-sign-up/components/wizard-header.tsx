import { ArrowLeft } from "lucide-react";
import { ProgressBars } from "./progress-bars";

type WizardHeaderProps = {
  step: number;
  title: string;
  onBack: () => void;
};

export function WizardHeader({ step, title, onBack }: WizardHeaderProps) {
  return (
    <>
      <div className="signup-card__header">
        <button
          className="signup-back"
          type="button"
          onClick={onBack}
          aria-label="Go back"
        >
          <ArrowLeft size={15} />
        </button>
        <div>
          <h1>{title}</h1>
          <p>Step {step} of 5</p>
        </div>
        <span className="signup-role-pill">Contractor</span>
      </div>
      <ProgressBars step={step} />
    </>
  );
}
