export const tabsConfig = [
  { value: "general", label: "General" },
  // Consultation fees, payment schedule and no-show policy. Split out of
  // General once it was clear the fee card was growing rather than settling.
  { value: "consultations", label: "Consultations" },
  // "Subscription", not "Billing": this is the firm's plan with us. The
  // Payments tab below is money flowing the other way — what the firm's own
  // clients pay them — and two tabs called "Billing" and "Payments" read as the
  // same thing.
  { value: "billing", label: "Subscription" },
  { value: "notifications", label: "Notifications" },
  { value: "compliance", label: "Compliance" },
  { value: "payments", label: "Payments" },
  // Its own tab rather than a card under Payments: that tab returns early when
  // no processor is connected, and a firm holding client money in an IOLTA
  // account but taking cheques still has to be able to say who may see it.
  { value: "financial-access", label: "Financial access" },
];
