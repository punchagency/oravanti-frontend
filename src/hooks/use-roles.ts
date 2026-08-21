import {
  getRoles,
  getRoleOptions,
  type RolesPage,
  type RolesQuery,
  type RoleOption,
} from "@/api/roles-permissions";
import { useQuery } from "@tanstack/react-query";

/**
 * Role summaries (grants, staffCount, color) — the RBAC admin page. Pass
 * `params` for server-side search/filter/pagination; omit it for the full
 * list (pickers, assignment tables).
 */
export function useRoles(params: RolesQuery = {}) {
  return useQuery<RolesPage>({
    queryKey: ["roles", params],
    queryFn: () => getRoles(params),
    staleTime: Infinity,
  });
}

/** Name + label only, for role-assignment dropdowns elsewhere (invite/edit staff). */
export function useRoleOptions() {
  return useQuery<RoleOption[]>({
    queryKey: ["role-options"],
    queryFn: getRoleOptions,
    staleTime: Infinity,
  });
}
