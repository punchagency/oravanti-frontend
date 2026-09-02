/**
 * Maps route prefixes to the grant(s) required to view them.
 * Used by `RequirePermission` (route wrapper) and the sidebar nav
 * to hide links the user can't access.
 *
 * The first matching prefix wins. A route with no entry is public to
 * all authenticated staff (e.g. profile, dashboard — unless explicitly
 * gated here).
 *
 * Values are a single `"resource:action"` or an array (any-of logic).
 */

export type RoutePermission = string | string[];

export const ROUTE_PERMISSIONS: Record<string, RoutePermission> = {
  // ── Dashboard ──
  "/": "dashboard:read",

  // ── Leads (intake) ──
  "/leads": "leads:read",
  // Longest-prefix wins, so this beats "/leads" above. The queue is scoped to
  // the caller server-side and would simply be empty for anyone else — but an
  // always-empty nav item is a question every receptionist asks once.
  "/leads/awaiting-signature": "fee_agreements:sign",

  // ── Cases ──
  "/cases": "cases:read",

  // ── Calendar ──
  "/calendar": "calendar:read",

  // ── AI Review ──
  "/ai-review": "ai_review:read",

  // ── Staff Management ──
  "/staff-management": "staffs:read",

  // ── Billing & Finance ──
  "/finance": "finance:read",

  // ── Analytics ──
  "/analytics": "analytics:read",

  // ── Settings ──
  // Viewing RBAC only requires `ac:read`; actually managing roles/groups is
  // separately locked to the owner/admin roles server-side regardless of
  // `ac:*` grants (see `requireOwnerOrAdmin` in oravanti-be).
  "/settings/rbac": "ac:read",
  "/settings/audit-trail": "audit:read",
  "/settings/firm-settings": "firm_settings:read",
  // The intake checklist is gated on `workflow`, not `firm_settings`: it is the
  // intake twin of the case workflow template, and a firm that lets someone
  // shape its process has not thereby let them change its billing.
  "/settings/intake-checklist": "workflow:read",
};

/**
 * Returns the required permission(s) for a given pathname, or null if
 * the route has no explicit permission requirement.
 */
export function permissionForPath(
  pathname: string,
): RoutePermission | null {
  // Normalise trailing slash
  const path = pathname.replace(/\/+$/, "") || "/";

  // Exact match first, then longest-prefix match
  if (ROUTE_PERMISSIONS[path]) return ROUTE_PERMISSIONS[path];

  const segments = path.split("/");
  // Try successively shorter prefixes: /settings/firm-settings/billing → /settings/firm-settings → /settings
  for (let i = segments.length - 1; i > 0; i--) {
    const prefix = segments.slice(0, i).join("/") || "/";
    if (ROUTE_PERMISSIONS[prefix]) return ROUTE_PERMISSIONS[prefix];
  }

  return null;
}
