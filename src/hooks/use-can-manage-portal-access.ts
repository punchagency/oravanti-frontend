import { useHasPermission } from "@/hooks/use-has-permission";

/** Gates staff portal-access management (enable/disable) against the
 * `portal:update` grant. */
export function useCanManagePortalAccess(): boolean {
  return useHasPermission("portal", "update");
}
