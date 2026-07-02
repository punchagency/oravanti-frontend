import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";
import {
  getOrCreateCaseWorkflow,
  getWorkflowSummary,
  getEligibleStaff,
  getCaseTimeline,
  assignStaffToStep,
  completeStep,
  manuallyTriggerModule,
  simulateNetworkDelay,
} from "./data/mock-engine";

// ---------------------------------------------------------------------------
// Query key factory — keeps keys consistent across hooks and cache invalidation
// ---------------------------------------------------------------------------

export const workflowKeys = {
  all: ["workflow"] as const,
  instance: (caseId: string) => ["workflow", "instance", caseId] as const,
  summary: (caseId: string) => ["workflow", "summary", caseId] as const,
  timeline: (caseId: string) => ["workflow", "timeline", caseId] as const,
  eligibleStaff: (certification: string | null) =>
    ["workflow", "eligible-staff", certification] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetches (or initialises) the full workflow instance for a given case.
 */
export function useCaseWorkflow(caseId: string) {
  return useQuery({
    queryKey: workflowKeys.instance(caseId),
    queryFn: async () => {
      await simulateNetworkDelay();
      return getOrCreateCaseWorkflow(caseId);
    },
    enabled: Boolean(caseId),
    staleTime: 30_000,
  });
}

/**
 * Fetches a lightweight progress summary for the Overview tab widget.
 */
export function useWorkflowSummary(caseId: string) {
  return useQuery({
    queryKey: workflowKeys.summary(caseId),
    queryFn: async () => {
      await simulateNetworkDelay(150);
      return getWorkflowSummary(caseId);
    },
    enabled: Boolean(caseId),
    staleTime: 30_000,
  });
}

/**
 * Returns the staff members eligible for assignment to a step,
 * filtered by the required certification.
 */
export function useEligibleStaff(requiredCertification: string | null) {
  return useQuery({
    queryKey: workflowKeys.eligibleStaff(requiredCertification),
    queryFn: async () => {
      await simulateNetworkDelay(100);
      return getEligibleStaff(requiredCertification);
    },
    staleTime: 60_000,
  });
}

/**
 * Returns the timeline of workflow events for a case.
 * Invalidated automatically whenever a workflow mutation occurs.
 */
export function useCaseTimeline(caseId: string) {
  return useQuery({
    queryKey: workflowKeys.timeline(caseId),
    queryFn: async () => {
      await simulateNetworkDelay(100);
      return getCaseTimeline(caseId);
    },
    enabled: Boolean(caseId),
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Assigns a staff member to a workflow step.
 * Enforces the certification gate — if blocked, the error can be caught
 * by the caller to show the attorney override dialog.
 */
export function useAssignStep(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      stepId,
      staffId,
      overrideRationale,
    }: {
      stepId: string;
      staffId: string;
      overrideRationale?: string;
    }) => {
      await simulateNetworkDelay();
      return assignStaffToStep(caseId, stepId, staffId, overrideRationale);
    },
    onSuccess: () => {
      toast.success("Step assigned");
      queryClient.invalidateQueries({ queryKey: workflowKeys.instance(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.summary(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.timeline(caseId) });
    },
    onError: (error: Error) => {
      // Certification gate error — caller should handle this gracefully
      toast.error(error.message || "Failed to assign step");
    },
  });
}

/**
 * Marks a step as complete and cascades activation to the next step / module.
 */
export function useCompleteStep(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      stepId,
      notes,
    }: {
      stepId: string;
      notes?: string;
    }) => {
      await simulateNetworkDelay();
      const currentUser = useAuthStore.getState().user;
      const completedByOverride = currentUser
        ? { id: currentUser.id, name: currentUser.name }
        : null;
      return completeStep(caseId, stepId, notes, completedByOverride);
    },
    onSuccess: (result) => {
      toast.success("Step completed");
      queryClient.invalidateQueries({ queryKey: workflowKeys.instance(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.summary(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.timeline(caseId) });

      if (result.moduleCompleted) {
        toast.success("Module completed!");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to complete step");
    },
  });
}

/**
 * Manually triggers a conditionally-activated module (e.g. Litigation).
 */
export function useTriggerModule(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (moduleId: string) => {
      await simulateNetworkDelay();
      return manuallyTriggerModule(caseId, moduleId);
    },
    onSuccess: () => {
      toast.success("Module activated");
      queryClient.invalidateQueries({ queryKey: workflowKeys.instance(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.summary(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.timeline(caseId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to activate module");
    },
  });
}
