import { API } from ".";
import type { ContractorSignupPayload } from "@/pages/sign-up/contractor/schema";
import type { PublicPracticeArea } from "@/pages/sign-up/contractor/types";

export const signUpWithEmail = async (data: {
  email: string;
  password: string;
}) => {
  return (await API.post("/auth/sign-up/email", data)).data;
};

export const signInWithEmail = async (data: {
  email: string;
  password: string;
}) => {
  return (await API.post("/auth/sign-in/email", data)).data;
};

export const signOut = async () => {
  return (await API.post("/auth/sign-out")).data;
};

export const sendVerificationOTP = async (data: {
  email: string;
  type: "sign-in" | "email-verification" | "forget-password" | "change-email";
}) => {
  return (await API.post("/auth/send-verification-otp", data)).data;
};

export const verifyTOTP = async (data: { code: string }) => {
  return (await API.post("/auth/two-factor/verify-totp", data)).data;
};

export const getSession = async () => {
  return (await API.get("/auth/get-session")).data;
};

export const getPublicPracticeAreas = async (): Promise<PublicPracticeArea[]> => {
  const response = await API.get("/practice-areas/public");

  return Array.isArray(response.data) ? response.data : response.data?.data ?? [];
};

export const contractorSignUpWithEmail = async (
  data: ContractorSignupPayload,
) => {
  return (await API.post("/auth/contractors/sign-up/email", data)).data;
};
