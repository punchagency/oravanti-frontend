// Top-level prefixes for routes that live in the authenticated routers
// (admin + client portal). The public router's catch-all uses them to tell a
// "real app route behind login" apart from "no such path in the app" while the
// user is not signed in.
export const KNOWN_PROTECTED_PATH_PREFIXES = [
  "/onboarding",
  "/dashboard",
  "/settings",
  "/profile",
  "/leads",
  "/intake",
  "/cases",
  "/documents",
  "/calendar",
  "/ai-review",
  "/staff-management",
  "/staff",
  "/finance",
  "/analytics",
  "/case-files",
  "/timeline",
  "/appointments",
  "/payments",
  "/messages",
  "/resources",
] as const;

export function isKnownProtectedPath(pathname: string): boolean {
  return KNOWN_PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
