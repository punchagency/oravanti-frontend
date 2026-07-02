export interface AlertItem {
  dotColor: string;
  title: string;
  badge: { label: string; bg: string; color: string };
  description: string;
  actions: { label: string }[];
}

export interface DocumentRow {
  name: string;
  type: string;
  source: string;
  uploaded: string;
  review: { label: string; bg: string; color: string } | null;
  actions: ("download" | "view")[];
}

export interface DocumentGroup {
  label: string;
  rows: DocumentRow[];
}

export const alerts: AlertItem[] = [
  {
    dotColor: "brand.emphasized",
    title: "Passport expiry risk",
    badge: { label: "Warning", bg: "brand.subtle", color: "brand.fg" },
    description:
      "Client's passport expires Dec 2026 \u2014 within 6 months of the Jun 22 interview date. USCIS requires passport validity beyond the adjudication period. This may result in a request for evidence or interview postponement.",
    actions: [
      { label: "Request re-upload" },
      { label: "Flag for attorney" },
      { label: "Request interview postponement" },
    ],
  },
  {
    dotColor: "brand.solid",
    title: "I-693 medical exam outstanding",
    badge: { label: "Action required", bg: "brand.solid", color: "brand.contrast" },
    description:
      "The I-693 medical examination report has not been uploaded. This is a mandatory document for I-485 filing. Failure to provide it before the interview may result in a continuance or denial.",
    actions: [
      { label: "Send client reminder" },
      { label: "Flag as urgent" },
    ],
  },
];

export const documentGroups: DocumentGroup[] = [
  {
    label: "Uploaded by client (3)",
    rows: [
      {
        name: "Passport biographic page",
        type: "Identity",
        source: "Client portal",
        uploaded: "Jun 19, 2026",
        review: { label: "Expiry risk", bg: "brand.subtle", color: "brand.fg" },
        actions: ["download", "view"],
      },
      {
        name: "Marriage certificate",
        type: "Supporting",
        source: "Client portal",
        uploaded: "Jun 10, 2026",
        review: { label: "Verified", bg: "brand.muted", color: "brand.fg" },
        actions: ["download"],
      },
      {
        name: "I-94 travel record",
        type: "Immigration",
        source: "Client portal",
        uploaded: "Jun 1, 2026",
        review: { label: "Verified", bg: "brand.muted", color: "brand.fg" },
        actions: ["download"],
      },
    ],
  },
  {
    label: "Firm generated (2)",
    rows: [
      {
        name: "Fee agreement \u2014 signed",
        type: "Legal",
        source: "Firm",
        uploaded: "Mar 18, 2026",
        review: { label: "Verified", bg: "brand.muted", color: "brand.fg" },
        actions: ["download", "view"],
      },
      {
        name: "I-485 draft filing",
        type: "Filing",
        source: "Firm",
        uploaded: "May 20, 2026",
        review: { label: "Under review", bg: "brand.subtle", color: "brand.fg" },
        actions: ["download", "view"],
      },
    ],
  },
  {
    label: "Government / third party (2)",
    rows: [
      {
        name: "USCIS interview notice",
        type: "Notice",
        source: "USCIS",
        uploaded: "May 15, 2026",
        review: { label: "Verified", bg: "brand.muted", color: "brand.fg" },
        actions: ["download"],
      },
      {
        name: "USCIS case status receipt",
        type: "Notice",
        source: "USCIS",
        uploaded: "Apr 28, 2026",
        review: { label: "Verified", bg: "brand.muted", color: "brand.fg" },
        actions: ["download"],
      },
    ],
  },
];
