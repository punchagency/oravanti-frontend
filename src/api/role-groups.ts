import { API } from ".";

export interface RoleGroupSummary {
  id: string;
  name: string;
  description: string;
  roles: string[];
  memberCount: number;
  createdAt: string;
}

export interface RoleGroupDetail extends RoleGroupSummary {
  members: {
    groupMembershipId: string;
    memberId: string;
    userId: string;
    directRoles: string;
    addedAt: string;
  }[];
}

export interface RoleGroupsQuery {
  q?: string;
  page?: number;
  limit?: number;
}

export interface RoleGroupsPage {
  groups: RoleGroupSummary[];
  total: number;
}

export async function getRoleGroups(
  params: RoleGroupsQuery = {},
): Promise<RoleGroupsPage> {
  return (await API.get("/settings/role-groups", { params })).data.data;
}

export async function getRoleGroupMemberships(): Promise<{ memberId: string; groupName: string }[]> {
  return (await API.get("/settings/role-groups/memberships")).data.data;
}

export async function getRoleGroup(groupId: string): Promise<RoleGroupDetail> {
  return (await API.get(`/settings/role-groups/${groupId}`)).data.data;
}

export async function createRoleGroup(data: {
  name: string;
  description?: string;
  roles: string[];
}): Promise<RoleGroupSummary> {
  return (await API.post("/settings/role-groups", data)).data.data;
}

export async function updateRoleGroup(
  groupId: string,
  data: { name?: string; description?: string; roles?: string[] },
): Promise<RoleGroupSummary> {
  return (await API.patch(`/settings/role-groups/${groupId}`, data)).data.data;
}

export async function deleteRoleGroup(groupId: string): Promise<void> {
  await API.delete(`/settings/role-groups/${groupId}`);
}

export async function addMemberToGroup(
  groupId: string,
  memberId: string,
): Promise<{ id: string; groupId: string; memberId: string }> {
  return (await API.post(`/settings/role-groups/${groupId}/members`, { memberId })).data.data;
}

export async function removeMemberFromGroup(
  groupId: string,
  memberId: string,
): Promise<void> {
  await API.delete(`/settings/role-groups/${groupId}/members/${memberId}`);
}
