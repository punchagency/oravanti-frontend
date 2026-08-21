import { useHasPermission } from "@/hooks/use-has-permission";

/** Gates staff performance/PIP viewing against the `staffs:view_performance` grant. */
export function useCanViewStaffPerformance(): boolean {
  return useHasPermission("staffs", "view_performance");
}
