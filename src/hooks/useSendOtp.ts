import { sendVerificationOTP } from "@/api/auth";
import { useMutation } from "@tanstack/react-query";
import type { APIError } from "./types";
import { useFeedbackDialog } from "./useFeedbackDialog";

export type OtpOperationType =
  | "sign-in"
  | "email-verification"
  | "forget-password"
  | "change-email";

interface SendOtpVariables {
  email: string;
  type: OtpOperationType;
}

interface FeedbackMessage {
  title: string;
  description: string;
}

const useSendOtp = () => {
  const { showSuccess, showError } = useFeedbackDialog();

  return useMutation({
    mutationFn: async (variables: SendOtpVariables) => {
      await sendVerificationOTP({
        email: variables.email,
        type: variables.type,
      });
    },

    // The second parameter `variables` contains the context of the dispatch
    onSuccess: (_data, variables) => {
      const successMessages: Record<OtpOperationType, FeedbackMessage> = {
        "sign-in": {
          title: "Verification Code Sent",
          description:
            "A login verification code has been dispatched to your email address.",
        },
        "email-verification": {
          title: "Verification Email Sent",
          description:
            "An account confirmation code has been sent to your email address.",
        },
        "forget-password": {
          title: "Recovery Code Sent",
          description: `A 6-digit password recovery code has been sent to ${variables.email}.`,
        },
        "change-email": {
          title: "Verification Code Sent",
          description:
            "A verification code has been sent to your proposed new email address.",
        },
      };

      const message = successMessages[variables.type];

      showSuccess({
        title: message.title,
        description: message.description,
      });
    },
    onError: (error: APIError) => {
      showError({
        title: "Action Failed",
        description:
          error.response?.data?.message ??
          "An unexpected error occurred while routing your request.",
      });
    },
  });
};

export default useSendOtp;
