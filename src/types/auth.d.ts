import type z from "zod";
import type {
  firmInformationSchema,
  personalDetailsSchema,
} from "@/types/pages/onboarding/schema";

export type AuthSession = {
  id: string;
  token: string;
  createdAt: string;
  updatedAt: string;
  ipAddress?: string;
  userAgent?: string;
  activeOrganizationId?: string | null;
  location?: string;
};

export type SessionUser = {
  id: string;
  name: string;
  email?: string;
  emailVerified: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  twoFactorEnabled?: boolean;
  userAccountType: "firm_admin" | "staff" | "contractor" | "client";
  onboardingState:
    | "email_unverified"
    | "email_verified"
    | "domain_verified"
    | "profile_completed"
    | "org_created"
    | "completed";
  tosAccepted: boolean;
  tosAcceptedAt: Date | null;
};

export type SessionUserUpdateData = Omit<
  SessionUser,
  "id" | "createdAt" | "updatedAt" | "emailVerified"
>;

export type PersonalDetails = z.infer<typeof personalDetailsSchema>;
export type FirmInformation = z.infer<typeof firmInformationSchema>;
