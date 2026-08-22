import { updateStaffMemberRole } from "@/api/organization";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

/** Assign a staff member's full set of roles at once (multi-role toggle). */
export function useUpdateStaffRoles() {
  const { showError } = useFeedbackDialog();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ staffId, roles }: { staffId: string; roles: string[] }) =>
      updateStaffMemberRole(staffId, roles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staffs"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["permissions-matrix"] });
    },
    onError: (error) => {
      showError({
        title: "Failed to update roles",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
}
