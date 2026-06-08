import * as z from "zod";

export const parseJsonField = (value: unknown) => {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const parseBooleanField = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "1", "on", "yes"].includes(value.toLowerCase());
  }

  return value;
};

export const contractorSignupSchema = z.object({
  email: z.string().email("Must be a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().trim().min(1, "firstName is required"),
  lastName: z.string().trim().min(1, "lastName is required"),
  phoneNumber: z.string().trim().min(1, "phoneNumber is required"),
  desiredHourlyRate: z.union([z.string(), z.number()]).refine((value) => Number(value) > 0, {
    message: "desiredHourlyRate must be greater than zero",
  }),
  consentedToBackgroundCheck: z.preprocess(
    parseBooleanField,
    z.literal(true, {
      error: "Contractors must consent to a background check",
    }),
  ),
  recognizedDirectoryListingVerificationAccepted: z.preprocess(
    parseBooleanField,
    z.literal(true, {
      error: "Contractors must accept directory listing verification checks",
    }),
  ),
  bio: z.string().trim().min(1, "bio is required"),
  availability: z.enum(["full-time", "part-time", "project-based"]),
  specialtyIds: z.preprocess(
    parseJsonField,
    z
      .array(z.string().uuid("specialtyIds must contain valid UUIDs"))
      .min(1, "At least one specialty is required"),
  ),
  paymentDetails: z.preprocess(
    parseJsonField,
    z.discriminatedUnion("paymentMethod", [
      z.object({
        paymentMethod: z.literal("paypal"),
        paypalEmail: z.string().email("Must be a valid PayPal email"),
      }),
      z.object({
        paymentMethod: z.literal("bank_account"),
        accountHolderName: z.string().trim().min(1, "accountHolderName is required"),
        routingNumber: z.string().trim().min(1, "routingNumber is required"),
        accountNumber: z.string().trim().min(1, "accountNumber is required"),
      }),
    ]),
  ),
  certificationDocuments: z.preprocess(
    parseJsonField,
    z
      .array(
        z.object({
          certificationName: z.string().trim().min(1, "certificationName is required"),
          issuingOrganization: z.string().trim().optional(),
          issuedAt: z.string().optional(),
          expiresAt: z.string().optional(),
        }),
      )
      .min(1, "At least one certification document is required"),
  ),
});

export type ContractorSignupPayload = z.output<typeof contractorSignupSchema>;

export type ContractorSignupFormValues = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  desiredHourlyRate: string;
  consentedToBackgroundCheck: boolean;
  recognizedDirectoryListingVerificationAccepted: boolean;
  bio: string;
  availability: "" | "full-time" | "part-time" | "project-based";
  specialtyIds: string[];
  paymentDetails: {
    paymentMethod: "paypal" | "bank_account";
    paypalEmail: string;
    accountHolderName: string;
    routingNumber: string;
    accountNumber: string;
  };
  certificationDocuments: Array<{
    certificationName: string;
    issuingOrganization?: string;
    issuedAt?: string;
    expiresAt?: string;
  }>;
};

export const defaultContractorSignupValues: ContractorSignupFormValues = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phoneNumber: "",
  desiredHourlyRate: "",
  consentedToBackgroundCheck: false,
  recognizedDirectoryListingVerificationAccepted: false,
  bio: "",
  availability: "",
  specialtyIds: [],
  paymentDetails: {
    paymentMethod: "bank_account",
    paypalEmail: "",
    accountHolderName: "",
    routingNumber: "",
    accountNumber: "",
  },
  certificationDocuments: [
    {
      certificationName: "",
      issuingOrganization: "",
      issuedAt: "",
      expiresAt: "",
    },
  ],
};
