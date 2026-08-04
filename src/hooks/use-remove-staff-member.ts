import { removeStaffMember } from "@/api/organization";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

export function useRemoveStaffMember() {
  const { showSuccess, showError } = useFeedbackDialog();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (staffId: string) => removeStaffMember(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staffs"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      showSuccess({ title: "Staff member removed" });
    },
    onError: (error) => {
      showError({
        title: "Failed to remove staff",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
}
