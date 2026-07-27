import { useAuthStore } from "@/store/auth-store";
import type { MemberRole } from "@/types/auth";

const CONFIGURE_ROLES: MemberRole[] = ["owner", "admin"];

/**
 * UI-only gate for the AI review settings screen. Mirrors the backend
 * `case_review: ["configure"]` grant (owner + admin), which is the real
 * enforcement point — attorneys and paralegals get read-only access to the
 * dashboard and never see settings.
 */
export function useCanConfigureCaseReview(): boolean {
  const memberRole = useAuthStore((state) => state.memberRole);
  return memberRole != null && CONFIGURE_ROLES.includes(memberRole);
}
