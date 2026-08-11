import { API } from "./index";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ConvertedClientCase {
  id: string;
  caseNumber: string;
  status: string;
  createdAt: string;
}

export interface ConvertedClient {
  id: string;
  entityType: string;
  displayName: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  clientCreatedAt: string;
  // Lead origin
  leadId: string;
  leadSource: string;
  leadCreatedAt: string;
  leadStatus: string;
  practiceAreaId: string | null;
  practiceAreaName: string | null;
  caseTypeId: string | null;
  caseTypeName: string | null;
  attorneyFirstName: string | null;
  attorneyLastName: string | null;
  convertedAt: string | null;
  convertedCaseId: string | null;
  // Cases
  cases: ConvertedClientCase[];
  // Portal
  userId: string | null;
  hasPortalAccess: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  activeSessions: number;
}

export interface PortalStatus {
  hasAccount: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  activeSessionCount: number;
  accountStatus: "invited" | "active" | "never_invited";
}

export interface PortalSession {
  id: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface ConvertedClientsResponse {
  data: ConvertedClient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface GetConvertedClientsParams {
  search?: string;
  practiceAreaId?: string;
  portalStatus?: string;
  page?: number;
  limit?: number;
  all?: boolean;
}

// ─── API Functions ──────────────────────────────────────────────────────────

export async function getConvertedClients(
  params: GetConvertedClientsParams = {},
): Promise<ConvertedClientsResponse> {
  const query: Record<string, string> = {};
  if (params.search) query.search = params.search;
  if (params.practiceAreaId) query.practiceAreaId = params.practiceAreaId;
  if (params.portalStatus) query.portalStatus = params.portalStatus;
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);
  if (params.all) query.all = "true";

  const res = await API.get("/clients/converted", { params: query });
  return res.data;
}

export async function getConvertedClientDetail(
  id: string,
): Promise<ConvertedClient> {
  const res = await API.get(`/clients/converted/${id}`);
  return res.data.data;
}

export async function sendClientPortalInvite(
  id: string,
): Promise<{ invited: boolean; sentAt: string; email: string }> {
  const res = await API.post(`/clients/${id}/invite`);
  return res.data.data;
}

export async function resendClientPortalInvite(
  id: string,
): Promise<{ invited: boolean; sentAt: string }> {
  const res = await API.post(`/clients/${id}/invite`);
  return res.data.data;
}

export async function resetClientPassword(
  id: string,
): Promise<{ resetSent: boolean; sentAt: string }> {
  const res = await API.post(`/clients/${id}/reset-password`);
  return res.data.data;
}

export async function getClientPortalSessions(
  id: string,
): Promise<PortalSession[]> {
  const res = await API.get(`/clients/${id}/sessions`);
  return res.data.data;
}

export async function revokeClientSession(
  clientId: string,
  token: string,
): Promise<{ revoked: boolean }> {
  const res = await API.delete(
    `/clients/${clientId}/sessions/${token}`,
  );
  return res.data.data;
}

export async function getClientPortalStatus(
  id: string,
): Promise<PortalStatus> {
  const res = await API.get(`/clients/${id}/portal-status`);
  return res.data.data;
}

// ─── Labels ─────────────────────────────────────────────────────────────────

export const leadSourceLabels: Record<string, string> = {
  education_flywheel: "Education flywheel",
  referral: "Referral",
  direct: "Direct",
  walk_in: "Walk in",
  phone_enquiry: "Phone enquiry",
  client_portal: "Client portal",
};

export const portalStatusLabel: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "green" },
  invited: { label: "Invited", color: "yellow" },
  never_invited: { label: "No access", color: "gray" },
};

// ─── Client Profile ─────────────────────────────────────────────────────────

export interface ClientProfile {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  entityType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export async function getClientProfile(): Promise<ClientProfile> {
  const res = await API.get("/clients/profile");
  return res.data.data;
}

export type UpdateClientProfileInput = Partial<{
  firstName: string;
  lastName: string;
  phone: string | null;
}>;

export async function updateClientProfile(
  input: UpdateClientProfileInput,
): Promise<ClientProfile> {
  const res = await API.patch("/clients/profile", input);
  return res.data.data;
}

export async function uploadClientAvatar(file: File): Promise<void> {
  const formData = new FormData();
  formData.append("avatar", file);
  await API.post("/clients/profile/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}
