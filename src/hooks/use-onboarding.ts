import {
  submitDomain,
  submitOnboardingData,
  verifyDomain,
} from "@/api/onboarding";
import { useAuthStore } from "@/store/auth-store";
import { useOnboardingStore } from "@/store/onboarding-store";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import type { SessionUser } from "@/types/auth";
import type { APIError } from "./types";
import { useFeedbackDialog } from "./useFeedbackDialog";

/** Advance user's onboardingState in the store optimistically, then background-refresh. */
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

export function useSubmitDomain() {
  const { showError } = useFeedbackDialog();

  return useMutation({
    mutationFn: submitDomain,
    onSuccess: (data) => {
      useAuthStore.getState().setOrganizationId(data.organizationId);
    },
    onError: (error: APIError) => {
      showError({
        title: "Domain submission failed",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
}

export function useVerifyDomain() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useFeedbackDialog();

  return useMutation({
    mutationFn: (data: { organizationId: string }) => verifyDomain(data),
    onSuccess: (data) => {
      if (data.success) {
        showSuccess({
          title: "Domain verified",
          description: "Your domain has been verified successfully.",
        });
        advanceState("domain_verified");
        navigate("/onboarding/step-2-profile", { replace: true });
      } else {
        showError({
          title: "Domain not found",
          description:
            data.message ??
            "TXT record not detected. Make sure you've added the record and try again.",
        });
      }
    },
    onError: (error: APIError) => {
      showError({
        title: "Domain verification failed",
        description: getErrorMessage(
          error,
          "Could not verify domain ownership. Check your DNS records and try again.",
        ),
      });
    },
  });
}

export function useSubmitOnboardingData() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useFeedbackDialog();

  return useMutation({
    mutationFn: (data: {
      accountType: "firm_admin";
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
      organizationId: string;
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
