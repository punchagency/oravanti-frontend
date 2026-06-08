interface TokenResetVariables {
  type: "link";
  password: string;
}

interface OtpResetVariables {
  type: "otp";
  email: string;
  otp: string;
  password: string;
}

type ResetPasswordVariables = TokenResetVariables | OtpResetVariables;
