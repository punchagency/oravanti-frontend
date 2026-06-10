import { API } from ".";

export const submitDomain = async (data: { domain: string }) => {
  return (await API.post("/onboarding/step1a-submit-domain", data))
    .data as unknown as {
    organizationId: string;
    txtRecordName: string;
    txtRecordValue: string;
  };
};

export const verifyDomain = async (data: { organizationId: string }) => {
  return (await API.post("/onboarding/step1b-verify-dns", data))
    .data as unknown as {
    success: boolean;
    message?: string;
    nextStep?: string;
  };
};

export const submitOnboardingData = async (data: {
  accountType: "firm_admin";
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    jobTitle?: string;
  };
  firmDetails: {
    firmName: string;
    firmEmail: string;
    firmPhoneNumber: string;
    address: string;
    city: string;
    state: string;
    zipcode: string;
    website?: string;
    taxId: string;
  };
  organizationId: string;
}) => {
  return (await API.post("/onboarding/submit", data)).data;
};
