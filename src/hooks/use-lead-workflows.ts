import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  assignLeadTask,
  completeLeadTask,
  createLeadTask,
  deleteLeadTask,
  getLeadTasks,
  getLeadTimeline,
  initializePipeline,
  updateLeadTask,
  updateLeadTaskStatus,
} from "@/api/lead-workflows";
import type { LeadTaskInput, LeadTaskStatus } from "@/api/lead-workflows";
import type { APIError } from "./types";

export function useLeadTasks(leadId: string) {
  return useQuery({
    queryKey: ["leadTasks", leadId],
    queryFn: () => getLeadTasks(leadId),
    enabled: Boolean(leadId),
  });
}

export function useInitializePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) => initializePipeline(leadId),
    onSuccess: (_data, leadId) => {
      qc.invalidateQueries({ queryKey: ["leadTasks", leadId] });
      toast.success("Pipeline steps initialized");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to initialize pipeline");
    },
  });
}

export function useCreateLeadTask(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LeadTaskInput) => createLeadTask(leadId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadTasks", leadId] });
      toast.success("Task created");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to create task");
    },
  });
}

export function useUpdateLeadTask(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, ...input }: { taskId: string } & Record<string, unknown>) =>
      updateLeadTask(leadId, taskId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadTasks", leadId] });
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to update task");
    },
  });
}

export function useUpdateLeadTaskStatus(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: LeadTaskStatus }) =>
      updateLeadTaskStatus(leadId, taskId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadTasks", leadId] });
    },
  });
}

export function useAssignLeadTask(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, assignedToId }: { taskId: string; assignedToId: string }) =>
      assignLeadTask(leadId, taskId, assignedToId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadTasks", leadId] });
      toast.success("Task assigned");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to assign task");
    },
  });
}

export function useCompleteLeadTask(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => completeLeadTask(leadId, taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadTasks", leadId] });
      toast.success("Task completed");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to complete task");
    },
  });
}

export function useDeleteLeadTask(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => deleteLeadTask(leadId, taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadTasks", leadId] });
      toast.success("Task deleted");
    },
    onError: (err: APIError) => {
      toast.error(err?.response?.data?.message ?? "Failed to delete task");
    },
  });
}

export function useLeadTimeline(leadId: string) {
  return useQuery({
    queryKey: ["leadTimeline", leadId],
    queryFn: () => getLeadTimeline(leadId),
    enabled: Boolean(leadId),
  });
}
