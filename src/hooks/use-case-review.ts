import {
  exportIssues,
  exportResolutionLog,
  getCaseReviewConfig,
  getCaseReviewIssue,
  getCaseReviewIssues,
  getCaseReviewStats,
  getIssuesByCase,
  getIssuesByDocument,
  getResolutionLog,
  runFullScan,
  runIssueAction,
  updateCaseReviewConfig,
  updateIssueStatus,
  type CaseReviewConfig,
  type ExportFormat,
  type IssueFilters,
  type IssueStatusAction,
} from "@/api/case-review";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { APIError } from "./types";

// ─── Query keys ───────────────────────────────────────────────────────────────

const keys = {
  all: ["case-review"] as const,
  stats: ["case-review", "stats"] as const,
  issues: (f: IssueFilters) => ["case-review", "issues", f] as const,
  issue: (id: string) => ["case-review", "issue", id] as const,
  byCase: (p: object) => ["case-review", "by-case", p] as const,
  byDocument: (p: object) => ["case-review", "by-document", p] as const,
  resolutionLog: (p: object) => ["case-review", "resolution-log", p] as const,
  config: ["case-review", "config"] as const,
};

/** Anything that changes issue state should refresh every issue-derived view. */
const invalidateIssueViews = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: keys.all });
};

// ─── Queries ────────────────────────────────────────────────────────────────

export function useCaseReviewStats(enabled = true) {
  return useQuery({
    queryKey: keys.stats,
    queryFn: getCaseReviewStats,
    enabled,
  });
}

export function useCaseReviewIssues(filters: IssueFilters = {}, enabled = true) {
  return useQuery({
    queryKey: keys.issues(filters),
    queryFn: () => getCaseReviewIssues(filters),
    enabled,
  });
}

export function useCaseReviewIssue(id: string | null) {
  return useQuery({
    queryKey: keys.issue(id ?? ""),
    queryFn: () => getCaseReviewIssue(id as string),
    enabled: Boolean(id),
  });
}

export function useIssuesByCase(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: keys.byCase(params),
    queryFn: () => getIssuesByCase(params),
  });
}

export function useIssuesByDocument(
  params: { page?: number; limit?: number } = {},
) {
  return useQuery({
    queryKey: keys.byDocument(params),
    queryFn: () => getIssuesByDocument(params),
  });
}

export function useResolutionLog(
  params: { page?: number; limit?: number; days?: number } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: keys.resolutionLog(params),
    queryFn: () => getResolutionLog(params),
    enabled,
  });
}

export function useCaseReviewConfig(enabled = true) {
  return useQuery({
    queryKey: keys.config,
    queryFn: getCaseReviewConfig,
    enabled,
    // 403 for non-configure roles — fall back gracefully.
    retry: false,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function useUpdateIssueStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      note,
    }: {
      id: string;
      action: IssueStatusAction;
      note?: string;
    }) => updateIssueStatus(id, action, note),
    onSuccess: (_data, { action }) => {
      const verb =
        action === "resolve"
          ? "resolved"
          : action === "dismiss"
            ? "dismissed"
            : action === "reopen"
              ? "reopened"
              : "marked under review";
      toast.success(`Issue ${verb}`);
      invalidateIssueViews(qc);
    },
    onError: (err: APIError) =>
      toast.error(err.response?.data?.message ?? "Failed to update issue"),
  });
}

export function useRunIssueAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actionKey }: { id: string; actionKey: string }) =>
      runIssueAction(id, actionKey),
    onSuccess: (result) => {
      // Navigate actions carry no effect and toast nothing; routing is the
      // caller's job.
      if (result.kind === "mutation") {
        toast.success("Action performed");
        invalidateIssueViews(qc);
      }
    },
    onError: (err: APIError) =>
      toast.error(err.response?.data?.message ?? "Couldn't perform that action"),
  });
}

export function useRunFullScan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: runFullScan,
    onSuccess: () => {
      toast.success("Full scan started — results will appear as it runs");
      invalidateIssueViews(qc);
    },
    onError: (err: APIError) =>
      toast.error(err.response?.data?.message ?? "Failed to start scan"),
  });
}

export function useUpdateCaseReviewConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<CaseReviewConfig>) =>
      updateCaseReviewConfig(patch),
    onSuccess: (config) => {
      qc.setQueryData(keys.config, config);
      toast.success("Settings saved");
    },
    onError: (err: APIError) =>
      toast.error(err.response?.data?.message ?? "Failed to save settings"),
  });
}

export function useExportReport() {
  return useMutation({
    mutationFn: ({
      report,
      format,
    }: {
      report: "issues" | "resolution-log";
      format: ExportFormat;
    }) =>
      report === "issues"
        ? exportIssues(format)
        : exportResolutionLog(format),
    onError: (err: APIError) =>
      toast.error(err.response?.data?.message ?? "Export failed"),
  });
}
