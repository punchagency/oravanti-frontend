import { API } from ".";
import type { StaffMemberDTO } from "@/hooks/use-staff-list";

export interface GetStaffListParams {
  search?: string;
  role?: string;
  team?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface StatusCounts {
  active: number;
  onLeave: number;
  recertifyRequired: number;
  pendingInvitation: number;
}

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
}

export interface GetStaffListResponse {
  data: StaffMemberDTO[];
  counts: StatusCounts;
  pagination: PaginationMeta;
}

export interface InviteStaffPayload {
  firstName: string;
  lastName: string;
  email: string;
  orgEmail?: string;
  phone?: string;
  role: string;
  startDate?: string;
  maxCaseload?: number;
  practiceAreaIds?: string[];
  teamIds?: string[];
}

export async function getStaffList(
  params?: GetStaffListParams,
): Promise<GetStaffListResponse> {
  const response = await API.get("/organization/staff", { params });
  return response.data;
}

export async function inviteStaff(data: InviteStaffPayload) {
  return API.post("/organization/invite", data);
}

export interface InvitationDTO {
  id: string;
  email: string;
  role: string;
  status: string;
  organizationId: string;
  expiresAt: string | null;
  createdAt: string;
  inviterId: string;
  firstName: string | null;
  lastName: string | null;
  invitedBy: string | null;
  invitedByEmail: string | null;
  practiceAreas: { id: string; name: string }[];
  team: string;
}

export interface InvitationCounts {
  pending: number;
  accepted: number;
  rejected: number;
  canceled: number;
}

export interface GetInvitationsResponse {
  data: InvitationDTO[];
  counts: InvitationCounts;
  pagination: PaginationMeta;
}

export interface GetInvitationsParams {
  search?: string;
  role?: string;
  team?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function getInvitations(
  params?: GetInvitationsParams,
): Promise<GetInvitationsResponse> {
  const response = await API.get("/organization/invitations", { params });
  return response.data;
}

export async function cancelInvitation(invitationId: string) {
  return API.post("/organization/cancel-invitation", { invitationId });
}

export async function resendInvitation(email: string, role: string) {
  return API.post("/organization/resend-invitation", { email, role });
}

export interface UpdateStaffPayload {
  phone?: string;
  jobTitle?: string;
  maxCaseload?: number;
  startDate?: string;
  email?: string;
  orgEmail?: string;
  firstName?: string;
  lastName?: string;
  practiceAreaIds?: string[];
  teamIds?: string[];
}

export async function updateStaff(staffId: string, data: UpdateStaffPayload) {
  return API.patch(`/organization/staff/${staffId}`, data);
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  organizationId: string;
  organizationName: string;
  inviterId: string;
  inviterName: string;
  inviterEmail: string;
}

export async function getMyPendingInvitation(): Promise<{
  invitation: PendingInvitation | null;
}> {
  const response = await API.get("/organization/my-pending-invitation");
  return response.data;
}

export async function acceptInvitation(invitationId: string) {
  const response = await API.post("/organization/accept-invite", {
    invitationId,
  });
  return response.data;
}

export async function setPassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const response = await API.post("/organization/set-password", data);
  return response.data;
}

export interface NeedsSetupResponse {
  needsAcceptInvitation: boolean;
  needsPasswordChange: boolean;
}

export async function getNeedsSetup(): Promise<NeedsSetupResponse> {
  const response = await API.get("/organization/needs-setup");
  return response.data;
}

export interface TeamListDTO {
  id: string;
  name: string;
  description: string | null;
  leadId: string | null;
  leadName: string | null;
  leadRole: string | null;
  maxCaseload: number;
  workloadPercentage: number;
  status: string;
  activeCases: number;
  memberCount: number;
  createdAt: string;
}

export interface TeamDTO extends TeamListDTO {
  practiceAreas: { id: string; name: string }[];
  members: {
    id: string;
    firstName: string;
    lastName: string;
    role: string | null;
    status: string;
  }[];
}

export interface TeamCounts {
  totalTeams: number;
  activeMembers: number;
  atCapacity: number;
  practiceAreasCovered: number;
}

export interface GetTeamsListParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface GetTeamsListResponse {
  data: TeamListDTO[];
  counts: TeamCounts;
  pagination: PaginationMeta;
}

export async function getTeamsList(
  params?: GetTeamsListParams,
): Promise<GetTeamsListResponse> {
  const response = await API.get("/organization/teams", { params });
  return response.data;
}

export async function updateStaffRole(
  staffId: string,
  role: string,
): Promise<void> {
  await API.patch(`/organization/staff/${staffId}/role`, { role });
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
  leadId?: string;
  maxCaseload?: number;
  practiceAreaIds?: string[];
  memberStaffIds?: string[];
}

export async function createTeam(
  data: CreateTeamPayload,
): Promise<{ id: string; name: string }> {
  const response = await API.post("/organization/teams", data);
  return response.data;
}

export async function deleteTeam(teamId: string): Promise<void> {
  await API.delete(`/organization/teams/${teamId}`);
}

export async function removeStaff(staffId: string): Promise<void> {
  await API.delete(`/organization/staff/${staffId}`);
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string;
  maxCaseload?: number;
  leadId?: string | null;
  practiceAreaIds?: string[];
}

export async function updateTeam(
  teamId: string,
  data: UpdateTeamPayload,
): Promise<void> {
  await API.patch(`/organization/teams/${teamId}`, data);
}

export async function addTeamMembers(
  teamId: string,
  staffIds: string[],
): Promise<void> {
  await API.post(`/organization/teams/${teamId}/members`, { staffIds });
}

export async function removeTeamMember(
  teamId: string,
  memberId: string,
): Promise<void> {
  await API.delete(`/organization/teams/${teamId}/members/${memberId}`);
}

export type TeamDetailsDTO = TeamDTO;

export async function getTeamDetails(
  teamId: string,
): Promise<TeamDetailsDTO> {
  const response = await API.get(`/organization/teams/${teamId}`);
  return response.data;
}
