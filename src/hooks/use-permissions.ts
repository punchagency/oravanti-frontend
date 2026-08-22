import { useAuthStore } from "@/store/auth-store";

/**
 * Centralised permission checking. One hook, all grants — no per-page
 * hook proliferation. Returns helpers that read the flat `grants`
 * string[] already resolved server-side on the session.
 *
 * Usage:
 *   const { can, hasAny, hasAll } = usePermissions();
 *   if (can("leads", "create")) { … }
 *   if (hasAny(["leads:read", "cases:read"])) { … }
 */
export function usePermissions() {
  const grants = useAuthStore((s) => s.grants);

  /** Does the user hold `resource:action`? */
  const can = (resource: string, action: string): boolean =>
    grants.includes(`${resource}:${action}`);

  /** Does the user hold *any* of the listed grants? */
  const hasAny = (pairs: string[]): boolean =>
    pairs.some((p) => grants.includes(p));

  /** Does the user hold *all* of the listed grants? */
  const hasAll = (pairs: string[]): boolean =>
    pairs.every((p) => grants.includes(p));

  /** Raw grants list — escape hatch for custom logic. */
  const list = grants;

  return { can, hasAny, hasAll, list } as const;
}
