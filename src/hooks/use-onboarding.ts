import { submitOnboardingData } from "@/api/onboarding";
import { useAuthStore } from "@/store/auth-store";
import { useOnboardingStore } from "@/store/onboarding-store";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import type { SessionUser } from "@/types/auth";
import type { APIError } from "./types";
import { useFeedbackDialog } from "./useFeedbackDialog";

function advanceState(
  nextState: SessionUser["onboardingState"],
) {
  useAuthStore.setState((state) => ({
    user: state.user
      ? { ...state.user, onboardingState: nextState }
      : null,
  }));
  useAuthStore.getState().refetch();
}

export function useSubmitOnboardingData() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useFeedbackDialog();

  return useMutation({
    mutationFn: (data: {
      accountType: "firm_admin";
      referralSource?: string;
      profile: {
        firstName: string;
        lastName: string;
        phone?: string;
        jobTitle?: string;
      };
      firmDetails: {
        firmName: string;
        firmEmail: string;
        firmPhoneNumber: string;
        address: string;
        city: string;
        state: string;
        zipcode: string;
        website?: string;
        taxId: string;
      };
    }) => submitOnboardingData(data),
    onSuccess: () => {
      useOnboardingStore.getState().reset();
      showSuccess({
        title: "Onboarding complete",
        description: "Welcome to Oravanti. You're all set.",
      });
      advanceState("completed");
      navigate("/admin", { replace: true });
    },
    onError: (error: APIError) => {
      showError({
        title: "Submission failed",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
}
