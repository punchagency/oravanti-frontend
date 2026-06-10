import { Banknote, CircleAlert, Landmark } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { PaymentOption } from "../components/payment-option";
import { SignupField } from "../components/signup-field";
import { WizardHeader } from "../components/wizard-header";
import type { ContractorSignupFormValues } from "../schema";

type PayoutSetupStepProps = {
  isSubmitting: boolean;
  submitError?: string;
  onBack: () => void;
};

export function PayoutSetupStep({
  isSubmitting,
  submitError,
  onBack,
}: PayoutSetupStepProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<ContractorSignupFormValues>();
  const paymentMethod = watch("paymentDetails.paymentMethod");

  return (
    <>
      <WizardHeader step={5} title="Payout setup" onBack={onBack} />
      <div className="signup-alert">
        <CircleAlert size={14} />
        <span>
          Oravanti pays you within 3 business days of invoice approval for each
          completed assignment. This step sets up where your payments go.
        </span>
      </div>
      <p className="signup-small-label">How would you like to be paid?</p>
      <div className="payment-grid">
        <PaymentOption
          active={paymentMethod === "bank_account"}
          icon={<Landmark size={18} />}
          title="Bank transfer"
          description="Direct deposit to your bank account"
          onClick={() =>
            setValue("paymentDetails.paymentMethod", "bank_account", {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
          }
        />
        <PaymentOption
          active={paymentMethod === "paypal"}
          icon={<Banknote size={18} />}
          title="PayPal"
          description="Paid to your PayPal account"
          onClick={() =>
            setValue("paymentDetails.paymentMethod", "paypal", {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
          }
        />
      </div>

      {paymentMethod === "bank_account" ? (
        <>
          <SignupField
            label="Account holder name"
            error={errors.paymentDetails?.accountHolderName?.message}
          >
            <input
              type="text"
              placeholder="Account holder name"
              aria-invalid={!!errors.paymentDetails?.accountHolderName}
              {...register("paymentDetails.accountHolderName")}
            />
          </SignupField>
          <div className="signup-form-grid">
            <SignupField
              label="Routing number"
              error={errors.paymentDetails?.routingNumber?.message}
            >
              <input
                type="text"
                placeholder="9-digit routing number"
                aria-invalid={!!errors.paymentDetails?.routingNumber}
                {...register("paymentDetails.routingNumber")}
              />
            </SignupField>
            <SignupField
              label="Account number"
              error={errors.paymentDetails?.accountNumber?.message}
            >
              <input
                type="text"
                placeholder="Account number"
                aria-invalid={!!errors.paymentDetails?.accountNumber}
                {...register("paymentDetails.accountNumber")}
              />
            </SignupField>
          </div>
          <p className="signup-helper">
            Your banking details are encrypted and never shared with law firms.
          </p>
        </>
      ) : (
        <>
          <SignupField
            label="PayPal email address"
            error={errors.paymentDetails?.paypalEmail?.message}
          >
            <input
              type="email"
              placeholder="your@paypal.com"
              aria-invalid={!!errors.paymentDetails?.paypalEmail}
              {...register("paymentDetails.paypalEmail")}
            />
          </SignupField>
          <p className="signup-helper">
            Payments will be sent to this PayPal address after invoice approval.
          </p>
        </>
      )}

      {submitError ? <p className="signup-error">{submitError}</p> : null}

      <footer className="signup-step-footer">
        <button className="signup-text-button" type="button" onClick={onBack}>
          Back to profile setup
        </button>
        <button
          className="signup-primary-button"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Complete setup"}
        </button>
      </footer>
    </>
  );
}
