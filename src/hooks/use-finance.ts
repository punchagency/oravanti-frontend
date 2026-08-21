import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  approveTimeEntry,
  createInvoice,
  extendInvoiceDueDate,
  getBillingRates,
  getCaseDefaults,
  getEarningsByStaff,
  getFinanceActivity,
  getFinanceReport,
  getInvoiceAging,
  getInvoiceById,
  getInvoiceStats,
  getInvoices,
  getTimeBillingStats,
  getTimeEntries,
  getTopMatters,
  getInvoiceDeliveries,
  getLinePresets,
  getUnbilledTime,
  logTime,
  recordPayment,
  rejectTimeEntry,
  removeInvoiceSchedule,
  resendInvoice,
  saveLinePreset,
  sendFollowUp,
  sendInvoice,
  setBillingRate,
  setInvoiceSchedule,
  updateInvoice,
  voidInvoice,
  type GetInvoicesParams,
  type GetTimeEntriesParams,
  type InstalmentInput,
  type RecordPaymentInput,
  type SaveLinePresetInput,
  type SendFollowUpInput,
  type UpdateInvoiceInput,
} from "@/api/finance";
import type { APIError } from "./types";


/**
 * Money changes together. Recording a payment moves the tiles, the list, the
 * aging buckets and the activity feed at once, so mutations invalidate the
 * whole `finance` prefix rather than trying to be surgical — a stale tile next
 * to a fresh row is worse than one extra fetch.
 */
export const financeKeys = {
  all: ["finance"] as const,
  invoices: (params?: GetInvoicesParams) =>
    [
      "finance",
      "invoices",
      params?.status ?? "",
      params?.account ?? "",
      params?.search ?? "",
      params?.includeDrafts ? "drafts" : "",
      ...(params?.page ? [`p${params.page}`] : []),
      ...(params?.limit ? [`l${params.limit}`] : []),
    ] as const,
  invoice: (id: string) => ["finance", "invoice", id] as const,
  deliveries: (id: string) => ["finance", "deliveries", id] as const,
  stats: () => ["finance", "stats"] as const,
  aging: () => ["finance", "aging"] as const,
  activity: () => ["finance", "activity"] as const,
  unbilledTime: (clientId?: string, caseId?: string, forInvoiceId?: string) =>
    [
      "finance",
      "unbilled-time",
      clientId ?? "",
      caseId ?? "",
      forInvoiceId ?? "",
    ] as const,
  caseDefaults: (caseId: string) => ["finance", "case-defaults", caseId] as const,
  linePresets: (
    practiceAreaId?: string,
    caseTypeId?: string,
    account?: string,
  ) =>
    [
      "finance",
      "line-presets",
      practiceAreaId ?? "",
      caseTypeId ?? "",
      account ?? "",
    ] as const,
  timeEntries: (params?: GetTimeEntriesParams) =>
    [
      "finance",
      "time-entries",
      params?.status ?? "",
      params?.staffId ?? "",
      ...(params?.page ? [`p${params.page}`] : []),
      ...(params?.limit ? [`l${params.limit}`] : []),
    ] as const,
  timeStats: () => ["finance", "time-stats"] as const,
  earningsByStaff: () => ["finance", "earnings-by-staff"] as const,
  topMatters: () => ["finance", "top-matters"] as const,
  billingRates: () => ["finance", "billing-rates"] as const,
  report: (month?: string) => ["finance", "report", month ?? "current"] as const,
};

// ─── Invoicing ───────────────────────────────────────────────────────────────

export function useInvoices(params: GetInvoicesParams = {}) {
  return useQuery({
    queryKey: financeKeys.invoices(params),
    queryFn: () => getInvoices(params),
  });
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: financeKeys.stats(),
    queryFn: getInvoiceStats,
  });
}

export function useInvoiceAging() {
  return useQuery({
    queryKey: financeKeys.aging(),
    queryFn: getInvoiceAging,
  });
}

export function useFinanceActivity(limit = 8) {
  return useQuery({
    queryKey: financeKeys.activity(),
    queryFn: () => getFinanceActivity(limit),
  });
}

export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: financeKeys.invoice(id ?? ""),
    queryFn: () => getInvoiceById(id!),
    enabled: Boolean(id),
  });
}

export function useUnbilledTime(
  clientId?: string,
  caseId?: string,
  enabled = true,
  /** Editing a draft: also offer back the entries it already holds. */
  forInvoiceId?: string,
) {
  return useQuery({
    queryKey: financeKeys.unbilledTime(clientId, caseId, forInvoiceId),
    queryFn: () => getUnbilledTime({ clientId, caseId, forInvoiceId }),
    enabled: enabled && Boolean(clientId || caseId),
  });
}

/**
 * The attorney to bill a matter under. Resolved server-side because a case is
 * assigned to a team, not a person, and the team's lead lives outside anything
 * the case list returns.
 */
export function useCaseDefaults(caseId: string | null | undefined) {
  return useQuery({
    queryKey: financeKeys.caseDefaults(caseId ?? ""),
    queryFn: () => getCaseDefaults(caseId!),
    enabled: Boolean(caseId),
  });
}

/**
 * The catalog the line picker offers.
 *
 * Keyed on the scope AND the account, because the server narrows on both — a
 * single cached list would show family-law fees on an immigration invoice the
 * moment the matter changed.
 */
export function useLinePresets(
  params: {
    practiceAreaId?: string;
    caseTypeId?: string;
    account?: "operating" | "trust_iolta";
  },
  enabled = true,
) {
  return useQuery({
    queryKey: financeKeys.linePresets(
      params.practiceAreaId,
      params.caseTypeId,
      params.account,
    ),
    queryFn: () => getLinePresets(params),
    enabled,
  });
}

/**
 * Save a custom line to the firm's list.
 *
 * Saving is an EXTRA, never a precondition for adding the line — the dialog
 * appends it either way. So a failure here is a toast, not a blocked submit.
 */
export function useSaveLinePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveLinePresetInput) => saveLinePreset(input),
    onSuccess: (preset) => {
      toast.success(`Saved "${preset.name}" to your firm's list`);
      qc.invalidateQueries({ queryKey: ["finance", "line-presets"] });
    },
    onError: (err: APIError) =>
      toast.error(
        err.response?.data?.message ?? "Couldn't save that to your list",
      ),
  });
}

export function useInvoiceDeliveries(id: string | null) {
  return useQuery({
    queryKey: financeKeys.deliveries(id ?? ""),
    queryFn: () => getInvoiceDeliveries(id!),
    enabled: Boolean(id),
  });
}

/**
 * A failed send resolves rather than throws — the attempt was recorded and the
 * caller needs the reason. Only an unusable request (voided invoice, client
 * with no email) lands in onError.
 */
const deliveryToast = (result: { status: string; failureReason: string | null }) => {
  if (result.status === "sent") {
    toast.success("Invoice sent to the client");
  } else {
    toast.error(
      result.failureReason
        ? `Delivery failed: ${result.failureReason}`
        : "Delivery failed — the attempt was recorded",
    );
  }
};

export function useSendInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendInvoice,
    onSuccess: (result) => {
      deliveryToast(result);
      qc.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (err: APIError) =>
      toast.error(err.response?.data?.message ?? "Couldn't send that invoice"),
  });
}

export function useResendInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resendInvoice,
    onSuccess: (result) => {
      deliveryToast(result);
      qc.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (err: APIError) =>
      toast.error(err.response?.data?.message ?? "Couldn't resend that invoice"),
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createInvoice,
    onSuccess: (invoice) => {
      toast.success(`Invoice ${invoice.invoiceNumber} created as a draft`);
      qc.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (err: APIError) =>
      toast.error(
        err.response?.data?.message ?? "Couldn't create that invoice",
      ),
  });
}

/**
 * Edit an invoice. The server refuses anything but header fields on a
 * non-draft, so the error path here is a real message, not a generic failure.
 */
export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      input,
    }: {
      invoiceId: string;
      input: UpdateInvoiceInput;
    }) => updateInvoice(invoiceId, input),
    onSuccess: (invoice) => {
      toast.success(`Invoice ${invoice.invoiceNumber} updated`);
      qc.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (err: APIError) =>
      toast.error(err.response?.data?.message ?? "Couldn't save those changes"),
  });
}

/**
 * Set or revise a payment schedule.
 *
 * The server refuses a schedule that does not sum to the invoice total, so the
 * error path here carries a real message naming both figures.
 */
export function useSetInvoiceSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      instalments,
    }: {
      invoiceId: string;
      instalments: InstalmentInput[];
    }) => setInvoiceSchedule(invoiceId, instalments),
    onSuccess: (invoice) => {
      // The schedule is saved whatever happened to the email, so a failed
      // notification is a warning rather than an error — but it must not read
      // as success, or the firm will think the client knows about dates they
      // have never seen.
      if (invoice.notification?.status === "failed") {
        toast.warning(
          `Schedule saved, but ${invoice.invoiceNumber} could not be emailed to the client`,
        );
      } else if (invoice.notification?.status === "sent") {
        toast.success(
          `Schedule saved and sent to ${invoice.notification.recipientEmail}`,
        );
      } else {
        toast.success(`Payment schedule saved for ${invoice.invoiceNumber}`);
      }
      qc.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (err: APIError) =>
      toast.error(err.response?.data?.message ?? "Couldn't save that schedule"),
  });
}

export function useRemoveInvoiceSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeInvoiceSchedule,
    onSuccess: (invoice) => {
      toast.success(`${invoice.invoiceNumber} is now due in one payment`);
      qc.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (err: APIError) =>
      toast.error(err.response?.data?.message ?? "Couldn't remove that schedule"),
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      input,
    }: {
      invoiceId: string;
      input: RecordPaymentInput;
    }) => recordPayment(invoiceId, input),
    onSuccess: (invoice) => {
      toast.success(
        invoice.status === "paid"
          ? `${invoice.invoiceNumber} is now fully paid`
          : `Payment recorded against ${invoice.invoiceNumber}`,
      );
      qc.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (err: APIError) =>
      toast.error(err.response?.data?.message ?? "Couldn't record that payment"),
  });
}

export function useSendFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      input,
    }: {
      invoiceId: string;
      input: SendFollowUpInput;
    }) => sendFollowUp(invoiceId, input),
    onSuccess: (result) => {
      // Reported honestly: SMS has no provider wired, so it never claims a send.
      toast.success(
        result.emailDelivered
          ? "Follow-up sent"
          : "Follow-up recorded (email could not be delivered)",
      );
      qc.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (err: APIError) =>
      toast.error(err.response?.data?.message ?? "Couldn't send that follow-up"),
  });
}

export function useExtendDueDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      dueDate,
      reason,
    }: {
      invoiceId: string;
      dueDate: string;
      reason?: string;
    }) => extendInvoiceDueDate(invoiceId, { dueDate, reason }),
    onSuccess: (invoice) => {
      toast.success(`${invoice.invoiceNumber} is now due ${invoice.dueDate}`);
      qc.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (err: APIError) =>
      // The server's refusals name the specific reason — a draft, a settled
      // invoice, a schedule, a date that is not later. Passing them through
      // beats a generic failure the user cannot act on.
      toast.error(
        err.response?.data?.message ?? "Couldn't extend that due date",
      ),
  });
}

export function useVoidInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, reason }: { invoiceId: string; reason?: string }) =>
      voidInvoice(invoiceId, reason),
    onSuccess: (invoice) => {
      toast.success(`${invoice.invoiceNumber} voided`);
      qc.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (err: APIError) =>
      toast.error(err.response?.data?.message ?? "Couldn't void that invoice"),
  });
}

// ─── Time & billing ──────────────────────────────────────────────────────────

export function useTimeEntries(params: GetTimeEntriesParams = {}) {
  return useQuery({
    queryKey: financeKeys.timeEntries(params),
    queryFn: () => getTimeEntries(params),
  });
}

export function useTimeBillingStats(params: { from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: financeKeys.timeStats(),
    queryFn: () => getTimeBillingStats(params),
  });
}

export function useEarningsByStaff(params: { from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: financeKeys.earningsByStaff(),
    queryFn: () => getEarningsByStaff(params),
  });
}

export function useTopMatters(params: { from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: financeKeys.topMatters(),
    queryFn: () => getTopMatters(params),
  });
}

export function useBillingRates() {
  return useQuery({
    queryKey: financeKeys.billingRates(),
    queryFn: getBillingRates,
  });
}

export function useLogTime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: logTime,
    onSuccess: () => {
      toast.success("Time logged");
      qc.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (err: APIError) =>
      toast.error(err.response?.data?.message ?? "Couldn't log that time"),
  });
}

export function useApproveTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: approveTimeEntry,
    onSuccess: () => {
      toast.success("Time entry approved");
      qc.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (err: APIError) =>
      toast.error(err.response?.data?.message ?? "Couldn't approve that entry"),
  });
}

export function useRejectTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectTimeEntry(id, reason),
    onSuccess: () => {
      toast.success("Time entry rejected");
      qc.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (err: APIError) =>
      toast.error(err.response?.data?.message ?? "Couldn't reject that entry"),
  });
}

export function useSetBillingRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: setBillingRate,
    onSuccess: () => {
      toast.success("Billing rate saved");
      qc.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (err: APIError) =>
      toast.error(err.response?.data?.message ?? "Couldn't save that rate"),
  });
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export function useFinanceReport(month?: string) {
  return useQuery({
    queryKey: financeKeys.report(month),
    queryFn: () => getFinanceReport(month),
  });
}
