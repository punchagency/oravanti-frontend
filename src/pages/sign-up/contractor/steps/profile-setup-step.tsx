import { useFormContext } from "react-hook-form";
import { SignupField } from "../components/signup-field";
import { StepFooter } from "../components/step-footer";
import { WizardHeader } from "../components/wizard-header";
import type { ContractorSignupFormValues } from "../schema";

type ProfileSetupStepProps = {
  onBack: () => void;
  onNext: () => void;
};

export function ProfileSetupStep({ onBack, onNext }: ProfileSetupStepProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ContractorSignupFormValues>();

  return (
    <>
      <WizardHeader step={4} title="Profile setup" onBack={onBack} />
      <SignupField label="Professional bio" error={errors.bio?.message}>
        <textarea
          placeholder="Briefly describe your experience and skills in legal contracting."
          aria-invalid={!!errors.bio}
          {...register("bio")}
        />
      </SignupField>
      <SignupField label="Availability" error={errors.availability?.message}>
        <select
          defaultValue=""
          aria-invalid={!!errors.availability}
          {...register("availability")}
        >
          <option value="" disabled>
            Select availability
          </option>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="project-based">Project-based</option>
        </select>
      </SignupField>
      <label className="signup-consent signup-consent--filled">
        <input
          type="checkbox"
          aria-invalid={!!errors.recognizedDirectoryListingVerificationAccepted}
          {...register("recognizedDirectoryListingVerificationAccepted")}
        />
        <span>I recognize directory listings are subject to verification checks.</span>
      </label>
      {errors.recognizedDirectoryListingVerificationAccepted?.message ? (
        <p className="signup-error">
          {errors.recognizedDirectoryListingVerificationAccepted.message}
        </p>
      ) : null}
      <StepFooter contextLabel="Next: Payout setup" onNext={onNext} />
    </>
  );
}
