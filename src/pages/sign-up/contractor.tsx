import {
  ArrowLeft,
  Banknote,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  FileUp,
  Folder,
  Landmark,
  Moon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { demoContractorSignup } from "@/api/auth";
import { useDocumentTitle } from "@/hooks/use-document-title";

type PaymentMethod = "ach" | "paypal";

const steps = [
  "Personal details",
  "Specialties",
  "Background check",
  "Profile setup",
  "Payout setup",
] as const;

const selectedSpecialties = new Set([
  "Business Immigration",
  "Family Immigration",
  "Contested Divorce",
  "Child Custody",
]);

function ProgressBars({ step }: { step: number }) {
  return (
    <div className="signup-progress" aria-label={`Step ${step} of 5`}>
      {steps.map((label, index) => (
        <span
          key={label}
          className={index < step ? "signup-progress__bar is-complete" : "signup-progress__bar"}
        />
      ))}
    </div>
  );
}

function WizardHeader({
  step,
  title,
  onBack,
}: {
  step: number;
  title: string;
  onBack: () => void;
}) {
  return (
    <>
      <div className="signup-card__header">
        <button className="signup-back" type="button" onClick={onBack} aria-label="Go back">
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

function Field({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="signup-field">
      <span>{label}</span>
      <input type={type} placeholder={placeholder} />
    </label>
  );
}

function StepFooter({
  previousLabel,
  buttonLabel = "Continue",
  onNext,
}: {
  previousLabel: string;
  buttonLabel?: string;
  onNext: () => void;
}) {
  return (
    <footer className="signup-step-footer">
      <span>{previousLabel} -</span>
      <button className="signup-primary-button" type="button" onClick={onNext}>
        {buttonLabel}
      </button>
    </footer>
  );
}

function ThemeCircle() {
  return (
    <button className="signup-theme-button" type="button" aria-label="Toggle theme">
      <Moon size={16} />
    </button>
  );
}

function PersonalDetails({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <>
      <WizardHeader step={1} title="Personal details" onBack={onBack} />
      <div className="signup-form-grid">
        <Field label="First name" placeholder="e.g. Marcus" />
        <Field label="Last name" placeholder="e.g. Vance" />
        <Field label="Email address" placeholder="e.g. marcus@contractor.com" type="email" />
        <Field label="Phone number" placeholder="e.g. (555) 014-9988" />
      </div>
      <Field label="Password" placeholder="Choose a password matching strength guidelines" type="password" />
      <div className="password-meter">
        <span />
        <span />
        <span />
      </div>
      <p className="signup-helper">Must be at least 6 characters</p>
      <StepFooter previousLabel="Specialties" onNext={onNext} />
    </>
  );
}

function Specialties({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <>
      <WizardHeader step={2} title="Specialties" onBack={onBack} />
      <h2 className="signup-section-title">Your specialties</h2>
      <SpecialtyGroup
        title="Federal practice areas"
        expanded
        sections={[
          {
            title: "Immigration",
            items: ["Business Immigration", "Family Immigration", "Removal Defense", "Humanitarian / Asylum"],
          },
          {
            title: "IP & Patent",
            items: ["Patent Prosecution", "Trademark Registration", "IP Litigation"],
          },
        ]}
      />
      <SpecialtyGroup
        title="State / local matters"
        expanded
        sections={[
          {
            title: "Family Law",
            items: ["Contested Divorce", "Child Custody", "Mediation Services"],
          },
          {
            title: "Criminal Defense",
            items: ["Felonies", "Misdemeanors / Traffic", "White Collar"],
          },
        ]}
      />

      <label className="upload-area">
        <span>Credentials & bar cards</span>
        <input type="file" multiple />
        <div>
          <FileUp size={18} />
          <strong>Upload bar card or certificates</strong>
          <small>Drag & drop or click to browse (PDF, PNG, JPG)</small>
        </div>
      </label>

      <StepFooter previousLabel="Background check" onNext={onNext} />
    </>
  );
}

function SpecialtyGroup({
  title,
  expanded,
  sections,
}: {
  title: string;
  expanded: boolean;
  sections: Array<{ title: string; items: string[] }>;
}) {
  return (
    <div className="specialty-group">
      <button className="specialty-group__header" type="button">
        <Folder size={15} />
        <span>{title}</span>
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {expanded ? (
        <div className="specialty-tree">
          {sections.map((section) => (
            <div className="specialty-tree__section" key={section.title}>
              <div className="specialty-tree__title">
                <Folder size={14} />
                <strong>{section.title}</strong>
                <ChevronDown size={13} />
              </div>
              {section.items.map((item) => (
                <label className="signup-checkbox" key={item}>
                  <input type="checkbox" defaultChecked={selectedSpecialties.has(item)} />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BackgroundCheck({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <>
      <WizardHeader step={3} title="Background check" onBack={onBack} />
      <div className="signup-info-box">
        <h2>Consent to background check</h2>
        <p>
          To maintain the security of the attorney workspaces, Oravanti requires credential
          verification and background checking. This screens licenses, verification status, and
          criminal history. Processing takes 2-3 business days.
        </p>
      </div>
      <label className="signup-consent">
        <input type="checkbox" />
        <span>I consent to a background check and credential verification</span>
      </label>
      <Field label="Desired hourly rate (USD/hr)" placeholder="e.g. 75" />
      <StepFooter previousLabel="Profile setup" onNext={onNext} />
    </>
  );
}

function ProfileSetup({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <>
      <WizardHeader step={4} title="Profile setup" onBack={onBack} />
      <label className="signup-field">
        <span>Professional bio</span>
        <textarea placeholder="Briefly describe your experience and skills in legal contracting." />
      </label>
      <label className="signup-field">
        <span>Availability</span>
        <select defaultValue="">
          <option value="" disabled>
            Select availability
          </option>
          <option>Full-time</option>
          <option>Part-time</option>
          <option>Project-based</option>
        </select>
      </label>
      <label className="signup-consent signup-consent--filled">
        <input type="checkbox" defaultChecked />
        <span>I recognize directory listings are subject to verification checks.</span>
      </label>
      <StepFooter previousLabel="Payout setup" onNext={onNext} />
    </>
  );
}

function PayoutSetup({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("ach");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    await demoContractorSignup();
    setSubmitting(false);
    onComplete();
  }

  return (
    <>
      <WizardHeader step={5} title="Payout setup" onBack={onBack} />
      <div className="signup-alert">
        <CircleAlert size={14} />
        <span>
          Oravanti pays you within 3 business days of invoice approval for each completed assignment.
          This step sets up where your payments go.
        </span>
      </div>
      <p className="signup-small-label">How would you like to be paid?</p>
      <div className="payment-grid">
        <PaymentOption
          active={method === "ach"}
          icon={<Landmark size={18} />}
          title="Bank transfer (ACH)"
          description="Direct deposit to your bank account"
          onClick={() => setMethod("ach")}
        />
        <PaymentOption
          active={method === "paypal"}
          icon={<Banknote size={18} />}
          title="PayPal"
          description="Paid to your PayPal account"
          onClick={() => setMethod("paypal")}
        />
      </div>

      {method === "ach" ? (
        <>
          <Field label="Account holder name" placeholder="Account holder name" />
          <div className="signup-form-grid">
            <Field label="Routing number" placeholder="9-digit routing number" />
            <Field label="Account number" placeholder="Account number" />
          </div>
          <p className="signup-helper">Your banking details are encrypted and never shared with law firms.</p>
        </>
      ) : (
        <>
          <Field label="PayPal email address" placeholder="your@paypal.com" type="email" />
          <p className="signup-helper">
            Payments will be sent to this PayPal address after invoice approval.
          </p>
        </>
      )}

      <footer className="signup-step-footer">
        <button className="signup-text-button" type="button" onClick={onBack}>
          - Profile setup
        </button>
        <button className="signup-primary-button" type="button" onClick={submit} disabled={submitting}>
          {submitting ? "Submitting..." : "Complete setup"}
        </button>
      </footer>
    </>
  );
}

function PaymentOption({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      className={active ? "payment-option is-selected" : "payment-option"}
      type="button"
      onClick={onClick}
    >
      <span>{icon}</span>
      <strong>{title}</strong>
      <small>{description}</small>
    </button>
  );
}

function CompleteView() {
  return (
    <main className="signup-page">
      <ThemeCircle />
      <section className="signup-card signup-card--complete">
        <div className="signup-complete-icon">
          <CircleCheck size={28} />
        </div>
        <h1>Profile submitted for review</h1>
        <p>
          Your payout method is saved. Once your background check clears (2-3 business days),
          your profile goes live on the marketplace and you can start receiving assignments.
        </p>
        <a className="signup-primary-button signup-primary-button--dashboard" href="/dashboard">
          Go to contractor dashboard
        </a>
      </section>
    </main>
  );
}

export function ContractorSignupPage() {
  const navigate = useNavigate();
  const [complete, setComplete] = useState(false);
  const [step, setStep] = useState(1);

  useDocumentTitle("Contractor signup - Oravanti");

  function goBack() {
    if (step === 1) {
      navigate("/signup");
      return;
    }

    setStep((current) => Math.max(1, current - 1));
  }

  if (complete) return <CompleteView />;

  return (
    <main className="signup-page">
      <ThemeCircle />
      <section className={step === 2 ? "signup-card signup-card--tall" : "signup-card"}>
        {step === 1 ? <PersonalDetails onBack={goBack} onNext={() => setStep(2)} /> : null}
        {step === 2 ? <Specialties onBack={goBack} onNext={() => setStep(3)} /> : null}
        {step === 3 ? <BackgroundCheck onBack={goBack} onNext={() => setStep(4)} /> : null}
        {step === 4 ? <ProfileSetup onBack={goBack} onNext={() => setStep(5)} /> : null}
        {step === 5 ? (
          <PayoutSetup onBack={goBack} onComplete={() => setComplete(true)} />
        ) : null}
      </section>
    </main>
  );
}
