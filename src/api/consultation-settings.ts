import { API } from ".";

/**
 * The structures a firm can choose.
 *
 * `waived_if_retainer` is gone from this union on purpose. The database enum
 * still holds it, but the API normalises it to `flat` on read and rejects it on
 * write, so nothing here can ever see it — and narrowing the union makes the
 * compiler, rather than a grep, the checklist for the branches that handled it.
 */
export type ConsultationFeeStructure = "flat" | "custom_per_case_type";

/** WHEN the fee is collected, as distinct from what it costs. */
export type ConsultationFeeSchedule =
  | "full_upfront"
  | "partial_upfront"
  | "after_consultation";

/** What happens to the fee when the lead does not turn up. */
export type ConsultationNoShowPolicy = "forfeit" | "refund" | "decide";

/**
 * How the deposit's balance due date is decided.
 *
 * `custom` means per CONSULTATION — the scheduling wizard offers the number,
 * defaulting to the firm's — not per case type. There is no per-case-type
 * storage anywhere in the system.
 */
export type ConsultationBalanceDueMode = "fixed" | "custom";

export type ConsultationSettings = {
  organizationId: string;
  chargesFee: boolean;
  defaultAmount: number | null;
  feeStructure: ConsultationFeeStructure | null;
  feeSchedule: ConsultationFeeSchedule;
  upfrontPercent: number | null;
  balanceDueMode: ConsultationBalanceDueMode | null;
  /** Days after the consultation. */
  balanceDueDays: number | null;
  noShowPolicy: ConsultationNoShowPolicy;
  timezone: string;
  smsEnabled: boolean;
  updatedAt: string | null;
};

export type UpsertConsultationSettingsInput = {
  chargesFee: boolean;
  defaultAmount?: number | null;
  feeStructure?: ConsultationFeeStructure | null;
  feeSchedule?: ConsultationFeeSchedule;
  upfrontPercent?: number | null;
  balanceDueMode?: ConsultationBalanceDueMode | null;
  balanceDueDays?: number | null;
  noShowPolicy?: ConsultationNoShowPolicy;
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
