import {
  cancelDocumentRequest,
  createDocumentRequest,
  getDocumentRequests,
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
    staleTime: 30_000,
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

export function useCreateDocumentRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDocumentRequest,
    onSuccess: (request) => {
      toast[request.emailSent ? "success" : "warning"](
        request.emailSent
          ? `Request sent to ${request.recipientEmail}`
          : "Request created, but the email didn't send — copy the link instead",
      );
      qc.invalidateQueries({ queryKey: documentKeys.all });
    },
    onError: (err: APIError) =>
      toast.error(err.response?.data?.message ?? "Couldn't send that request"),
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
