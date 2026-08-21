import { useHasPermission } from "@/hooks/use-has-permission";

/** Gates firm settings viewing against the `firm_settings:read` grant. */
export function useCanReadFirmSettings(): boolean {
  return useHasPermission("firm_settings", "read");
}
