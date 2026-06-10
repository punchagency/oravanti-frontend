import { contractorSignupSteps } from "../constants";

type ProgressBarsProps = {
  step: number;
};

export function ProgressBars({ step }: ProgressBarsProps) {
  return (
    <div className="signup-progress" aria-label={`Step ${step} of 5`}>
      {contractorSignupSteps.map((label, index) => (
        <span
          key={label}
          className={
            index < step
              ? "signup-progress__bar is-complete"
              : "signup-progress__bar"
          }
        />
      ))}
    </div>
  );
}
