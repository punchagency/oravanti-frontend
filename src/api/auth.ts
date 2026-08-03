import { API } from ".";
import type { ContractorSignupPayload } from "@/pages/contractor-sign-up/schema";
import type { PublicPracticeArea } from "@/pages/contractor-sign-up/types";

export const signUpWithEmail = async (data: {
  email: string;
  password: string;
}) => {
  return (await API.post("/auth/sign-up/email", data)).data;
};

export const signUpAsFirmAdmin = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) => {
  return (
    await API.post("/auth/sign-up/email?account_type=firm_admin", {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
    })
  ).data;
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

export const getPublicPracticeAreas = async (): Promise<
  PublicPracticeArea[]
> => {
  const response = await API.get("/practice-areas/public");

  return Array.isArray(response.data)
    ? response.data
    : (response.data?.data ?? []);
};

export interface PracticeAreaTreeNode {
  id: string;
  name: string;
  children?: PracticeAreaTreeNode[];
}

export interface PracticeAreaTreeData {
  practiceAreaTreeNodes: PracticeAreaTreeNode[];
  practiceAreaIds: string[];
  subcategoryIds: string[];
  caseTypeIds: string[];
  practiceAreaNameLookup: Record<string, string>;
}

export const getPracticeAreaTreeData = async (): Promise<PracticeAreaTreeData> => {
  const response = await API.get("/practice-areas/tree-data");
  return response.data.data;
};

const buildContractorSignupFormData = (data: ContractorSignupPayload) => {
  const formData = new FormData();

  formData.append("email", data.email);
  formData.append("password", data.password);
  formData.append("firstName", data.firstName);
  formData.append("lastName", data.lastName);
  formData.append("phoneNumber", data.phoneNumber);
  formData.append("desiredHourlyRate", String(data.desiredHourlyRate));
  formData.append(
    "consentedToBackgroundCheck",
    String(data.consentedToBackgroundCheck),
  );
  formData.append(
    "recognizedDirectoryListingVerificationAccepted",
    String(data.recognizedDirectoryListingVerificationAccepted),
  );
  formData.append("bio", data.bio);
  formData.append("availability", data.availability);
  formData.append("specialtyIds", JSON.stringify(data.specialtyIds));
  formData.append("paymentDetails", JSON.stringify(data.paymentDetails));
  formData.append(
    "certificationDocuments",
    JSON.stringify(data.certificationDocuments),
  );
  data.certificationFiles.forEach((file) => {
    formData.append("certificationFiles", file);
  });
  data.identificationFiles.forEach((file) => {
    formData.append("identificationFiles", file);
  });

  return formData;
};

export const contractorSignUpWithEmail = async (
  data: ContractorSignupPayload,
) => {
  return (
    await API.post(
      "/auth/contractors/sign-up/email",
      buildContractorSignupFormData(data),
    )
  ).data;
};

export async function resetPassword(data: {
  email: string;
  otp: string;
  password: string;
}) {
  return (await API.post("/auth/reset-password", data)).data;
}

// ── Password Management ──────────────────────────────────────────────────────

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  return (await API.post("/auth/change-password", data)).data;
}

// ── Session Management ───────────────────────────────────────────────────────

export type UserSession = {
  id: string;
  token: string;
  createdAt: string;
  updatedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string;
};

export async function getUserSessions() {
  return (await API.get<{ data: UserSession[] }>("/auth/sessions")).data;
}

export async function revokeSession(token: string) {
  return (await API.delete(`/auth/sessions/${token}`)).data;
}

// ── Two-Factor Authentication ────────────────────────────────────────────────

export type TwoFactorSetupData = {
  totpURI: string;
  backupCodes: string[];
};

export async function enableTwoFactorAuth(data: { password: string }) {
  return (await API.post<{ data: TwoFactorSetupData }>(
    "/auth/two-factor/enable",
    data,
  )).data;
}

export async function disableTwoFactorAuth(data: { password: string }) {
  return (await API.post("/auth/two-factor/disable", data)).data;
}

export async function verifyTwoFactorSetup(data: { token: string }) {
  return (await API.post("/auth/two-factor/verify-setup", data)).data;
}

export async function verifyBackupCode(data: { code: string }) {
  return (await API.post("/auth/two-factor/verify-backup-code", data)).data;
}

// ── Organization (Firm Information) ──────────────────────────────────────────

export type FirmInformationUpdate = {
  name: string;
  slug?: string;
  emailAddress?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  website?: string;
  taxId?: string;
};

export async function updateOrganization(data: FirmInformationUpdate) {
  return (await API.post("/organization/update", { data })).data;
}
