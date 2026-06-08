/* eslint-disable @typescript-eslint/no-explicit-any */
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useFeedbackDialog } from "./useFeedbackDialog";
import { resetPassword } from "@/api/auth";

const useResetPassword = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useFeedbackDialog();

  return useMutation({
    mutationFn: async (data: OtpResetVariables) => {
        const { data: responseData, error } =
          await resetPassword({
            email: data.email,
            otp: data.otp,
            password: data.password,
          });

        if (error)
          throw new Error(
            error.message || "Invalid code or password reset failed.",
          );
        return responseData;
    },
    onSuccess: async () => {
      showSuccess({
        title: "Password reset successful",
        description: "You can now log in with your new password.",
      });

      navigate("/login");
    },
    onError: (error: any) => {
      showError({
        title: "Reset Failed",
        description: getErrorMessage(
          error,
          "We couldn't update your password. Please verify your data and try again.",
        ),
      });
    },
  });
};

export default useResetPassword;
