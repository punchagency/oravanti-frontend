import { API } from ".";

export type FirmProfile = {
  id: string;
  organizationId: string;
  firmLegalName: string;
  displayName: string;
  tagline: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  timezone: string;
  country: string;
  barNumber: string | null;
  jurisdiction: string | null;
  practiceType: string | null;
  foundedYear: number | null;
  createdAt: string;
  updatedAt: string;
};

export type FirmSnapshot = {
  logoUrl: string | null;
  plan: string;
  activeAddons: number;
  staffCount: number;
  foundedYear: number | null;
  jurisdiction: string | null;
};

export type FirmProfileInput = {
  firmLegalName: string;
  displayName: string;
  tagline?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  timezone?: string;
  country?: string;
  barNumber?: string | null;
  jurisdiction?: string | null;
  practiceType?: string | null;
  foundedYear?: number | null;
};

export async function getFirmProfile() {
  const { data } = await API.get<{ data: FirmProfile }>(
    "/settings/firm-profile",
  );
  return data.data;
}

export async function updateFirmProfile(input: FirmProfileInput) {
  const { data } = await API.put<{ data: FirmProfile }>(
    "/settings/firm-profile",
    input,
  );
  return data.data;
}

export async function getFirmSnapshot() {
  const { data } = await API.get<{ data: FirmSnapshot }>(
    "/settings/firm-profile/snapshot",
  );
  return data.data;
}

export async function exportFirmData() {
  const { data } = await API.post<{ data: { downloadUrl: string } }>(
    "/settings/firm-profile/export",
  );
  return data.data;
}

export async function deleteFirmAccount() {
  const { data } = await API.delete<{ data: null }>(
    "/settings/firm-profile",
  );
  return data;
}

// ── Notification Settings ────────────────────────────────────────────────────

export type NotificationEventKey =
  | "new_lead_submitted"
  | "case_stage_changed"
  | "deadline_approaching"
  | "rfe_noid_received"
  | "invoice_due"
  | "payment_received"
  | "staff_leave_request"
  | "document_uploaded"
  | "client_message_received"
  | "certification_expiring";

export type NotificationChannel = "email" | "sms" | "inApp";

export type NotificationPreference = {
  event: NotificationEventKey;
  label: string;
  email: boolean;
  sms: boolean;
  inApp: boolean;
};

export type FirmNotificationSettings = {
  id: string;
  organizationId: string;
  preferences: NotificationPreference[];
  updatedAt: string | null;
};

export type FirmNotificationSettingsInput = {
  preferences: NotificationPreference[];
};

export async function getNotificationSettings() {
  const { data } = await API.get<{ data: FirmNotificationSettings }>(
    "/settings/notifications",
  );
  return data.data;
}

export async function updateNotificationSettings(
  input: FirmNotificationSettingsInput,
) {
  const { data } = await API.put<{ data: FirmNotificationSettings }>(
    "/settings/notifications",
    input,
  );
  return data.data;
}
