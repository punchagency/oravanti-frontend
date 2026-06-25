import { sendVerificationOTP } from "@/api/auth";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface UseResendPasswordResetEmailOptions {
  email: string;
  redirectTo: string;
  storageKey: string;
}

export default function useResendPasswordResetEmail({
  email,
}: UseResendPasswordResetEmailOptions) {
  const [resendTimer, setResendTimer] = useState(0);

  const { mutate: resend, isPending: isResending } = useMutation({
    mutationFn: () =>
      sendVerificationOTP({ email, type: "forget-password" }),
    onSuccess: () => {
      setResendTimer(60);
    },
  });

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => {
      setResendTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  function formatTimer() {
    const m = Math.floor(resendTimer / 60);
    const s = resendTimer % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return { resend, isResending, resendTimer, formatTimer };
}
