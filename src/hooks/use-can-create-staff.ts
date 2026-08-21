import { useHasPermission } from "@/hooks/use-has-permission";

/**
 * Gates every "add staff" surface — inviting staff and creating teams.
 * Both actions resolve to the same server-side grant:
 * `POST /organization/invite` and `POST /organization/teams` each require
 * `staffs:create`, so hiding both triggers behind one check keeps the UI
 * in lockstep with what the backend actually enforces (no more 403s from
 * buttons a role was never allowed to use).
 */
export function useCanCreateStaff(): boolean {
  return useHasPermission("staffs", "create");
}
