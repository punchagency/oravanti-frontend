import type {
  EffectiveInvoiceStatus,
  TimeEntryStatus,
} from "@/api/finance";

export const tabsConfig = [
  { value: "invoicing", label: "Invoicing" },
  { value: "time-billing", label: "Time & billing" },
  { value: "reports", label: "Reports" },
] as const;

export type FinanceTab = (typeof tabsConfig)[number]["value"];

export const DEFAULT_TAB: FinanceTab = "invoicing";

/** `StatusPill` tones, keyed by the bucket the server put the invoice in. */
export const INVOICE_STATUS_TONE: Record<
  EffectiveInvoiceStatus,
  "success" | "warning" | "danger" | "info" | "neutral"
> = {
  paid: "success",
  partial: "info",
  unpaid: "warning",
  overdue: "danger",
  draft: "neutral",
  void: "neutral",
};

export const INVOICE_STATUS_LABEL: Record<EffectiveInvoiceStatus, string> = {
  paid: "Paid",
  partial: "Partial",
  unpaid: "Unpaid",
  overdue: "Overdue",
  draft: "Draft",
  void: "Void",
};

export const TIME_STATUS_TONE: Record<
  TimeEntryStatus,
  "success" | "warning" | "danger"
> = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
};

export const TIME_STATUS_LABEL: Record<TimeEntryStatus, string> = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
};

export const INVOICE_STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Drafts (not yet sent)" },
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partial" },
  { value: "overdue", label: "Overdue" },
];

export const ACCOUNT_OPTIONS = [
  { value: "all", label: "All accounts" },
  { value: "operating", label: "Operating account" },
  { value: "trust", label: "Trust account" },
];

export const TIME_ENTRY_OPTIONS = [
  { value: "all", label: "All entries" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
];

/**
 * Month options for the Reports selector: the current month and the eleven
 * before it, in the browser's locale.
 */
export const buildMonthOptions = (count = 12) => {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return {
      value,
      label: d.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    };
  });
};

export const currentMonth = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/** Dot colours for the summary chip row, matching the mockup's palette. */
export const CHIP_COLORS = {
  purple: "#6a5cc7",
  green: "#2e9e6b",
  amber: "#b5851f",
  red: "#d64545",
  blue: "#3b82c4",
} as const;
