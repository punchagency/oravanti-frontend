import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ProfileData = {
  firstName: string;
  lastName: string;
  phone?: string;
  jobTitle?: string;
};

export type SourceData = {
  referralSource: string;
};

export type FirmDetailsData = {
  firmName: string;
  firmEmail: string;
  firmPhoneNumber: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  website: string;
  taxId: string;
};

type OnboardingStore = {
  source: SourceData | null;
  profile: ProfileData | null;
  firmDetails: FirmDetailsData | null;
  tosAccepted: boolean;
  setSource: (data: SourceData) => void;
  setProfile: (data: ProfileData) => void;
  setFirmDetails: (data: FirmDetailsData) => void;
  setTosAccepted: (accepted: boolean) => void;
  reset: () => void;
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      source: null,
      profile: null,
      firmDetails: null,
      tosAccepted: false,
      setSource: (data) => set({ source: data }),
      setProfile: (data) => set({ profile: data }),
      setFirmDetails: (data) => set({ firmDetails: data }),
      setTosAccepted: (accepted) => set({ tosAccepted: accepted }),
      reset: () =>
        set({
          source: null,
          profile: null,
          firmDetails: null,
          tosAccepted: false,
        }),
    }),
    { name: "oravanti-onboarding-storage" },
  ),
);
