export const tabsConfig = [
  { value: "general", label: "General" },
  // Consultation fees, payment schedule and no-show policy. Split out of
  // General once it was clear the fee card was growing rather than settling.
  { value: "consultations", label: "Consultations" },
  // "Subscription", not "Billing": this is the firm's plan with us. The
  // Payments tab below is money flowing the other way — what the firm's own
  // clients pay them — and two tabs called "Billing" and "Payments" read as the
  // same thing.
  // Who signs a retainer on the firm's side, and what waits for that signature.
  // Not a card under Consultations (which is about what a consultation costs)
  // and not one under Payments (which returns early with no processor
  // connected, while a firm taking cheques still has to name a signatory).
  { value: "fee-agreements", label: "Fee agreements" },
  { value: "billing", label: "Subscription" },
  { value: "notifications", label: "Notifications" },
  { value: "compliance", label: "Compliance" },
  { value: "payments", label: "Payments" },
  // Its own tab rather than a card under Payments: that tab returns early when
  // no processor is connected, and a firm holding client money in an IOLTA
  // account but taking cheques still has to be able to say who may see it.
  { value: "financial-access", label: "Financial access" },
];
