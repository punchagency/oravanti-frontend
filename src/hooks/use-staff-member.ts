import { getStaffMember, type StaffDetailsDTO } from "@/api/organization";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useQuery } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

export function useStaffMember(staffId: string | null) {
  const { showError } = useFeedbackDialog();

  const query = useQuery({
    queryKey: ["staffs", staffId],
    queryFn: () => getStaffMember(staffId!),
    enabled: !!staffId,
    staleTime: Infinity,
  });

  if (query.isError) {
    showError({
      title: "Failed to load staff member details",
      description: getErrorMessage(query.error, "Please try again later."),
    });
  }

  return query;
}

export type { StaffDetailsDTO };
