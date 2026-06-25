import { updateStaff, updateStaffRole, type UpdateStaffPayload } from "@/api/organization";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

export function useUpdateStaff() {
  const { showSuccess, showError } = useFeedbackDialog();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      staffId,
      data,
      newRole,
    }: {
      staffId: string;
      data: UpdateStaffPayload;
      newRole?: string;
    }) =>
      updateStaffStaff(staffId, data, newRole),
    onSuccess: () => {
      showSuccess({
        title: "Staff updated",
        description: "Staff details have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (error) => {
      showError({
        title: "Failed to update staff",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
}

async function updateStaffStaff(
  staffId: string,
  data: UpdateStaffPayload,
  newRole?: string,
) {
  if (newRole) {
    await updateStaffRole(staffId, newRole);
  }
  await updateStaff(staffId, data);
}
