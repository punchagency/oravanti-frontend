import {
  updateStaffPortalStatus,
  type StaffPortalStatus,
} from "@/api/organization";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

export function useUpdateStaffPortalStatus() {
  const { showSuccess, showError } = useFeedbackDialog();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      staffId,
      status,
    }: {
      staffId: string;
      status: StaffPortalStatus;
    }) => updateStaffPortalStatus(staffId, status),
    onSuccess: () => {
      showSuccess({
        title: "Portal access updated",
        description: "Staff portal access has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["staffs"] });
    },
    onError: (error) => {
      showError({
        title: "Failed to update portal access",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
}
