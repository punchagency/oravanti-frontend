import {
  cancelDocumentRequest,
  createDocumentRequest,
  getDocumentRequests,
  reissueDocumentRequest,
  uploadCaseDocument,
  type DocumentRequestStatus,
} from "@/api/documents";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { APIError } from "./types";
import { workflowKeys } from "./use-workflows";

export const documentKeys = {
  all: ["documents"] as const,
  requests: (filters: object) => ["documents", "requests", filters] as const,
};

type RequestFilters = {
  caseId?: string;
  leadId?: string;
  status?: DocumentRequestStatus;
};

export function useDocumentRequests(
  filters: RequestFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: documentKeys.requests(filters),
    queryFn: () => getDocumentRequests(filters),
    enabled,
  });
}

export function useUploadCaseDocument(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof uploadCaseDocument>[0]) =>
      uploadCaseDocument(data),
    onSuccess: () => {
      toast.success("Document uploaded");
      qc.invalidateQueries({ queryKey: workflowKeys.documents(caseId) });
      // An upload re-runs the matter's AI review, so its findings may change.
      qc.invalidateQueries({ queryKey: ["case-review"] });
    },
    onError: (err: APIError) =>
      toast.error(err.response?.data?.message ?? "Couldn't upload that file"),
  });
}

/**
 * Neither send toasts on success: both hand back a one-time upload link, and
 * the dialog that shows it already reports whether the email got through. A
 * toast on top would say the same thing twice.
 */
export function useCreateDocumentRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDocumentRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.all }),
    onError: (err: APIError) =>
      toast.error(err.response?.data?.message ?? "Couldn't send that request"),
  });
}

/**
 * Resend an open request. Rotation moves the expiry too, so the list has to be
 * refetched even when the reminder itself fails to send.
 */
export function useReissueDocumentRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => reissueDocumentRequest(requestId),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.all }),
    onError: (err: APIError) =>
      toast.error(
        err.response?.data?.message ?? "Couldn't resend that request",
      ),
  });
}

export function useCancelDocumentRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelDocumentRequest,
    onSuccess: () => {
      toast.success("Request cancelled");
      qc.invalidateQueries({ queryKey: documentKeys.all });
    },
    onError: (err: APIError) =>
      toast.error(
        err.response?.data?.message ?? "Couldn't cancel that request",
      ),
  });
}
