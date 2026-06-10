import { useFormContext } from "react-hook-form";
import { SignupField } from "../components/signup-field";
import { StepFooter } from "../components/step-footer";
import { WizardHeader } from "../components/wizard-header";
import type { ContractorSignupFormValues } from "../schema";

type BackgroundCheckStepProps = {
  onBack: () => void;
  onNext: () => void;
};

export function BackgroundCheckStep({ onBack, onNext }: BackgroundCheckStepProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ContractorSignupFormValues>();

  return (
    <>
      <WizardHeader step={3} title="Background check" onBack={onBack} />
      <div className="signup-info-box">
        <h2>Consent to background check</h2>
        <p>
          To maintain secure attorney workspaces, Oravanti requires credential
          verification and background checking. This screens licenses,
          verification status, and criminal history. Processing takes 2-3
          business days.
        </p>
      </div>
      <label className="signup-consent">
        <input
          type="checkbox"
          aria-invalid={!!errors.consentedToBackgroundCheck}
          {...register("consentedToBackgroundCheck")}
        />
        <span>I consent to a background check and credential verification</span>
      </label>
      {errors.consentedToBackgroundCheck?.message ? (
        <p className="signup-error">
          {errors.consentedToBackgroundCheck.message}
        </p>
      ) : null}
      <SignupField
        label="Desired hourly rate (USD/hr)"
        error={errors.desiredHourlyRate?.message}
      >
        <input
          type="number"
          min="1"
          step="1"
          placeholder="e.g. 75"
          aria-invalid={!!errors.desiredHourlyRate}
          {...register("desiredHourlyRate")}
        />
      </SignupField>
      <StepFooter contextLabel="Next: Profile setup" onNext={onNext} />
    </>
  );
}
