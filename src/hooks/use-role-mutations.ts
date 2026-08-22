import {
  createRole,
  deleteRole,
  resetRole,
  setRoleColor,
  updateRole,
} from "@/api/roles-permissions";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

function useInvalidateRoleQueries() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["roles"] });
    queryClient.invalidateQueries({ queryKey: ["permissions-matrix"] });
  };
}

export function useCreateRole() {
  const { showSuccess, showError } = useFeedbackDialog();
  const invalidate = useInvalidateRoleQueries();

  return useMutation({
    mutationFn: (data: {
      role: string;
      permission: Record<string, string[]>;
      description?: string;
      color?: string;
    }) => createRole(data),
    onSuccess: () => {
      showSuccess({ title: "Role created" });
      invalidate();
    },
    onError: (error) => {
      showError({
        title: "Failed to create role",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
}

export function useUpdateRole() {
  const { showSuccess, showError } = useFeedbackDialog();
  const invalidate = useInvalidateRoleQueries();

  return useMutation({
    mutationFn: ({
      roleName,
      permission,
      label,
      description,
    }: {
      roleName: string;
      permission: Record<string, string[]>;
      label?: string;
      description?: string;
    }) => updateRole(roleName, permission, label, description),
    onSuccess: () => {
      showSuccess({ title: "Role updated" });
      invalidate();
    },
    onError: (error) => {
      showError({
        title: "Failed to update role",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
}

export function useSetRoleColor() {
  const { showError } = useFeedbackDialog();
  const invalidate = useInvalidateRoleQueries();

  return useMutation({
    mutationFn: ({ roleName, color }: { roleName: string; color: string }) =>
      setRoleColor(roleName, color),
    onSuccess: () => {
      invalidate();
    },
    onError: (error) => {
      showError({
        title: "Failed to update role color",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
}

export function useResetRole() {
  const { showSuccess, showError } = useFeedbackDialog();
  const invalidate = useInvalidateRoleQueries();

  return useMutation({
    mutationFn: (roleName: string) => resetRole(roleName),
    onSuccess: () => {
      showSuccess({ title: "Role reset to default" });
      invalidate();
    },
    onError: (error) => {
      showError({
        title: "Failed to reset role",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
}

export function useDeleteRole() {
  const { showSuccess, showError } = useFeedbackDialog();
  const invalidate = useInvalidateRoleQueries();

  return useMutation({
    mutationFn: (roleName: string) => deleteRole(roleName),
    onSuccess: () => {
      showSuccess({ title: "Role deleted" });
      invalidate();
    },
    onError: (error) => {
      showError({
        title: "Failed to delete role",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
}
