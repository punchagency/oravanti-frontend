import { API } from ".";

export type ConsultationFeeStructure =
  | "flat"
  | "custom_per_case_type"
  | "waived_if_retainer";

export type ConsultationSettings = {
  organizationId: string;
  chargesFee: boolean;
  defaultAmount: number | null;
  feeStructure: ConsultationFeeStructure | null;
  waiverWindowDays: number | null;
  timezone: string;
  smsEnabled: boolean;
  updatedAt: string | null;
};

export type UpsertConsultationSettingsInput = {
  chargesFee: boolean;
  defaultAmount?: number | null;
  feeStructure?: ConsultationFeeStructure | null;
  waiverWindowDays?: number | null;
  timezone?: string;
  smsEnabled?: boolean;
};

export type ConsultationLocation = {
  id: string;
  organizationId: string;
  label: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ConsultationLocationInput = {
  label: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
};

export async function getConsultationSettings() {
  const { data } = await API.get<{ data: ConsultationSettings }>(
    "/settings/consultation",
  );
  return data.data;
}

export async function updateConsultationSettings(
  input: UpsertConsultationSettingsInput,
) {
  const { data } = await API.put<{ data: ConsultationSettings }>(
    "/settings/consultation",
    input,
  );
  return data.data;
}

export async function getConsultationLocations() {
  const { data } = await API.get<{ data: ConsultationLocation[] }>(
    "/settings/consultation/locations",
  );
  return data.data;
}

export async function createConsultationLocation(
  input: ConsultationLocationInput,
) {
  const { data } = await API.post<{ data: ConsultationLocation }>(
    "/settings/consultation/locations",
    input,
  );
  return data.data;
}

export async function updateConsultationLocation(
  id: string,
  input: Partial<ConsultationLocationInput> & { isActive?: boolean },
) {
  const { data } = await API.patch<{ data: ConsultationLocation }>(
    `/settings/consultation/locations/${id}`,
    input,
  );
  return data.data;
}

export async function deleteConsultationLocation(id: string) {
  const { data } = await API.delete<{ data: null }>(
    `/settings/consultation/locations/${id}`,
  );
  return data;
}
