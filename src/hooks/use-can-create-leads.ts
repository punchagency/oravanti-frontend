import { useHasPermission } from "@/hooks/use-has-permission";

/** Gates lead creation UI against the `leads:create` grant. */
export function useCanCreateLeads(): boolean {
  return useHasPermission("leads", "create");
}
