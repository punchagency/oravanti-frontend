import { useHasPermission } from "@/hooks/use-has-permission";

/** Gates staff schedule management UI against the `staffs:update` grant. */
export function useCanManageStaffSchedule(): boolean {
  return useHasPermission("staffs", "update");
}
