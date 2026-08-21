import { API } from ".";

export interface RoleSummary {
  name: string;
  label: string;
  description: string;
  locked: boolean;
  isDefault: boolean;
  staffCount: number;
  grants: Record<string, string[]>;
  color: string | null;
}

export interface PermissionsMatrix {
  resources: Record<string, readonly string[]>;
  roles: RoleSummary[];
}

export interface RoleOption {
  name: string;
  label: string;
}

/** Server-side search/filter/pagination for the roles list. */
export interface RolesQuery {
  q?: string;
  /** "default" = shipped roster (incl. owner/admin); "custom" = firm-created. */
  type?: "all" | "default" | "custom";
  page?: number;
  limit?: number;
}

export interface RolesPage {
  roles: RoleSummary[];
  /** Count AFTER filtering, BEFORE pagination — what the pager renders. */
  total: number;
}

/**
 * Search, type-filtering, and pagination all happen on the backend. Omit
 * `page`/`limit` to get every matching role (pickers do this and ignore
 * `total`).
 */
export async function getRoles(params: RolesQuery = {}): Promise<RolesPage> {
  return (await API.get("/settings/roles-permissions/roles", { params })).data.data;
}

/**
 * Name + label only — for role-assignment dropdowns outside the RBAC admin
 * page (invite staff, edit staff). Use `getRoles` only on the roles &
 * permissions page itself; this one is far cheaper and doesn't require the
 * `ac:read` permission most staff lack.
 */
export async function getRoleOptions(): Promise<RoleOption[]> {
  return (await API.get("/settings/roles-permissions/role-options")).data.data;
}

export async function getPermissionsMatrix(): Promise<PermissionsMatrix> {
  return (await API.get("/settings/roles-permissions/matrix")).data.data;
}

export async function createRole(data: {
  role: string;
  permission: Record<string, string[]>;
  description?: string;
  color?: string;
}): Promise<void> {
  await API.post("/settings/roles-permissions/roles", data);
}

export async function updateRole(
  roleName: string,
  permission: Record<string, string[]>,
  label?: string,
  description?: string,
): Promise<void> {
  await API.patch(`/settings/roles-permissions/roles/${roleName}`, {
    permission,
    ...(label !== undefined && { label }),
    ...(description !== undefined && { description }),
  });
}

export async function deleteRole(roleName: string): Promise<void> {
  await API.delete(`/settings/roles-permissions/roles/${roleName}`);
}

export async function resetRole(roleName: string): Promise<void> {
  await API.post(`/settings/roles-permissions/roles/${roleName}/reset`);
}

export async function setRoleColor(roleName: string, color: string): Promise<void> {
  await API.patch(`/settings/roles-permissions/roles/${roleName}/color`, { color });
}

export async function getMyGrants(): Promise<string[]> {
  return (await API.get("/settings/roles-permissions/my-grants")).data.data;
}
