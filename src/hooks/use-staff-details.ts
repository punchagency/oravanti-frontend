import { getStaffDetails, type StaffDetailsDTO } from "@/api/organization";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useQuery } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

export function useStaffDetails(staffId: string | null) {
  const { showError } = useFeedbackDialog();

  const query = useQuery({
    queryKey: ["staff", staffId],
    queryFn: () => getStaffDetails(staffId!),
    enabled: !!staffId,
    staleTime: Infinity,
  });

  if (query.isError) {
    showError({
      title: "Failed to load staff details",
      description: getErrorMessage(query.error, "Please try again later."),
    });
  }

  return query;
}

export type { StaffDetailsDTO };
