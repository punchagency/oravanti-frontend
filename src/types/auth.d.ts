import type z from "zod";
import type {
  firmInformationSchema,
  personalDetailsSchema,
} from "./pages/onboarding/schema";

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
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  name: string;
  phoneNumber?: string;
  jobTitle?: string;
  barNumber?: string;
  image?: string;
  twoFactorEnabled?: boolean;
};

export type SessionUserUpdateData = Omit<
  SessionUser,
  "id" | "createdAt" | "updatedAt" | "emailVerified"
>;

export type PersonalDetails = z.infer<typeof personalDetailsSchema>;
export type FirmInformation = z.infer<typeof firmInformationSchema>;
