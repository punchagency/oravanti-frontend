import { getStaffSchedule, type StaffScheduleDTO } from "@/api/staff-availability";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useQuery } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

export function useStaffSchedule(staffId: string | null) {
  const { showError } = useFeedbackDialog();

  const query = useQuery({
    queryKey: ["staff-schedule", staffId],
    queryFn: () => getStaffSchedule(staffId!),
    enabled: !!staffId,
    staleTime: Infinity,
  });

  if (query.isError) {
    showError({
      title: "Failed to load schedule",
      description: getErrorMessage(query.error, "Please try again later."),
    });
  }

  return query;
}

export type { StaffScheduleDTO };
