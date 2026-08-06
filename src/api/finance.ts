import { API } from ".";

// ─── Shared ──────────────────────────────────────────────────────────────────

export type ExportFormat = "csv" | "pdf";
export type AccountLevel = "full_access" | "view_only" | "no_access";

/**
 * Echoed on every finance response. When `trust` is `no_access` the server
 * sends `null` for trust figures rather than 0 — render an em-dash or hide the
 * panel, never a $0.00.
 */
export type FinanceRestrictions = { trust: AccountLevel };

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type InvoiceStatusFilter =
  | "all"
  | "paid"
  | "unpaid"
  | "partial"
  | "overdue";
export type AccountFilter = "all" | "operating" | "trust";

/**
 * The bucket the SERVER put this invoice in. Derived there against the firm's
 * timezone, so never recompute "is it overdue" from `dueDate` in the browser —
 * the two would disagree either side of midnight.
 */
export type EffectiveInvoiceStatus =
  | "draft"
  | "unpaid"
  | "partial"
  | "paid"
  | "overdue"
  | "void";

export type PaymentMethod =
  | "credit_card"
  | "bank_transfer"
  | "check"
  | "cash"
  | "wire"
  | "other";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  credit_card: "Credit card",
  bank_transfer: "Bank transfer",
  check: "Check",
  cash: "Cash",
  wire: "Wire",
  other: "Other",
};

// ─── Invoicing ───────────────────────────────────────────────────────────────

export type InvoiceListRow = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  clientId: string;
  clientName: string;
  clientEmail: string | null;
  caseId: string | null;
  caseNumber: string | null;
  caseTypeLabel: string | null;
  operatingAmount: number;
  /** Null when withheld — not zero. */
  trustAmount: number | null;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: EffectiveInvoiceStatus;
};

export type InvoiceListTotals = {
  operating: number;
  trust: number | null;
  total: number;
};

export type GetInvoicesParams = {
  status?: InvoiceStatusFilter;
  account?: AccountFilter;
  search?: string;
  clientId?: string;
  caseId?: string;
  page?: number;
  limit?: number;
};

export type GetInvoicesResponse = {
  data: InvoiceListRow[];
  pagination: PaginationMeta;
  totals: InvoiceListTotals;
  restrictions: FinanceRestrictions;
};

export type InvoiceStats = {
  invoiceCount: number;
  totalInvoiced: number;
  collected: number;
  collectedCount: number;
  outstanding: number;
  outstandingCount: number;
  overdueCount: number;
  pastDueAmount: number;
  operatingTotal: number;
  trustTotal: number | null;
};

export type AgingBucket = {
  key: "current" | "1_15" | "16_30" | "31_plus";
  label: string;
  amount: number;
};

export type FinanceActivityEntry = {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  amount: number | null;
  paymentMethod: PaymentMethod | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  clientName: string | null;
  createdAt: string;
};

export type InvoiceLineItem = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  account: "operating" | "trust_iolta";
  timeEntryId: string | null;
};

export type InvoicePayment = {
  id: string;
  amount: number;
  amountOperating: number;
  amountTrust: number | null;
  paymentDate: string;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  createdAt: string;
};

export type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
  status: EffectiveInvoiceStatus;
  storedStatus: string;
  issueDate: string;
  dueDate: string;
  notes: string | null;
  filingType: string | null;
  client: { id: string; name: string; email: string | null };
  matter: { id: string; reference: string | null; type: string | null } | null;
  practiceArea: string | null;
  attorney: string | null;
  lineItems: InvoiceLineItem[];
  payments: InvoicePayment[];
  totals: {
    operating: number;
    trust: number | null;
    total: number;
    amountPaid: number;
    balanceDue: number;
  };
  lastPaymentMethod: PaymentMethod | null;
  lastPaymentDate: string | null;
  sentAt: string | null;
  paidAt: string | null;
  createdAt: string;
  restrictions: FinanceRestrictions;
};

export type UnbilledTimeEntry = {
  id: string;
  entryDate: string;
  hours: number;
  rate: number | null;
  amount: number | null;
  description: string | null;
  caseId: string | null;
  caseNumber: string | null;
  staffName: string | null;
  /** No billing rate resolved — the UI should prompt rather than show $0.00. */
  rateUnset: boolean;
};

export type CreateInvoiceInput = {
  clientId: string;
  caseId?: string;
  practiceAreaId?: string;
  attorneyId?: string;
  filingType?: string;
  issueDate: string;
  dueDate: string;
  notes?: string;
  status?: "draft" | "sent";
  lineItems: {
    description: string;
    quantity: number;
    rate: number;
    account: "operating" | "trust_iolta";
  }[];
  timeEntryIds: string[];
};

export type RecordPaymentInput = {
  amount: number;
  amountOperating?: number;
  amountTrust?: number;
  paymentDate: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
};

export type SendFollowUpInput = {
  message: string;
  channel: "email" | "sms" | "both";
};

export type FollowUpResult = {
  id: string;
  channel: "email" | "sms" | "both";
  emailDelivered: boolean;
  smsDelivered: boolean;
  sentAt: string;
  daysOverdue: number;
};

const toQuery = (params: Record<string, unknown>) => {
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (value === "all") continue;
    query[key] = String(value);
  }
  return query;
};

export async function getInvoices(
  params: GetInvoicesParams = {},
): Promise<GetInvoicesResponse> {
  const { data: res } = await API.get("/finance/invoices", {
    params: toQuery(params),
  });
  return {
    data: res.data,
    pagination: res.pagination,
    totals: res.totals,
    restrictions: res.restrictions,
  };
}

export async function getInvoiceStats(): Promise<{
  stats: InvoiceStats;
  restrictions: FinanceRestrictions;
}> {
  const { data: res } = await API.get("/finance/invoices/stats");
  return { stats: res.data, restrictions: res.restrictions };
}

export async function getInvoiceAging(): Promise<AgingBucket[]> {
  const { data } = await API.get<{ data: AgingBucket[] }>(
    "/finance/invoices/aging",
  );
  return data.data;
}

export async function getFinanceActivity(
  limit = 8,
): Promise<FinanceActivityEntry[]> {
  const { data } = await API.get<{ data: FinanceActivityEntry[] }>(
    "/finance/invoices/activity",
    { params: { limit } },
  );
  return data.data;
}

export async function getInvoiceById(id: string): Promise<InvoiceDetail> {
  const { data } = await API.get<{ data: InvoiceDetail }>(
    `/finance/invoices/${id}`,
  );
  return data.data;
}

export async function getUnbilledTime(
  params: { clientId?: string; caseId?: string } = {},
): Promise<UnbilledTimeEntry[]> {
  const { data } = await API.get<{ data: UnbilledTimeEntry[] }>(
    "/finance/invoices/unbilled-time",
    { params: toQuery(params) },
  );
  return data.data;
}

export async function createInvoice(
  input: CreateInvoiceInput,
): Promise<InvoiceDetail> {
  const { data } = await API.post<{ data: InvoiceDetail }>(
    "/finance/invoices",
    input,
  );
  return data.data;
}

export async function recordPayment(
  invoiceId: string,
  input: RecordPaymentInput,
): Promise<InvoiceDetail> {
  const { data } = await API.post<{ data: InvoiceDetail }>(
    `/finance/invoices/${invoiceId}/payments`,
    input,
  );
  return data.data;
}

export async function sendFollowUp(
  invoiceId: string,
  input: SendFollowUpInput,
): Promise<FollowUpResult> {
  const { data } = await API.post<{ data: FollowUpResult }>(
    `/finance/invoices/${invoiceId}/follow-up`,
    input,
  );
  return data.data;
}

export async function voidInvoice(
  invoiceId: string,
  reason?: string,
): Promise<InvoiceDetail> {
  const { data } = await API.post<{ data: InvoiceDetail }>(
    `/finance/invoices/${invoiceId}/void`,
    { reason },
  );
  return data.data;
}

// ─── Time & billing ──────────────────────────────────────────────────────────

export type TimeEntryStatus = "pending" | "approved" | "rejected";
export type TimeEntryStatusFilter = "all" | "pending" | "approved";

export type TimeEntryRow = {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string | null;
  caseId: string | null;
  caseNumber: string | null;
  entryDate: string;
  hoursWorked: number;
  billable: boolean;
  amount: number | null;
  status: TimeEntryStatus;
  description: string | null;
  rateUnset: boolean;
  invoicedAt: string | null;
};

export type TimeBillingStats = {
  hoursLogged: number;
  billableHours: number;
  totalEarnings: number;
  approvedCount: number;
  pendingCount: number;
  billableRate: number;
  rateUnsetCount: number;
};

export type EarningsByStaffRow = {
  staffId: string;
  staffName: string;
  hours: number;
  entryCount: number;
  amount: number;
};

export type TopMattersResult = {
  matters: {
    caseId: string;
    caseNumber: string;
    clientName: string;
    hours: number;
    amount: number;
  }[];
  /** Hours logged against no matter, so the figures reconcile with the tile. */
  unattributedHours: number;
};

export type GetTimeEntriesParams = {
  status?: TimeEntryStatusFilter;
  staffId?: string;
  caseId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export type GetTimeEntriesResponse = {
  data: TimeEntryRow[];
  pagination: PaginationMeta;
  totals: { hours: number; amount: number };
};

export type LogTimeInput = {
  staffId?: string;
  caseId?: string;
  entryDate: string;
  hoursWorked: number;
  description?: string;
  billable: boolean;
};

export type BillingRateRow = {
  id: string;
  staffId: string | null;
  staffName: string | null;
  role: string | null;
  rate: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  isOpen: boolean;
  createdAt: string;
};

export async function getTimeEntries(
  params: GetTimeEntriesParams = {},
): Promise<GetTimeEntriesResponse> {
  const { data: res } = await API.get("/finance/time-entries", {
    params: toQuery(params),
  });
  return { data: res.data, pagination: res.pagination, totals: res.totals };
}

export async function getTimeBillingStats(
  params: { from?: string; to?: string } = {},
): Promise<TimeBillingStats> {
  const { data } = await API.get<{ data: TimeBillingStats }>(
    "/finance/time-entries/stats",
    { params: toQuery(params) },
  );
  return data.data;
}

export async function getEarningsByStaff(
  params: { from?: string; to?: string } = {},
): Promise<EarningsByStaffRow[]> {
  const { data } = await API.get<{ data: EarningsByStaffRow[] }>(
    "/finance/time-entries/earnings-by-staff",
    { params: toQuery(params) },
  );
  return data.data;
}

export async function getTopMatters(
  params: { from?: string; to?: string; limit?: number } = {},
): Promise<TopMattersResult> {
  const { data } = await API.get<{ data: TopMattersResult }>(
    "/finance/time-entries/top-matters",
    { params: toQuery(params) },
  );
  return data.data;
}

export async function logTime(input: LogTimeInput): Promise<TimeEntryRow> {
  const { data } = await API.post<{ data: TimeEntryRow }>(
    "/finance/time-entries",
    input,
  );
  return data.data;
}

export async function approveTimeEntry(id: string): Promise<TimeEntryRow> {
  const { data } = await API.post<{ data: TimeEntryRow }>(
    `/finance/time-entries/${id}/approve`,
  );
  return data.data;
}

export async function rejectTimeEntry(
  id: string,
  reason: string,
): Promise<TimeEntryRow> {
  const { data } = await API.post<{ data: TimeEntryRow }>(
    `/finance/time-entries/${id}/reject`,
    { reason },
  );
  return data.data;
}

export async function getBillingRates(): Promise<BillingRateRow[]> {
  const { data } = await API.get<{ data: BillingRateRow[] }>(
    "/finance/time-entries/billing-rates",
  );
  return data.data;
}

export async function setBillingRate(input: {
  staffId?: string;
  role?: string;
  rate: number;
  effectiveFrom: string;
}): Promise<BillingRateRow> {
  const { data } = await API.post<{ data: BillingRateRow }>(
    "/finance/time-entries/billing-rates",
    input,
  );
  return data.data;
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export type FinanceReport = {
  month: string;
  summary: {
    totalRevenue: number;
    collected: number;
    outstanding: number;
    overdue: number;
    invoiceCount: number;
    collectionRate: number;
  };
  accountSplit: {
    operating: number;
    trust: number | null;
    operatingPercent: number;
    trustPercent: number | null;
  };
  collectionStatus: { status: string; count: number; amount: number }[];
  byPracticeArea: {
    practiceAreaId: string | null;
    name: string;
    invoiceCount: number;
    invoiced: number;
    collected: number;
    outstanding: number;
    collectionRate: number;
  }[];
  aging: {
    /** Aging covers ALL outstanding invoices, not just the selected month. */
    scope: "all_time";
    total: number;
    buckets: { key: string; label: string; amount: number }[];
  };
  trustReconciliation: {
    filingFeesInvoiced: number;
    filingFeesCollected: number;
    heldInTrustPending: number;
    trustInvoiceCount: number;
    /** False until a trust_disbursements table exists — label accordingly. */
    disbursementsTracked: boolean;
    invoices: {
      id: string;
      invoiceNumber: string;
      clientName: string;
      trustAmount: number;
      paid: boolean;
    }[];
  } | null;
  restrictions: FinanceRestrictions;
};

export async function getFinanceReport(month?: string): Promise<FinanceReport> {
  const { data } = await API.get<{ data: FinanceReport }>("/finance/reports", {
    params: toQuery({ month }),
  });
  return data.data;
}

// ─── Exports (file download) ─────────────────────────────────────────────────

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export async function exportInvoices(
  format: ExportFormat,
  params: GetInvoicesParams = {},
): Promise<void> {
  const res = await API.get("/finance/invoices/export", {
    params: { ...toQuery(params), format },
    responseType: "blob",
  });
  downloadBlob(res.data, `invoices.${format}`);
}

export async function exportTimeEntries(
  format: ExportFormat,
  params: GetTimeEntriesParams = {},
): Promise<void> {
  const res = await API.get("/finance/time-entries/export", {
    params: { ...toQuery(params), format },
    responseType: "blob",
  });
  downloadBlob(res.data, `time-entries.${format}`);
}

export async function exportFinanceReport(
  format: ExportFormat,
  month?: string,
): Promise<void> {
  const res = await API.get("/finance/reports/export", {
    params: { ...toQuery({ month }), format },
    responseType: "blob",
  });
  downloadBlob(res.data, `finance-report-${month ?? "current"}.${format}`);
}

/**
 * Invoice PDF, rendered client-side from the detail the dialog already has.
 *
 * The server has no per-invoice PDF endpoint; adding one would duplicate the
 * document layout that already exists for fee agreements. Print-to-PDF via the
 * browser keeps one source of truth for how an invoice looks.
 */
export const printInvoice = (invoice: InvoiceDetail): void => {
  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) return;
  win.document.write(renderInvoiceHtml(invoice));
  win.document.close();
  win.focus();
  win.print();
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const renderInvoiceHtml = (inv: InvoiceDetail): string => `
<!doctype html><html><head><meta charset="utf-8">
<title>${escapeHtml(inv.invoiceNumber)}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; padding: 40px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .muted { color: #666; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .04em;
       color: #666; border-bottom: 1px solid #ddd; padding: 8px 0; }
  td { padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
  .num { text-align: right; }
  .totals { margin-top: 20px; margin-left: auto; width: 260px; font-size: 13px; }
  .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px;
          margin-top: 20px; font-size: 13px; background: #faf9f6; padding: 16px; border-radius: 8px; }
</style></head><body>
<h1>Invoice ${escapeHtml(inv.invoiceNumber)}</h1>
<div class="muted">${escapeHtml(inv.client.name)}${inv.matter?.reference ? ` · ${escapeHtml(inv.matter.reference)}` : ""}</div>
<div class="grid">
  <div><b>Client:</b> ${escapeHtml(inv.client.name)}</div>
  <div><b>Email:</b> ${escapeHtml(inv.client.email ?? "—")}</div>
  <div><b>Matter:</b> ${escapeHtml(inv.matter?.reference ?? "—")}</div>
  <div><b>Filing type:</b> ${escapeHtml(inv.filingType ?? "—")}</div>
  <div><b>Attorney:</b> ${escapeHtml(inv.attorney ?? "—")}</div>
  <div><b>Issue date:</b> ${escapeHtml(inv.issueDate)}</div>
  <div><b>Due date:</b> ${escapeHtml(inv.dueDate)}</div>
  <div><b>Payment method:</b> ${escapeHtml(inv.lastPaymentMethod ? PAYMENT_METHOD_LABELS[inv.lastPaymentMethod] : "—")}</div>
</div>
<table><thead><tr>
  <th>Description</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Total</th>
</tr></thead><tbody>
${inv.lineItems
  .map(
    (l) => `<tr><td>${escapeHtml(l.description)}</td><td class="num">${l.quantity}</td>
      <td class="num">${fmt(l.rate)}</td><td class="num">${fmt(l.amount)}</td></tr>`,
  )
  .join("")}
</tbody></table>
<div class="totals">
  <div><span>Total:</span><b>${fmt(inv.totals.total)}</b></div>
  <div><span>Amount paid:</span><span>${fmt(inv.totals.amountPaid)}</span></div>
  <div><span>Balance due:</span><b>${fmt(inv.totals.balanceDue)}</b></div>
</div>
${inv.notes ? `<p class="muted" style="margin-top:24px"><b>Notes</b><br>${escapeHtml(inv.notes)}</p>` : ""}
</body></html>`;
