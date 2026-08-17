export const tabsConfig = [
  { value: "general", label: "General" },
  { value: "billing", label: "Billing" },
  { value: "notifications", label: "Notifications" },
  { value: "compliance", label: "Compliance" },
  // "Payment processing", not "Payments": the Billing tab beside it is the
  // firm's own subscription to us, and this is money flowing the other way.
  { value: "payments", label: "Payment processing" },
];
