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
  | "draft"
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

/** A lead during intake, a client after conversion. */
export type InvoiceParty = {
  type: "client" | "lead";
  id: string;
  name: string;
  email: string | null;
};

export type InvoiceListRow = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  /**
    * Who the invoice bills. A CLIENT after conversion, a LEAD during intake —
    * consultation fees and fee agreements are charged before a client record
    * exists. Never assume `type === "client"`.
    */
  party: InvoiceParty;
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
  /** Null when the invoice is due in a single payment. */
  schedule: {
    count: number;
    paidCount: number;
    nextDueDate: string | null;
  } | null;
};

export type InvoiceListTotals = {
  operating: number;
  trust: number | null;
  total: number;
  /** Rows on screen that the totals deliberately exclude. */
  draftCount: number;
};

export type GetInvoicesParams = {
  status?: InvoiceStatusFilter;
  account?: AccountFilter;
  search?: string;
  clientId?: string;
  caseId?: string;
  /** Show drafts alongside the rest. Only honoured when status is "all". */
  includeDrafts?: boolean;
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
  /**
   * Which catalog preset composed this line. Provenance only — the billed
   * figures are the three fields above, and nothing re-reads the preset to
   * fill them in. A preset that has since been retired leaves this null and
   * changes nothing else.
   */
  presetId: string | null;
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

/**
 * One dated slice of the invoice total.
 *
 * `amountPaid`, `outstanding` and `state` are all derived SERVER-side by
 * applying the invoice's total paid down the schedule, oldest first. Never
 * recompute them here: `state` depends on the firm's today, and a browser-side
 * comparison would disagree either side of midnight.
 */
export type InvoiceInstalment = {
  id: string;
  sequence: number;
  dueDate: string;
  amount: number;
  amountPaid: number;
  outstanding: number;
  state: "paid" | "partial" | "due" | "overdue";
};

/** What the schedule editor submits. `sequence` is assigned by the server. */
export type InstalmentInput = { dueDate: string; amount: number };

export type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
  status: EffectiveInvoiceStatus;
  storedStatus: string;
  issueDate: string;
  dueDate: string;
  notes: string | null;
  filingType: string | null;
  matter: { id: string; reference: string | null; type: string | null } | null;
  party: InvoiceParty;
  /** Null on an invoice billed to a lead. Prefer `party`. */
  client: { id: string; name: string; email: string | null } | null;
  practiceArea: string | null;
  /** Ids as well as labels, so the edit dialog can prefill its selects. */
  practiceAreaId: string | null;
  attorneyId: string | null;
  attorney: string | null;
  lineItems: InvoiceLineItem[];
  payments: InvoicePayment[];
  /** Empty when the invoice is due in a single payment. */
  instalments: InvoiceInstalment[];
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
  /** Server-side default is draft; delivery is what makes an invoice sent. */
  status?: "draft";
  lineItems: {
    description: string;
    quantity: number;
    rate: number;
    account: "operating" | "trust_iolta";
    /** Provenance for a line composed from the catalog. Optional. */
    presetId?: string;
  }[];
  timeEntryIds: string[];
  /** Optional payment schedule; must sum to the resulting invoice total. */
  instalments?: InstalmentInput[];
};

/**
 * Editing an invoice.
 *
 * The header half applies to any live invoice; sending any of the content half
 * is refused by the server on anything but a draft. `lineItems` REPLACES the
 * whole set, so `timeEntryIds` must go with it — the server rejects one without
 * the other rather than silently dropping the missing half.
 */
export type UpdateInvoiceInput = {
  dueDate?: string;
  notes?: string;
  /** `null` unassigns; omitting the key leaves it alone. */
  attorneyId?: string | null;
  filingType?: string;
  issueDate?: string;
  caseId?: string | null;
  practiceAreaId?: string | null;
  lineItems?: {
    description: string;
    quantity: number;
    rate: number;
    account: "operating" | "trust_iolta";
    /** Provenance for a line composed from the catalog. Optional. */
    presetId?: string;
  }[];
  timeEntryIds?: string[];
  /**
   * Replaces the whole schedule, and must sum to the invoice total.
   *
   * The one content field the server accepts on a *sent* invoice — plans get
   * renegotiated. It must accompany any line change on an invoice that already
   * has a schedule, since a line change moves the total the rows have to match.
   */
  instalments?: InstalmentInput[];
};

/**
 * Who to bill a matter under. A case belongs to a team, not a person, so the
 * server resolves it — `source` says which rule fired so the dialog can explain
 * a prefill instead of just asserting one.
 */
export type CaseDefaults = {
  caseId: string;
  attorneyId: string | null;
  attorneyName: string | null;
  source: "team_lead" | "sole_attorney" | null;
  attorneyCount: number;
  /** The matter's scope, used to narrow the line preset catalog. */
  practiceAreaId: string | null;
  caseTypeId: string | null;
};

/**
 * An entry in the catalog invoice lines are composed from.
 *
 * `rank` is how the server matched it — case-type presets first, then the
 * practice area's, then the general ones any matter attracts. The picker groups
 * on it directly rather than recomputing the rule.
 */
export type LinePreset = {
  id: string;
  name: string;
  note: string | null;
  account: "operating" | "trust_iolta";
  defaultRate: number;
  rank: "case_type" | "practice_area" | "general";
  /** `firm` is this firm's own entry; `shipped` came with the product. */
  origin: "firm" | "shipped";
};

export type SaveLinePresetInput = {
  name: string;
  note?: string;
  account: "operating" | "trust_iolta";
  defaultRate: number;
  practiceAreaId?: string;
  caseTypeId?: string;
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
    // Omit rather than send "false" — a present flag reads as opt-in.
    if (value === false) continue;
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

export async function getCaseDefaults(caseId: string): Promise<CaseDefaults> {
  const { data } = await API.get<{ data: CaseDefaults }>(
    "/finance/invoices/case-defaults",
    { params: { caseId } },
  );
  return data.data;
}

/**
 * The catalog for a given matter and account.
 *
 * Both scope ids are optional: an invoice with no matter still gets the general
 * tier. Trust presets are omitted server-side for callers who cannot write
 * trust lines, so an empty result for `trust_iolta` means "not permitted", not
 * "none exist".
 */
export async function getLinePresets(
  params: {
    practiceAreaId?: string;
    caseTypeId?: string;
    account?: "operating" | "trust_iolta";
  } = {},
): Promise<{ presets: LinePreset[]; restrictions: FinanceRestrictions }> {
  const { data: res } = await API.get("/finance/invoices/line-presets", {
    params: toQuery(params),
  });
  // `restrictions` rides along so the picker can hide the Trust step because
  // the caller lacks access, rather than inferring it from an empty list — an
  // empty list also means "this firm has no trust presets yet", which is a
  // different thing and must not hide the option.
  return { presets: res.data, restrictions: res.restrictions };
}

/** Save a custom line to the firm's list. Re-saving a name updates its amount. */
export async function saveLinePreset(
  input: SaveLinePresetInput,
): Promise<LinePreset> {
  const { data } = await API.post<{ data: LinePreset }>(
    "/finance/invoices/line-presets",
    input,
  );
  return data.data;
}

export async function getUnbilledTime(
  params: {
    clientId?: string;
    caseId?: string;
    /** Also return the entries this draft already holds, so an edit can keep them. */
    forInvoiceId?: string;
  } = {},
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

export async function updateInvoice(
  invoiceId: string,
  input: UpdateInvoiceInput,
): Promise<InvoiceDetail> {
  const { data } = await API.patch<{ data: InvoiceDetail }>(
    `/finance/invoices/${invoiceId}`,
    input,
  );
  return data.data;
}

/**
 * Saving a schedule on an invoice the client already holds emails them the new
 * dates. `notification` reports what happened to that email: `null` when there
 * was nobody to tell (a draft, or a client with no address on file). The
 * schedule is saved regardless — a failed send does not retract it.
 */
export type SetScheduleResult = InvoiceDetail & {
  notification: {
    status: "sent" | "failed";
    recipientEmail: string;
    failureReason: string | null;
  } | null;
};

export async function setInvoiceSchedule(
  invoiceId: string,
  instalments: InstalmentInput[],
): Promise<SetScheduleResult> {
  const { data } = await API.put<{ data: SetScheduleResult }>(
    `/finance/invoices/${invoiceId}/schedule`,
    { instalments },
  );
  return data.data;
}

export async function removeInvoiceSchedule(
  invoiceId: string,
): Promise<InvoiceDetail> {
  const { data } = await API.delete<{ data: InvoiceDetail }>(
    `/finance/invoices/${invoiceId}/schedule`,
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

export type DeliveryStatus = "pending" | "sent" | "failed";

export type InvoiceDelivery = {
  id: string;
  /**
   * `invoice` is the bill itself; `schedule_update` is a payment plan being set
   * or revised on an invoice the client already holds. Only the former is
   * evidence they were ever billed.
   */
  kind: "invoice" | "schedule_update";
  channel: "email";
  recipientEmail: string;
  status: DeliveryStatus;
  failureReason: string | null;
  attemptCount: number;
  createdAt: string;
  deliveredAt: string | null;
  sentBy: string | null;
};

export type SendResult = {
  deliveryId: string;
  /** A failed send is a successful request — check this, not the HTTP status. */
  status: "sent" | "failed";
  recipientEmail: string;
  failureReason: string | null;
  attemptCount: number;
};

export async function sendInvoice(invoiceId: string): Promise<SendResult> {
  const { data } = await API.post<{ data: SendResult }>(
    `/finance/invoices/${invoiceId}/send`,
  );
  return data.data;
}

export async function resendInvoice(invoiceId: string): Promise<SendResult> {
  const { data } = await API.post<{ data: SendResult }>(
    `/finance/invoices/${invoiceId}/resend`,
  );
  return data.data;
}

export async function getInvoiceDeliveries(
  invoiceId: string,
): Promise<InvoiceDelivery[]> {
  const { data } = await API.get<{ data: InvoiceDelivery[] }>(
    `/finance/invoices/${invoiceId}/deliveries`,
  );
  return data.data;
}

/**
 * The PDF comes from the server — the same bytes that are emailed to the client
 * and archived. Rendering a second copy in the browser would drift from the
 * archived one, so there is deliberately no client-side invoice renderer.
 */
export async function downloadInvoicePdf(
  invoiceId: string,
  invoiceNumber: string,
): Promise<void> {
  const res = await API.get(`/finance/invoices/${invoiceId}/pdf`, {
    responseType: "blob",
  });
  downloadBlob(res.data, `${invoiceNumber}.pdf`);
}

/**
 * The PDF as a blob, for previewing before a send.
 *
 * Same endpoint as the download and the same bytes that get attached to the
 * email — a preview rendered any other way would be a mock-up of the document
 * rather than the document, which is precisely what a confirmation step must
 * not show.
 */
export async function fetchInvoicePdfBlob(invoiceId: string): Promise<Blob> {
  const res = await API.get(`/finance/invoices/${invoiceId}/pdf`, {
    responseType: "blob",
  });
  return res.data as Blob;
}
