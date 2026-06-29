import {
  createConsultationLocation,
  deleteConsultationLocation,
  getConsultationLocations,
  getConsultationSettings,
  updateConsultationLocation,
  updateConsultationSettings,
} from "@/api/consultation-settings";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { APIError } from "./types";

export function useConsultationSettings() {
  return useQuery({
    queryKey: ["consultationSettings"],
    queryFn: getConsultationSettings,
  });
}

export function useUpdateConsultationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateConsultationSettings,
    onSuccess: () => {
      toast.success("Consultation settings saved");
      qc.invalidateQueries({ queryKey: ["consultationSettings"] });
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Failed to save consultation settings",
      );
    },
  });
}

export function useConsultationLocations() {
  return useQuery({
    queryKey: ["consultationLocations"],
    queryFn: getConsultationLocations,
  });
}

export function useCreateConsultationLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createConsultationLocation,
    onSuccess: () => {
      toast.success("Location added");
      qc.invalidateQueries({ queryKey: ["consultationLocations"] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to add location");
    },
  });
}

export function useUpdateConsultationLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof updateConsultationLocation>[1];
    }) => updateConsultationLocation(id, input),
    onSuccess: () => {
      toast.success("Location updated");
      qc.invalidateQueries({ queryKey: ["consultationLocations"] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to update location");
    },
  });
}

export function useDeleteConsultationLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteConsultationLocation,
    onSuccess: () => {
      toast.success("Location deleted");
      qc.invalidateQueries({ queryKey: ["consultationLocations"] });
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to delete location");
    },
  });
}
