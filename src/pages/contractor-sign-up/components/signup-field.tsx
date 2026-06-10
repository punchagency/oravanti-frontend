import type { ReactNode } from "react";

type SignupFieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

export function SignupField({ label, error, children }: SignupFieldProps) {
  return (
    <label className="signup-field">
      <span>{label}</span>
      {children}
      {error ? <small className="signup-field__error">{error}</small> : null}
    </label>
  );
}
