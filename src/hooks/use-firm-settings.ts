import {
  deleteFirmAccount,
  exportFirmData,
  getFirmProfile,
  getFirmSnapshot,
  getNotificationSettings,
  setFirmSmsEnabled,
  updateFirmProfile,
  updateNotificationSettings,
  type FirmNotificationSettingsInput,
  type FirmProfileInput,
} from "@/api/firm-settings";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";
import type { APIError } from "./types";

export function useFirmProfile() {
  return useQuery({
    queryKey: ["firmProfile"],
    queryFn: getFirmProfile,
    staleTime: Infinity,
    retry: false,
  });
}

export function useUpdateFirmProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: FirmProfileInput) => updateFirmProfile(input),
    onSuccess: () => {
      toast.success("Firm profile saved");
      qc.invalidateQueries({ queryKey: ["firmProfile"] });
      qc.invalidateQueries({ queryKey: ["firmSnapshot"] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to save firm profile");
    },
  });
}

export function useFirmSnapshot() {
  return useQuery({
    queryKey: ["firmSnapshot"],
    queryFn: getFirmSnapshot,
    staleTime: Infinity,
    retry: false,
  });
}

export function useExportFirmData() {
  return useMutation({
    mutationFn: exportFirmData,
    onSuccess: (data) => {
      toast.success("Export ready — download starting");
      window.open(data.downloadUrl, "_blank");
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to export firm data");
    },
  });
}

export function useDeleteFirmAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFirmAccount,
    onSuccess: () => {
      toast.success("Firm account deleted");
      useAuthStore.getState().clearAuth();
      queryClient.clear();
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Failed to delete firm account",
      );
    },
  });
}

// ── Notification Settings ────────────────────────────────────────────────────

export function useNotificationSettings() {
  return useQuery({
    queryKey: ["notificationSettings"],
    queryFn: getNotificationSettings,
    staleTime: Infinity,
    retry: false,
  });
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: FirmNotificationSettingsInput) =>
      updateNotificationSettings(input),
    onSuccess: () => {
      toast.success("Notification preferences saved");
      qc.invalidateQueries({ queryKey: ["notificationSettings"] });
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ??
          "Failed to save notification preferences",
      );
    },
  });
}

export function useSetFirmSmsEnabled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) => setFirmSmsEnabled(enabled),
    onSuccess: ({ smsEnabled }) => {
      toast.success(
        smsEnabled
          ? "Text messaging enabled for your firm"
          : "Text messaging disabled for your firm",
      );
      qc.invalidateQueries({ queryKey: ["notificationSettings"] });
      // The consultation settings query holds the same column, so it would
      // otherwise serve a stale value to the channel pickers that read it.
      qc.invalidateQueries({ queryKey: ["consultationSettings"] });
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Failed to change text messaging",
      );
    },
  });
}
