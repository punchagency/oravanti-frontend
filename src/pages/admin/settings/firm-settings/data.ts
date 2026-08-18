export const tabsConfig = [
  { value: "general", label: "General" },
  // "Subscription", not "Billing": this is the firm's plan with us. The
  // Payments tab below is money flowing the other way — what the firm's own
  // clients pay them — and two tabs called "Billing" and "Payments" read as the
  // same thing.
  { value: "billing", label: "Subscription" },
  { value: "notifications", label: "Notifications" },
  { value: "compliance", label: "Compliance" },
  { value: "payments", label: "Payments" },
];
