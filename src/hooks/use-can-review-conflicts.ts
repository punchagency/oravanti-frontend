import { useAuthStore } from "@/store/auth-store";
import type { MemberRole } from "@/types/auth";

const REVIEW_ROLES: MemberRole[] = ["owner", "admin"];

/**
 * UI-only convenience gate for conflict-check review. The backend
 * `conflicts:review` permission is the real enforcement point — non-permitted
 * users still see the conflict read-only.
 */
export function useCanReviewConflicts(): boolean {
  const memberRole = useAuthStore((state) => state.memberRole);
  return memberRole != null && REVIEW_ROLES.includes(memberRole);
}
