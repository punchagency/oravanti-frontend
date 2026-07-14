import {
  createOverride,
  createTimeOff,
  deleteOverride,
  deleteTimeOff,
  setBreaks,
  setWeeklyAvailability,
  updateOverride,
  updateTimeOff,
  type BreakPayload,
  type OverridePayload,
  type TimeOffPayload,
  type WindowPayload,
} from "@/api/staff-availability";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

function useScheduleMutation<TVariables>(options: {
  mutationFn: (variables: TVariables) => Promise<unknown>;
  getStaffId: (variables: TVariables) => string;
  successTitle: string;
  successDescription: string;
  errorTitle: string;
}) {
  const { showSuccess, showError } = useFeedbackDialog();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: options.mutationFn,
    onSuccess: (_data, variables) => {
      showSuccess({
        title: options.successTitle,
        description: options.successDescription,
      });
      queryClient.invalidateQueries({
        queryKey: ["staff-schedule", options.getStaffId(variables)],
      });
    },
    onError: (error) => {
      showError({
        title: options.errorTitle,
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
}

export function useSetWeeklyAvailability() {
  return useScheduleMutation({
    mutationFn: ({
      staffId,
      windows,
    }: {
      staffId: string;
      windows: WindowPayload[];
    }) => setWeeklyAvailability(staffId, windows),
    getStaffId: (v) => v.staffId,
    successTitle: "Working hours saved",
    successDescription: "Weekly working hours have been updated.",
    errorTitle: "Failed to save working hours",
  });
}

export function useSetBreaks() {
  return useScheduleMutation({
    mutationFn: ({
      staffId,
      breaks,
    }: {
      staffId: string;
      breaks: BreakPayload[];
    }) => setBreaks(staffId, breaks),
    getStaffId: (v) => v.staffId,
    successTitle: "Breaks saved",
    successDescription: "Break times have been updated.",
    errorTitle: "Failed to save breaks",
  });
}

export function useCreateOverride() {
  return useScheduleMutation({
    mutationFn: ({
      staffId,
      payload,
    }: {
      staffId: string;
      payload: OverridePayload;
    }) => createOverride(staffId, payload),
    getStaffId: (v) => v.staffId,
    successTitle: "Override added",
    successDescription: "The date override has been created.",
    errorTitle: "Failed to add override",
  });
}

export function useUpdateOverride() {
  return useScheduleMutation({
    mutationFn: ({
      staffId,
      overrideId,
      payload,
    }: {
      staffId: string;
      overrideId: string;
      payload: OverridePayload;
    }) => updateOverride(staffId, overrideId, payload),
    getStaffId: (v) => v.staffId,
    successTitle: "Override updated",
    successDescription: "The date override has been updated.",
    errorTitle: "Failed to update override",
  });
}

export function useDeleteOverride() {
  return useScheduleMutation({
    mutationFn: ({
      staffId,
      overrideId,
    }: {
      staffId: string;
      overrideId: string;
    }) => deleteOverride(staffId, overrideId),
    getStaffId: (v) => v.staffId,
    successTitle: "Override deleted",
    successDescription: "The date override has been removed.",
    errorTitle: "Failed to delete override",
  });
}

export function useCreateTimeOff() {
  return useScheduleMutation({
    mutationFn: ({
      staffId,
      payload,
    }: {
      staffId: string;
      payload: TimeOffPayload;
    }) => createTimeOff(staffId, payload),
    getStaffId: (v) => v.staffId,
    successTitle: "Time off added",
    successDescription: "The time-off entry has been created.",
    errorTitle: "Failed to add time off",
  });
}

export function useUpdateTimeOff() {
  return useScheduleMutation({
    mutationFn: ({
      staffId,
      timeOffId,
      payload,
    }: {
      staffId: string;
      timeOffId: string;
      payload: TimeOffPayload;
    }) => updateTimeOff(staffId, timeOffId, payload),
    getStaffId: (v) => v.staffId,
    successTitle: "Time off updated",
    successDescription: "The time-off entry has been updated.",
    errorTitle: "Failed to update time off",
  });
}

export function useDeleteTimeOff() {
  return useScheduleMutation({
    mutationFn: ({
      staffId,
      timeOffId,
    }: {
      staffId: string;
      timeOffId: string;
    }) => deleteTimeOff(staffId, timeOffId),
    getStaffId: (v) => v.staffId,
    successTitle: "Time off deleted",
    successDescription: "The time-off entry has been removed.",
    errorTitle: "Failed to delete time off",
  });
}
