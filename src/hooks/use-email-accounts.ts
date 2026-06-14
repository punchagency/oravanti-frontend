import {
  classifyEmail,
  connectCustomAuto,
  connectCustomManual,
  deleteEmailAccount,
  disableEmailAccount,
  enableEmailAccount,
  listEmailAccounts,
} from "@/api/email-accounts";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { APIError } from "./types";
import { useFeedbackDialog } from "./useFeedbackDialog";

const emailKeys = {
  all: ["email-accounts"] as const,
  filtered: (status: string) => ["email-accounts", status] as const,
};

export function useEmailAccountList(
  status: "all" | "active" | "disabled" = "all",
) {
  return useQuery({
    queryKey: emailKeys.filtered(status),
    queryFn: () => listEmailAccounts(status),
    select: (data) => data.data,
  });
}

export function useEnableEmailAccount() {
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useFeedbackDialog();

  return useMutation({
    mutationFn: ({ id }: { id: string; email: string }) =>
      enableEmailAccount(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: emailKeys.all });
      showSuccess({
        title: "Email enabled",
        description: `${variables.email} has been enabled.`,
      });
    },
    onError: (error: APIError, variables) => {
      showError({
        title: "Failed to enable",
        description: getErrorMessage(
          error,
          `Could not enable ${variables.email}.`,
        ),
      });
    },
  });
}

export function useDisableEmailAccount() {
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useFeedbackDialog();

  return useMutation({
    mutationFn: ({ id }: { id: string; email: string }) =>
      disableEmailAccount(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: emailKeys.all });
      showSuccess({
        title: "Email disabled",
        description: `${variables.email} has been disabled.`,
      });
    },
    onError: (error: APIError, variables) => {
      showError({
        title: "Failed to disable",
        description: getErrorMessage(
          error,
          `Could not disable ${variables.email}.`,
        ),
      });
    },
  });
}

export function useDeleteEmailAccount() {
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useFeedbackDialog();

  return useMutation({
    mutationFn: ({ id }: { id: string; email: string }) =>
      deleteEmailAccount(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: emailKeys.all });
      showSuccess({
        title: "Email deleted",
        description: `${variables.email} has been permanently deleted.`,
      });
    },
    onError: (error: APIError, variables) => {
      showError({
        title: "Failed to delete",
        description: getErrorMessage(
          error,
          `Could not delete ${variables.email}.`,
        ),
      });
    },
  });
}

export function useClassifyEmailAccount() {
  const { showError } = useFeedbackDialog();

  return useMutation({
    mutationFn: (email: string) => classifyEmail(email),
    onError: (error: APIError) => {
      showError({
        title: "Classification failed",
        description: getErrorMessage(
          error,
          "Could not identify email provider.",
        ),
      });
    },
  });
}

export function useConnectEmailAccountAuto() {
  const { showError } = useFeedbackDialog();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      connectCustomAuto(email, password),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["email-accounts"] }),
    onError: (error: APIError) => {
      showError({
        title: "Connection failed",
        description: getErrorMessage(
          error,
          "Could not connect to email server.",
        ),
      });
    },
  });
}

export function useConnectEmailAccountManual() {
  const { showError, showSuccess } = useFeedbackDialog();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: Parameters<typeof connectCustomManual>[0]) =>
      connectCustomManual(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["email-accounts"] });
      showSuccess({
        title: "Connection successful",
        description: `${variables.email} has been connected successfully.`,
      });
    },
    onError: (error: APIError, variables) => {
      showError({
        title: "Connection failed",
        description: getErrorMessage(
          error,
          `Could not connect ${variables.email} with manual settings.`,
        ),
      });
    },
  });
}
