import { useAuthStore } from "@/store/auth-store";
import type { MemberRole } from "@/types/auth";

const DOWNLOAD_ROLES: MemberRole[] = ["owner", "admin", "attorney"];

/**
 * UI-only convenience gate for downloading client documents. The backend
 * `documents:download` permission is the real enforcement point — non-permitted
 * users simply don't see the download control.
 */
export function useCanDownloadDocuments(): boolean {
  const memberRole = useAuthStore((state) => state.memberRole);
  return memberRole != null && DOWNLOAD_ROLES.includes(memberRole);
}
