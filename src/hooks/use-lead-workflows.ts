import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createLeadNote,
  deleteLeadNote,
  getLeadAuditLog,
  getLeadDocuments,
  getLeadNotes,
  getLeadQuestionnaireFiles,
  getLeadTimeline,
  initializePipeline,
  linkLeadDocument,
  toggleLeadNotePin,
  unlinkLeadDocument,
  updateLeadNote,
} from "@/api/lead-workflows";
import type { CreateLeadNoteParams, LeadNoteType, LeadNoteVisibility } from "@/api/lead-workflows";
import { taskKeys } from "./use-tasks";
import type { APIError } from "./types";

/**
 * Lead-side queries and mutations that genuinely need a lead.
 *
 * Anything done *to a task* — read one lead's board, assign, complete, submit,
 * approve, reject, reopen — is in `@/hooks/use-tasks`, against `/tasks`. What is
 * left here needs the lead itself: the two cross-lead list views that join it,
 * stamping a new lead's pipeline, its notes, and its documents.
 */

export function useInitializePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) => initializePipeline(leadId),
    onSuccess: (_data, leadId) => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      qc.invalidateQueries({ queryKey: ["leadTimeline", leadId] });
      qc.invalidateQueries({ queryKey: ["leadAuditLog", leadId] });
      toast.success("Pipeline steps initialized");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to initialize pipeline");
    },
  });
}

export function useLeadTimeline(leadId: string, enabled = true, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["leadTimeline", leadId, page, limit],
    queryFn: () => getLeadTimeline(leadId, page, limit),
    enabled: Boolean(leadId) && enabled,
  });
}

export function useLeadAuditLog(leadId: string, enabled = true, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["leadAuditLog", leadId, page, limit],
    queryFn: () => getLeadAuditLog(leadId, page, limit),
    enabled: Boolean(leadId) && enabled,
  });
}

// ─── Lead Notes ──────────────────────────────────────────────────────────────

export function useLeadNotes(leadId: string, opts?: { context?: string; authorId?: string; pinnedOnly?: boolean; page?: number; limit?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: ["leadNotes", leadId, opts?.context ?? "all", opts?.authorId ?? "all", opts?.pinnedOnly ?? false, opts?.page ?? 1, opts?.limit ?? 50],
    queryFn: () => getLeadNotes(leadId, { context: opts?.context, authorId: opts?.authorId, pinnedOnly: opts?.pinnedOnly, page: opts?.page, limit: opts?.limit }),
    enabled: Boolean(leadId) && (opts?.enabled ?? true),
  });
}

export function useCreateLeadNote(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateLeadNoteParams) => createLeadNote(leadId, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadNotes", leadId] });
      qc.invalidateQueries({ queryKey: ["leadTimeline", leadId] });
      qc.invalidateQueries({ queryKey: ["leadAuditLog", leadId] });
      toast.success("Note added");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to add note");
    },
  });
}

export function useUpdateLeadNote(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, ...params }: { noteId: string } & { content?: string; type?: LeadNoteType; visibility?: LeadNoteVisibility; isPinned?: boolean }) =>
      updateLeadNote(leadId, noteId, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadNotes", leadId] });
      qc.invalidateQueries({ queryKey: ["leadTimeline", leadId] });
      qc.invalidateQueries({ queryKey: ["leadAuditLog", leadId] });
      toast.success("Note updated");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to update note");
    },
  });
}

export function useDeleteLeadNote(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => deleteLeadNote(leadId, noteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadNotes", leadId] });
      qc.invalidateQueries({ queryKey: ["leadTimeline", leadId] });
      qc.invalidateQueries({ queryKey: ["leadAuditLog", leadId] });
      toast.success("Note deleted");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to delete note");
    },
  });
}

// ─── Lead Documents ──────────────────────────────────────────────────────────

export function useLeadDocuments(leadId: string) {
  return useQuery({
    queryKey: ["leadDocuments", leadId],
    queryFn: () => getLeadDocuments(leadId),
    enabled: Boolean(leadId),
  });
}

export function useLinkLeadDocument(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => linkLeadDocument(leadId, documentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadDocuments", leadId] });
      qc.invalidateQueries({ queryKey: ["leadTimeline", leadId] });
      qc.invalidateQueries({ queryKey: ["leadAuditLog", leadId] });
      toast.success("Document linked");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to link document");
    },
  });
}

export function useUnlinkLeadDocument(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (linkId: string) => unlinkLeadDocument(leadId, linkId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadDocuments", leadId] });
      qc.invalidateQueries({ queryKey: ["leadTimeline", leadId] });
      qc.invalidateQueries({ queryKey: ["leadAuditLog", leadId] });
      toast.success("Document unlinked");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to unlink document");
    },
  });
}

// ─── Lead Questionnaire Files ────────────────────────────────────────────────

export function useLeadQuestionnaireFiles(leadId: string) {
  return useQuery({
    queryKey: ["leadQuestionnaireFiles", leadId],
    queryFn: () => getLeadQuestionnaireFiles(leadId),
    enabled: Boolean(leadId),
  });
}

export function useToggleNotePin(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => toggleLeadNotePin(leadId, noteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadNotes", leadId] });
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to toggle pin");
    },
  });
}
