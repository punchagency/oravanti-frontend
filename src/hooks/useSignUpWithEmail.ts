/* eslint-disable @typescript-eslint/no-explicit-any */
import { signUpWithEmail } from "@/api/auth";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useFeedbackDialog } from "./useFeedbackDialog";

export const useSignUpWithEmail = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useFeedbackDialog();

  return useMutation({
    mutationFn: async (data: any) => {
      return await signUpWithEmail({
        email: data.email,
        password: data.password,
      });
    },
    onSuccess: async (_data, variables) => {
      showSuccess({
        title: "Signup successful",
        description: "Your account has been created.",
      });
      navigate("/sign-up/success", {
        replace: true,
        state: { email: variables?.email },
      });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      console.log(JSON.stringify(error));
      showError({
        title: "Signup failed",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
};
