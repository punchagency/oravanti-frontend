import { useFormContext } from "react-hook-form";
import { SignupField } from "../components/signup-field";
import { StepFooter } from "../components/step-footer";
import { WizardHeader } from "../components/wizard-header";
import type { ContractorSignupFormValues } from "../schema";

type PersonalDetailsStepProps = {
  onBack: () => void;
  onNext: () => void;
};

export function PersonalDetailsStep({ onBack, onNext }: PersonalDetailsStepProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ContractorSignupFormValues>();

  return (
    <>
      <WizardHeader step={1} title="Personal details" onBack={onBack} />
      <div className="signup-form-grid">
        <SignupField label="First name" error={errors.firstName?.message}>
          <input
            type="text"
            placeholder="e.g. Marcus"
            aria-invalid={!!errors.firstName}
            {...register("firstName")}
          />
        </SignupField>
        <SignupField label="Last name" error={errors.lastName?.message}>
          <input
            type="text"
            placeholder="e.g. Vance"
            aria-invalid={!!errors.lastName}
            {...register("lastName")}
          />
        </SignupField>
        <SignupField label="Email address" error={errors.email?.message}>
          <input
            type="email"
            placeholder="e.g. marcus@contractor.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </SignupField>
        <SignupField label="Phone number" error={errors.phoneNumber?.message}>
          <input
            type="tel"
            placeholder="e.g. (555) 014-9988"
            aria-invalid={!!errors.phoneNumber}
            {...register("phoneNumber")}
          />
        </SignupField>
      </div>
      <SignupField label="Password" error={errors.password?.message}>
        <input
          type="password"
          placeholder="Choose a secure password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
      </SignupField>
      <div className="password-meter">
        <span />
        <span />
        <span />
      </div>
      <p className="signup-helper">Must be at least 8 characters</p>
      <StepFooter contextLabel="Next: Specialties" onNext={onNext} />
    </>
  );
}
