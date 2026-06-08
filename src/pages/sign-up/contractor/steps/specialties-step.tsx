import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { SignupField } from "../components/signup-field";
import { SpecialtyGroup } from "../components/specialty-group";
import { StepFooter } from "../components/step-footer";
import { WizardHeader } from "../components/wizard-header";
import type { ContractorSignupFormValues } from "../schema";
import type { PublicPracticeArea } from "../types";

type SpecialtiesStepProps = {
  loading: boolean;
  practiceAreas: PublicPracticeArea[];
  practiceAreasError?: string;
  onBack: () => void;
  onNext: () => void;
};

export function SpecialtiesStep({
  loading,
  practiceAreas,
  practiceAreasError,
  onBack,
  onNext,
}: SpecialtiesStepProps) {
  const {
    control,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<ContractorSignupFormValues>();
  const selectedSpecialtyIds = watch("specialtyIds");
  const { fields, append, remove } = useFieldArray({
    control,
    name: "certificationDocuments",
  });

  function toggleSpecialty(id: string) {
    const nextSpecialtyIds = selectedSpecialtyIds.includes(id)
      ? selectedSpecialtyIds.filter((specialtyId) => specialtyId !== id)
      : [...selectedSpecialtyIds, id];

    setValue("specialtyIds", nextSpecialtyIds, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  return (
    <>
      <WizardHeader step={2} title="Specialties" onBack={onBack} />
      <h2 className="signup-section-title">Your specialties</h2>

      {loading ? <p className="signup-helper">Loading specialties...</p> : null}
      {practiceAreasError ? (
        <p className="signup-error">{practiceAreasError}</p>
      ) : null}
      {!loading && !practiceAreasError && practiceAreas.length === 0 ? (
        <p className="signup-helper">No specialties are available yet.</p>
      ) : null}

      {practiceAreas.map((practiceArea) => (
        <SpecialtyGroup
          key={practiceArea.id}
          practiceArea={practiceArea}
          selectedIds={selectedSpecialtyIds}
          onToggleSpecialty={toggleSpecialty}
        />
      ))}
      {errors.specialtyIds?.message ? (
        <p className="signup-error">{errors.specialtyIds.message}</p>
      ) : null}

      <div className="signup-section-heading">
        <h2 className="signup-section-title">Certification documents</h2>
        <button
          className="signup-icon-text-button"
          type="button"
          onClick={() =>
            append({
              certificationName: "",
              issuingOrganization: "",
              issuedAt: "",
              expiresAt: "",
            })
          }
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {fields.map((field, index) => (
        <div className="certification-group" key={field.id}>
          <div className="certification-group__header">
            <strong>Certification {index + 1}</strong>
            {fields.length > 1 ? (
              <button
                className="signup-icon-button"
                type="button"
                onClick={() => remove(index)}
                aria-label={`Remove certification ${index + 1}`}
              >
                <Trash2 size={14} />
              </button>
            ) : null}
          </div>
          <SignupField
            label="Certification name"
            error={errors.certificationDocuments?.[index]?.certificationName?.message}
          >
            <input
              type="text"
              placeholder="e.g. State bar certificate"
              aria-invalid={
                !!errors.certificationDocuments?.[index]?.certificationName
              }
              {...register(`certificationDocuments.${index}.certificationName`)}
            />
          </SignupField>
          <SignupField
            label="Issuing organization"
            error={errors.certificationDocuments?.[index]?.issuingOrganization?.message}
          >
            <input
              type="text"
              placeholder="e.g. California State Bar"
              aria-invalid={
                !!errors.certificationDocuments?.[index]?.issuingOrganization
              }
              {...register(
                `certificationDocuments.${index}.issuingOrganization`,
              )}
            />
          </SignupField>
          <div className="signup-form-grid">
            <SignupField
              label="Issued at"
              error={errors.certificationDocuments?.[index]?.issuedAt?.message}
            >
              <input
                type="date"
                aria-invalid={!!errors.certificationDocuments?.[index]?.issuedAt}
                {...register(`certificationDocuments.${index}.issuedAt`)}
              />
            </SignupField>
            <SignupField
              label="Expires at"
              error={errors.certificationDocuments?.[index]?.expiresAt?.message}
            >
              <input
                type="date"
                aria-invalid={!!errors.certificationDocuments?.[index]?.expiresAt}
                {...register(`certificationDocuments.${index}.expiresAt`)}
              />
            </SignupField>
          </div>
        </div>
      ))}
      {typeof errors.certificationDocuments?.message === "string" ? (
        <p className="signup-error">{errors.certificationDocuments.message}</p>
      ) : null}

      <StepFooter contextLabel="Next: Background check" onNext={onNext} />
    </>
  );
}
