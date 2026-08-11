import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getConvertedClients,
  getConvertedClientDetail,
  sendClientPortalInvite,
  resetClientPassword,
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
    staleTime: 5 * 60 * 1000,
  });
}

export function useConvertedClientDetail(id: string | null) {
  return useQuery({
    queryKey: ["client", id],
    queryFn: () => getConvertedClientDetail(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useClientPortalSessions(id: string | null) {
  return useQuery({
    queryKey: ["clientPortalSessions", id],
    queryFn: () => getClientPortalSessions(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useClientPortalStatus(id: string | null) {
  return useQuery({
    queryKey: ["clientPortalStatus", id],
    queryFn: () => getClientPortalStatus(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
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

export function useResetClientPassword() {
  return useMutation({
    mutationFn: (clientId: string) => resetClientPassword(clientId),
    onSuccess: () => {
      toast.success("Password reset email sent");
    },
    onError: (err: APIError) => {
      toast.error(
        err?.response?.data?.message || "Failed to send password reset",
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
