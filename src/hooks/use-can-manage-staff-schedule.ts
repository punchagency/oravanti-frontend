import { useAuthStore } from "@/store/auth-store";
import type { MemberRole } from "@/types/auth";

const MANAGE_ROLES: MemberRole[] = ["owner", "admin"];

/**
 * UI-only convenience gate for staff schedule management. The backend
 * `staffs` create/update/delete permissions are the real enforcement point —
 * non-permitted users still see the schedule read-only.
 */
export function useCanManageStaffSchedule(): boolean {
  const memberRole = useAuthStore((state) => state.memberRole);
  return memberRole != null && MANAGE_ROLES.includes(memberRole);
}
