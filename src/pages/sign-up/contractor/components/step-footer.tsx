type StepFooterProps = {
  contextLabel: string;
  buttonLabel?: string;
  disabled?: boolean;
  onNext: () => void;
};

export function StepFooter({
  contextLabel,
  buttonLabel = "Continue",
  disabled = false,
  onNext,
}: StepFooterProps) {
  return (
    <footer className="signup-step-footer">
      <span>{contextLabel}</span>
      <button
        className="signup-primary-button"
        type="button"
        onClick={onNext}
        disabled={disabled}
      >
        {buttonLabel}
      </button>
    </footer>
  );
}
