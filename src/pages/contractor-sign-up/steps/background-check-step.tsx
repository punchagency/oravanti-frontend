import { FileUp, Trash2 } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { SignupField } from "../components/signup-field";
import { StepFooter } from "../components/step-footer";
import { WizardHeader } from "../components/wizard-header";
import type { ContractorSignupFormValues } from "../schema";

type BackgroundCheckStepProps = {
  onBack: () => void;
  onNext: () => void;
};

const requiredIdentificationFileCount = 2;

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function BackgroundCheckStep({ onBack, onNext }: BackgroundCheckStepProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<ContractorSignupFormValues>();
  const identificationFiles = watch("identificationFiles");

  function addIdentificationFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;

    setValue(
      "identificationFiles",
      [...identificationFiles, ...files].slice(0, requiredIdentificationFileCount),
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      },
    );
  }

  function removeIdentificationFile(index: number) {
    setValue(
      "identificationFiles",
      identificationFiles.filter((_, fileIndex) => fileIndex !== index),
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      },
    );
  }

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

      <div className="signup-section-heading signup-section-heading--compact">
        <span className="signup-field-label">
          Identification documents - 2 required
        </span>
      </div>
      <p className="signup-helper">
        Upload two forms of identification, such as a passport, driver's
        license, state ID, or other government-issued ID.
      </p>
      {identificationFiles.length < requiredIdentificationFileCount ? (
        <label
          className={
            identificationFiles.length > 0
              ? "upload-area upload-area--compact"
              : "upload-area"
          }
        >
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            multiple
            onChange={(event) => {
              addIdentificationFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <div>
            <FileUp size={18} />
            <strong>Upload identification documents</strong>
            <small>
              {requiredIdentificationFileCount - identificationFiles.length} of{" "}
              {requiredIdentificationFileCount} remaining (PDF, PNG, JPG)
            </small>
          </div>
        </label>
      ) : null}
      {errors.identificationFiles?.message ? (
        <p className="signup-error">{errors.identificationFiles.message}</p>
      ) : null}
      {identificationFiles.map((file, index) => (
        <div className="certification-group" key={`${file.name}-${index}`}>
          <div className="certification-group__header">
            <div>
              <strong>Identification {index + 1}</strong>
              <span>
                {file.name} - {formatFileSize(file.size)}
              </span>
            </div>
            <button
              className="signup-icon-button"
              type="button"
              onClick={() => removeIdentificationFile(index)}
              aria-label={`Remove identification ${index + 1}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

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
