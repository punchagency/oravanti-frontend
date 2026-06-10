import { z } from "zod";

export const personalDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone number is required"),
  jobTitle: z.string().optional(),
});

export type PersonalDetailsInput = z.infer<typeof personalDetailsSchema>;

export const firmInformationSchema = z.object({
  firmName: z.string().min(1, "Firm name is required"),
  firmEmail: z.string().email("Must be a valid email address"),
  firmPhoneNumber: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipcode: z.string().min(1, "ZIP code is required"),
  website: z.string().min(1, "Website is required").url("Must be a valid URL"),
  taxId: z.string().min(1, "Tax ID is required"),
});

export type FirmInformationInput = z.infer<typeof firmInformationSchema>;

export const domainSchema = z.object({
  domain: z
    .string()
    .min(1, "Domain is required")
    .regex(
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
      "Enter a valid domain (e.g. firm.com)",
    ),
});

export type DomainInput = z.infer<typeof domainSchema>;
