/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession, signInWithEmail } from "@/api/auth";
import { getNeedsSetup } from "@/api/organization";
import { useAuthStore } from "@/store/auth-store";
import type { AuthSession, MemberRole, SessionUser } from "@/types/auth";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type APIError } from "./types";
import { useFeedbackDialog } from "./useFeedbackDialog";

export const useSignInWithEmail = () => {
  const { showError } = useFeedbackDialog();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return await signInWithEmail({
        email: data.email,
        password: data.password,
      });
    },
    onSuccess: async (data: any) => {
      if (data?.data?.twoFactorRedirect) {
        // 2FA is only for admin/staff, stays on the public router
        useAuthStore.getState().setRedirectPath("/two-factor");
        return;
      }

      const sessionData: {
        user: SessionUser;
        session: AuthSession;
        memberRole?: MemberRole | null;
        firmTimezone?: string | null;
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
        firmTimezone: sessionData?.firmTimezone ?? null,
        isAuthenticated: !!sessionData?.session,
        isLoading: false,
        refetch: () => queryClient.refetchQueries({ queryKey: ["session"] }),
        needsAcceptInvitation: needsSetup.needsAcceptInvitation,
        needsPasswordChange: needsSetup.needsPasswordChange,
      });

      // AppRouter re-selects the router by accountType and navigates here.
      // Restore the path the user originally tried to visit (saved by the
      // public router catch-all) so deep links like /settings/email-accounts
      // survive the login flow.
      const postLoginRedirect = sessionStorage.getItem("postLoginRedirect");
      sessionStorage.removeItem("postLoginRedirect");
      const validRedirect =
        postLoginRedirect && postLoginRedirect.startsWith("/")
          ? postLoginRedirect
          : null;

      useAuthStore.getState().setRedirectPath(
        needsSetup.needsAcceptInvitation
          ? "/accept-invitation"
          : validRedirect ?? "/",
      );
    },
    onError: (error: APIError) => {
      showError({
        title: "Sign in failed",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
};
