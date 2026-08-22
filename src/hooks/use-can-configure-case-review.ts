import { useHasPermission } from "@/hooks/use-has-permission";

/** Gates the AI review settings screen against the `case_review:configure` grant. */
export function useCanConfigureCaseReview(): boolean {
  return useHasPermission("case_review", "configure");
}
