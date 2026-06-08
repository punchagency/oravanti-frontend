export const contractorSignupSteps = [
  "Personal details",
  "Specialties",
  "Background check",
  "Profile setup",
  "Payout setup",
] as const;

export const contractorStepFields = {
  1: ["firstName", "lastName", "email", "phoneNumber", "password"],
  2: ["specialtyIds", "certificationDocuments", "certificationFiles"],
  3: ["consentedToBackgroundCheck", "desiredHourlyRate"],
  4: ["bio", "availability", "recognizedDirectoryListingVerificationAccepted"],
  5: ["paymentDetails"],
} as const;
