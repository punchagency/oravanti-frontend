import { API } from ".";

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
}) => {
  return (await API.post("/onboarding/submit", data)).data;
};
