import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  approveTimeEntry,
  createInvoice,
  getBillingRates,
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
  getUnbilledTime,
  logTime,
  recordPayment,
  rejectTimeEntry,
  sendFollowUp,
  setBillingRate,
  voidInvoice,
  type GetInvoicesParams,
  type GetTimeEntriesParams,
  type RecordPaymentInput,
  type SendFollowUpInput,
} from "@/api/finance";
import type { APIError } from "./types";

const THIRTY_SECONDS = 30_000;

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
      ...(params?.page ? [`p${params.page}`] : []),
      ...(params?.limit ? [`l${params.limit}`] : []),
    ] as const,
  invoice: (id: string) => ["finance", "invoice", id] as const,
  stats: () => ["finance", "stats"] as const,
  aging: () => ["finance", "aging"] as const,
  activity: () => ["finance", "activity"] as const,
  unbilledTime: (clientId?: string, caseId?: string) =>
    ["finance", "unbilled-time", clientId ?? "", caseId ?? ""] as const,
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
    staleTime: THIRTY_SECONDS,
  });
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: financeKeys.stats(),
    queryFn: getInvoiceStats,
    staleTime: THIRTY_SECONDS,
  });
}

export function useInvoiceAging() {
  return useQuery({
    queryKey: financeKeys.aging(),
    queryFn: getInvoiceAging,
    staleTime: THIRTY_SECONDS,
  });
}

export function useFinanceActivity(limit = 8) {
  return useQuery({
    queryKey: financeKeys.activity(),
    queryFn: () => getFinanceActivity(limit),
    staleTime: THIRTY_SECONDS,
  });
}

export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: financeKeys.invoice(id ?? ""),
    queryFn: () => getInvoiceById(id!),
    enabled: Boolean(id),
    staleTime: THIRTY_SECONDS,
  });
}

export function useUnbilledTime(
  clientId?: string,
  caseId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: financeKeys.unbilledTime(clientId, caseId),
    queryFn: () => getUnbilledTime({ clientId, caseId }),
    enabled: enabled && Boolean(clientId || caseId),
    staleTime: THIRTY_SECONDS,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createInvoice,
    onSuccess: (invoice) => {
      toast.success(`Invoice ${invoice.invoiceNumber} created`);
      qc.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (err: APIError) =>
      toast.error(
        err.response?.data?.message ?? "Couldn't create that invoice",
      ),
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
    staleTime: THIRTY_SECONDS,
  });
}

export function useTimeBillingStats(params: { from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: financeKeys.timeStats(),
    queryFn: () => getTimeBillingStats(params),
    staleTime: THIRTY_SECONDS,
  });
}

export function useEarningsByStaff(params: { from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: financeKeys.earningsByStaff(),
    queryFn: () => getEarningsByStaff(params),
    staleTime: THIRTY_SECONDS,
  });
}

export function useTopMatters(params: { from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: financeKeys.topMatters(),
    queryFn: () => getTopMatters(params),
    staleTime: THIRTY_SECONDS,
  });
}

export function useBillingRates() {
  return useQuery({
    queryKey: financeKeys.billingRates(),
    queryFn: getBillingRates,
    staleTime: THIRTY_SECONDS,
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
    staleTime: THIRTY_SECONDS,
  });
}
