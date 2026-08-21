import { useHasPermission } from "@/hooks/use-has-permission";

/** Gates firm settings editing against the `firm_settings:update` grant. */
export function useCanUpdateFirmSettings(): boolean {
  return useHasPermission("firm_settings", "update");
}
