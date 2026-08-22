import { useHasPermission } from "@/hooks/use-has-permission";

/** Gates analytics dashboard viewing against the `analytics:read` grant. */
export function useCanReadAnalytics(): boolean {
  return useHasPermission("analytics", "read");
}
