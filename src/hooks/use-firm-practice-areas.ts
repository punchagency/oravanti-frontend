import { API } from "@/api";
import { useQuery } from "@tanstack/react-query";

export interface FirmPracticeArea {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  subcategories: Array<{
    id: string;
    code: string;
    name: string;
    caseTypes: Array<{
      id: string;
      code: string;
      name: string;
      caseNumberPrefix: string;
      jurisdiction: string;
      createdAt: string;
      updatedAt: string;
    }>;
  }>;
  subscription: {
    id: string;
    firmPracticeAreaId: string;
    active: boolean;
    status: string;
    billingCycle: string;
    startsAt: string;
    expiresAt: string;
    cancelledAt: string | null;
    paymentProvider: string;
    providerSubscriptionId: string;
    createdAt: string;
  } | null;
}

export function useFirmPracticeAreas() {
  return useQuery({
    queryKey: ["firm-practice-areas"],
    queryFn: async (): Promise<FirmPracticeArea[]> => {
      const response = await API.get("/practice-areas/firm");
      return Array.isArray(response.data) ? response.data : (response.data?.data ?? []);
    },
  });
}
