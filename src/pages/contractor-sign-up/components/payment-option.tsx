import type { ReactNode } from "react";

type PaymentOptionProps = {
  active: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
};

export function PaymentOption({
  active,
  icon,
  title,
  description,
  onClick,
}: PaymentOptionProps) {
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
