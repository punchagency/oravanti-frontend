import { updateStaffMember, updateStaffMemberRole, type UpdateStaffMemberPayload } from "@/api/organization";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

export function useUpdateStaffMember() {
  const { showSuccess, showError } = useFeedbackDialog();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      staffId,
      data,
      newRole,
    }: {
      staffId: string;
      data: UpdateStaffMemberPayload;
      newRole?: string | string[];
    }) =>
      updateStaffMemberStaff(staffId, data, newRole),
    onSuccess: () => {
      showSuccess({
        title: "Staff member updated",
        description: "Staff details have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["staffs"] });
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

async function updateStaffMemberStaff(
  staffId: string,
  data: UpdateStaffMemberPayload,
  newRole?: string | string[],
) {
  if (newRole) {
    await updateStaffMemberRole(staffId, newRole);
  }
  await updateStaffMember(staffId, data);
}
