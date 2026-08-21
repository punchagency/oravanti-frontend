import { useHasPermission } from "@/hooks/use-has-permission";

/** Gates conflict-check review UI against the `conflicts:review` grant. */
export function useCanReviewConflicts(): boolean {
  return useHasPermission("conflicts", "review");
}
