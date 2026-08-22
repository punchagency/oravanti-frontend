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
  const { showError } = useFeedbackDialog();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: any) => {
      return await signInWithEmail({
        email: data.email,
        password: data.password,
      });
    },
    onSuccess: async (data: any) => {
      if (data?.data?.twoFactorRedirect) {
        // 2FA pending — navigate to the verification page on the public router.
        useAuthStore.getState().setTwoFactorPending(true);
        navigate("/two-factor", { replace: true });
        return;
      }

      const sessionData: {
        user: SessionUser;
        session: AuthSession;
        memberRole?: MemberRole | null;
        firmTimezone?: string | null;
        portalStatus?: string | null;
        grants?: string[];
      } = await queryClient.fetchQuery({
        queryKey: ["session"],
        queryFn: async () => {
          const response = await getSession();
          return response.data;
        },
      });

      const needsSetup =
        sessionData?.user?.accountType === "staff"
          ? await getNeedsSetup()
          : { needsAcceptInvitation: false, needsPasswordChange: false };

      useAuthStore.getState().setAuth({
        user: sessionData?.user ?? null,
        session: sessionData?.session ?? null,
        memberRole: sessionData?.memberRole ?? null,
        grants: sessionData?.grants ?? [],
        firmTimezone: sessionData?.firmTimezone ?? null,
        portalStatus: sessionData?.portalStatus ?? null,
        isAuthenticated: !!sessionData?.session,
        isLoading: false,
        refetch: () => queryClient.refetchQueries({ queryKey: ["session"] }),
        needsAcceptInvitation: needsSetup.needsAcceptInvitation,
        needsPasswordChange: needsSetup.needsPasswordChange,
        twoFactorPending: false,
      });

      if (needsSetup.needsAcceptInvitation) {
        window.location.replace("/accept-invitation");
      } else {
        window.location.replace("/");
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
