import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getConvertedClients,
  getConvertedClientDetail,
  sendClientPortalInvite,
  updateClientPortalStatus,
  getClientPortalSessions,
  revokeClientSession,
  getClientPortalStatus,
  type GetConvertedClientsParams,
} from "@/api/converted-clients";
import type { APIError } from "./types";

// ─── Queries ────────────────────────────────────────────────────────────────

export function useConvertedClients(params: GetConvertedClientsParams = {}) {
  return useQuery({
    queryKey: ["clients", params],
    queryFn: () => getConvertedClients(params),
  });
}

export function useConvertedClientDetail(id: string | null) {
  return useQuery({
    queryKey: ["client", id],
    queryFn: () => getConvertedClientDetail(id!),
    enabled: !!id,
  });
}

export function useClientPortalSessions(id: string | null) {
  return useQuery({
    queryKey: ["clientPortalSessions", id],
    queryFn: () => getClientPortalSessions(id!),
    enabled: !!id,
  });
}

export function useClientPortalStatus(id: string | null) {
  return useQuery({
    queryKey: ["clientPortalStatus", id],
    queryFn: () => getClientPortalStatus(id!),
    enabled: !!id,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function useSendClientPortalInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) => sendClientPortalInvite(clientId),
    onSuccess: () => {
      toast.success("Portal invitation sent successfully");
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["client"] });
      qc.invalidateQueries({ queryKey: ["clientPortalStatus"] });
    },
    onError: (err: APIError) => {
      toast.error(
        err?.response?.data?.message || "Failed to send invitation",
      );
    },
  });
}

export function useRevokeClientSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      token,
    }: {
      clientId: string;
      token: string;
    }) => revokeClientSession(clientId, token),
    onSuccess: () => {
      toast.success("Session revoked");
      qc.invalidateQueries({ queryKey: ["clientPortalSessions"] });
      qc.invalidateQueries({ queryKey: ["clientPortalStatus"] });
    },
    onError: (err: APIError) => {
      toast.error(
        err?.response?.data?.message || "Failed to revoke session",
      );
    },
  });
}

export function useUpdateClientPortalStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      status,
    }: {
      clientId: string;
      status: "none" | "pending" | "active" | "disabled";
    }) => updateClientPortalStatus(clientId, status),
    onSuccess: () => {
      toast.success("Portal status updated");
      qc.invalidateQueries({ queryKey: ["clientPortalStatus"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (err: APIError) => {
      toast.error(
        err?.response?.data?.message || "Failed to update portal status",
      );
    },
  });
}
