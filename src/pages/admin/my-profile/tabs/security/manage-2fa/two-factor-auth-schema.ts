import { z } from "zod";

export const twoFactorAuthSchema = z.object({
  password: z.string().min(1, "Password is required").trim(),
});

export type TwoFactorAuthForm = z.infer<typeof twoFactorAuthSchema>;
