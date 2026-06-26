/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession, signInWithEmail } from "@/api/auth";
import { getNeedsSetup } from "@/api/organization";
import { useAuthStore } from "@/store/auth-store";
import type { AuthSession, MemberRole, SessionUser } from "@/types/auth";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { type APIError } from "./types";
import { useFeedbackDialog } from "./useFeedbackDialog";

export const useSignInWithEmail = () => {
  const { showError, showSuccess } = useFeedbackDialog();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return await signInWithEmail({
        email: data.email,
        password: data.password,
      });
    },
    onSuccess: async (data: any) => {
      showSuccess({
        title: "Sign in successful",
        description: "You have been signed in successfully.",
      });
      if (data?.data?.twoFactorRedirect) {
        navigate("/auth/2fa");
      } else {
        const sessionData: {
          user: SessionUser;
          session: AuthSession;
          memberRole?: MemberRole | null;
        } = await queryClient.fetchQuery({
          queryKey: ["session"],
          queryFn: async () => {
            const response = await getSession();
            return response.data;
          },
        });

        const needsSetup = await getNeedsSetup();

        useAuthStore.getState().setAuth({
          user: sessionData?.user ?? null,
          session: sessionData?.session ?? null,
          memberRole: sessionData?.memberRole ?? null,
          isAuthenticated: !!sessionData?.session,
          isLoading: false,
          refetch: () => queryClient.refetchQueries({ queryKey: ["session"] }),
          needsAcceptInvitation: needsSetup.needsAcceptInvitation,
          needsPasswordChange: needsSetup.needsPasswordChange,
        });

        if (needsSetup.needsAcceptInvitation) {
          navigate("/accept-invitation", { replace: true });
        } else {
          navigate("/admin", { replace: true });
        }
      }
    },
    onError: (error: APIError) => {
      showError({
        title: "Sign in failed",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
};
