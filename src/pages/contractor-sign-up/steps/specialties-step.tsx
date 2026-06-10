import {
  Building2,
  Briefcase,
  FileText,
  FileUp,
  HeartPulse,
  Home,
  Plane,
  Plus,
  Scale,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
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

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

const practiceAreaTones = [
  "mint",
  "blue",
  "gold",
  "rose",
  "purple",
  "amber",
  "peach",
  "teal",
] as const;

const practiceAreaIconRules: Array<[RegExp, LucideIcon]> = [
  [/immigration/i, Plane],
  [/family/i, Home],
  [/criminal/i, Scale],
  [/personal injury|injury/i, HeartPulse],
  [/business|corporate/i, Briefcase],
  [/estate/i, FileText],
  [/employment|labor/i, Users],
  [/real estate|property/i, Building2],
];

function getPracticeAreaCaseTypeIds(practiceArea: PublicPracticeArea) {
  return practiceArea.subcategories.flatMap((subcategory) =>
    subcategory.caseTypes.map((caseType) => caseType.id),
  );
}

function getPracticeAreaIcon(name: string) {
  return (
    practiceAreaIconRules.find(([matcher]) => matcher.test(name))?.[1] ??
    Briefcase
  );
}

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
  const certificationFiles = watch("certificationFiles");
  const [manualPracticeAreaIds, setManualPracticeAreaIds] = useState<
    string[]
  >([]);
  const { fields, append, remove } = useFieldArray({
    control,
    name: "certificationDocuments",
  });
  const activePracticeAreaIds = useMemo(
    () =>
      new Set([
        ...manualPracticeAreaIds,
        ...practiceAreas
          .filter((practiceArea) =>
            getPracticeAreaCaseTypeIds(practiceArea).some((caseTypeId) =>
              selectedSpecialtyIds.includes(caseTypeId),
            ),
          )
          .map((practiceArea) => practiceArea.id),
      ]),
    [manualPracticeAreaIds, practiceAreas, selectedSpecialtyIds],
  );
  const selectedPracticeAreas = useMemo(
    () =>
      practiceAreas.filter((practiceArea) =>
        activePracticeAreaIds.has(practiceArea.id),
      ),
    [activePracticeAreaIds, practiceAreas],
  );

  function togglePracticeArea(practiceArea: PublicPracticeArea) {
    const isSelected = activePracticeAreaIds.has(practiceArea.id);

    if (!isSelected) {
      setManualPracticeAreaIds((current) => [...current, practiceArea.id]);
      return;
    }

    const caseTypeIds = new Set(getPracticeAreaCaseTypeIds(practiceArea));

    setManualPracticeAreaIds((current) =>
      current.filter((practiceAreaId) => practiceAreaId !== practiceArea.id),
    );
    setValue(
      "specialtyIds",
      selectedSpecialtyIds.filter((specialtyId) => !caseTypeIds.has(specialtyId)),
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      },
    );
  }

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

  function addCertificationFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;

    setValue("certificationFiles", [...certificationFiles, ...files], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    files.forEach(() => {
      append({
        certificationName: "",
        issuingOrganization: "",
        issuedAt: "",
        expiresAt: "",
      });
    });
  }

  function removeCertification(index: number) {
    setValue(
      "certificationFiles",
      certificationFiles.filter((_, fileIndex) => fileIndex !== index),
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      },
    );
    remove(index);
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

      {!loading && !practiceAreasError && practiceAreas.length > 0 ? (
        <>
          <p className="signup-field-label">
            Practice areas - select areas you support
          </p>
          <div className="practice-area-option-grid">
            {practiceAreas.map((practiceArea, index) => {
              const Icon = getPracticeAreaIcon(practiceArea.name);
              const tone = practiceAreaTones[index % practiceAreaTones.length];
              const isSelected = activePracticeAreaIds.has(practiceArea.id);

              return (
                <button
                  className={
                    isSelected
                      ? "practice-area-option is-selected"
                      : "practice-area-option"
                  }
                  type="button"
                  key={practiceArea.id}
                  onClick={() => togglePracticeArea(practiceArea)}
                  aria-pressed={isSelected}
                >
                  <span className={`practice-area-option__icon tone-${tone}`}>
                    <Icon size={15} />
                  </span>
                  <span>{practiceArea.name}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      {selectedPracticeAreas.length === 0 &&
      !loading &&
      !practiceAreasError &&
      practiceAreas.length > 0 ? (
        <p className="specialty-empty-state">
          Select Level 1 Practice Areas above to configure specialties.
        </p>
      ) : null}

      {selectedPracticeAreas.map((practiceArea) => (
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

      <div className="signup-section-heading signup-section-heading--compact">
        <span className="signup-field-label">Credentials & bar cards</span>
        {certificationFiles.length > 0 ? (
          <label
            className="signup-icon-text-button"
            htmlFor="certification-document-upload"
          >
            <Plus size={14} />
            Add file
          </label>
        ) : null}
      </div>

      <label
        className={
          certificationFiles.length > 0
            ? "upload-area upload-area--compact"
            : "upload-area"
        }
      >
        <input
          id="certification-document-upload"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
          multiple
          onChange={(event) => {
            addCertificationFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <div>
          <FileUp size={18} />
          <strong>Upload bar card or certificates</strong>
          <small>Drag & drop or click to browse (PDF, PNG, JPG)</small>
        </div>
      </label>
      {errors.certificationFiles?.message ? (
        <p className="signup-error">{errors.certificationFiles.message}</p>
      ) : null}

      {fields.map((field, index) => (
        <div className="certification-group" key={field.id}>
          <div className="certification-group__header">
            <div>
              <strong>Certification {index + 1}</strong>
              {certificationFiles[index] ? (
                <span>
                  {certificationFiles[index].name} -{" "}
                  {formatFileSize(certificationFiles[index].size)}
                </span>
              ) : null}
            </div>
            <button
              className="signup-icon-button"
              type="button"
              onClick={() => removeCertification(index)}
              aria-label={`Remove certification ${index + 1}`}
            >
              <Trash2 size={14} />
            </button>
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
            label="Issuing organization (optional)"
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
              label="Issued at (optional)"
              error={errors.certificationDocuments?.[index]?.issuedAt?.message}
            >
              <input
                type="date"
                aria-invalid={!!errors.certificationDocuments?.[index]?.issuedAt}
                {...register(`certificationDocuments.${index}.issuedAt`)}
              />
            </SignupField>
            <SignupField
              label="Expires at (optional)"
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
