import { useFormContext } from "react-hook-form";
import { SignupField } from "../components/signup-field";
import { StepFooter } from "../components/step-footer";
import { WizardHeader } from "../components/wizard-header";
import type { ContractorSignupFormValues } from "../schema";

type PersonalDetailsStepProps = {
  onBack: () => void;
  onNext: () => void;
};

function getPasswordStrength(password: string) {
  if (!password) return 0;

  let score = password.length >= 8 ? 1 : 0;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  return Math.min(score, 4);
}

export function PersonalDetailsStep({ onBack, onNext }: PersonalDetailsStepProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<ContractorSignupFormValues>();
  const passwordStrength = getPasswordStrength(watch("password"));

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
      <div
        className={`password-meter password-meter--level-${passwordStrength}`}
        aria-label={`Password strength ${passwordStrength} of 4`}
      >
        {[1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className={level <= passwordStrength ? "is-active" : undefined}
          />
        ))}
      </div>
      <p className="signup-helper">Must be at least 8 characters</p>
      <StepFooter contextLabel="Next: Specialties" onNext={onNext} />
    </>
  );
}
