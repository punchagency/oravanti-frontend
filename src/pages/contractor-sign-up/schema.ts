import * as z from "zod";

const acceptedCertificationFileTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
];

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

export const contractorSignupRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Email must be a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
  firstName: z.string().trim().min(1, "First Name is required"),
  lastName: z.string().trim().min(1, "Last Name is required"),
  phoneNumber: z.string().trim().min(1, "Phone Number is required"),
  desiredHourlyRate: z.union([z.string(), z.number()]).refine((value) => Number(value) > 0, {
    message: "Desired Hourly Rate must be greater than zero",
  }),
  consentedToBackgroundCheck: z.preprocess(
    parseBooleanField,
    z.literal(true, {
      error: "You must consent to a background check",
    }),
  ),
  recognizedDirectoryListingVerificationAccepted: z.preprocess(
    parseBooleanField,
    z.literal(true, {
      error: "You must accept directory listing verification checks",
    }),
  ),
  bio: z.string().trim().min(1, "Professional Bio is required"),
  availability: z.enum(["full-time", "part-time", "project-based"], {
    error: "Availability is required",
  }),
  specialtyIds: z.preprocess(
    parseJsonField,
    z
      .array(z.string().uuid("Selected specialties must be valid"))
      .min(1, "At least one specialty is required"),
  ),
  paymentDetails: z.preprocess(
    parseJsonField,
    z.discriminatedUnion("paymentMethod", [
      z.object({
        paymentMethod: z.literal("paypal"),
        paypalEmail: z
          .string()
          .trim()
          .min(1, "PayPal Email is required")
          .email("PayPal Email must be a valid email address"),
      }),
      z.object({
        paymentMethod: z.literal("bank_account"),
        accountHolderName: z.string().trim().min(1, "Account Holder Name is required"),
        routingNumber: z.string().trim().min(1, "Routing Number is required"),
        accountNumber: z.string().trim().min(1, "Account Number is required"),
      }),
    ]),
  ),
  certificationDocuments: z.preprocess(
    parseJsonField,
    z
      .array(
        z.object({
          certificationName: z.string().trim().min(1, "Certification Name is required"),
          issuingOrganization: z.string().trim().optional(),
          issuedAt: z.string().optional(),
          expiresAt: z.string().optional(),
        }),
      )
      .min(1, "At least one certification document is required"),
  ),
});

export const contractorSignupSchema = contractorSignupRequestSchema.extend({
  certificationFiles: z
    .array(
      z
        .custom<File>(
          (value) => typeof File !== "undefined" && value instanceof File,
          "A valid certification document file is required",
        )
        .refine((file) => file.size > 0, {
          message: "Certification document file cannot be empty",
        })
        .refine(
          (file) =>
            acceptedCertificationFileTypes.includes(file.type) ||
            /\.(pdf|png|jpe?g)$/i.test(file.name),
          {
            message: "Certification documents must be PDF, PNG, or JPG files",
          },
        ),
    )
    .min(1, "At least one certification document file is required"),
  identificationFiles: z
    .array(
      z
        .custom<File>(
          (value) => typeof File !== "undefined" && value instanceof File,
          "A valid identification document file is required",
        )
        .refine((file) => file.size > 0, {
          message: "Identification document file cannot be empty",
        })
        .refine(
          (file) =>
            acceptedCertificationFileTypes.includes(file.type) ||
            /\.(pdf|png|jpe?g)$/i.test(file.name),
          {
            message: "Identification documents must be PDF, PNG, or JPG files",
          },
        ),
    )
    .min(2, "Two forms of identification are required")
    .max(2, "Only two forms of identification are required"),
});

export type ContractorSignupRequestPayload = z.output<
  typeof contractorSignupRequestSchema
>;

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
  certificationFiles: File[];
  identificationFiles: File[];
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
  certificationDocuments: [],
  certificationFiles: [],
  identificationFiles: [],
};
