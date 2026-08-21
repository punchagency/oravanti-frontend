import { useHasPermission } from "@/hooks/use-has-permission";

/** Gates lead viewing against the `leads:read` grant. */
export function useCanReadLeads(): boolean {
  return useHasPermission("leads", "read");
}
