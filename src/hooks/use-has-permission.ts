import { useAuthStore } from "@/store/auth-store";

/**
 * Whether the signed-in user's role(s) grant `resource:action`, per the
 * flattened `grants` list resolved server-side on the session (see
 * `customSession` in oravanti-be/src/auth/index.ts). Synchronous — no
 * network round trip per check. This is a UI convenience, not the real
 * enforcement point; the backend's `requirePermission`/`requireResource`
 * gate the actual request.
 */
export function useHasPermission(resource: string, action: string): boolean {
  const grants = useAuthStore((state) => state.grants);
  return grants.includes(`${resource}:${action}`);
}

/** Non-hook form for use outside components (e.g. inside another hook's body). */
export function can(grants: string[], resource: string, action: string): boolean {
  return grants.includes(`${resource}:${action}`);
}
