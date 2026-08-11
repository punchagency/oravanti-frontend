const MAX_REDIRECT_LENGTH = 2048;

/**
 * Reads and validates the `?redirect=` search param. Returns a safe, same-origin
 * absolute path (e.g. `/settings/email-accounts?tab=billing`) or null when the
 * param is missing or unsafe (open-redirect protection).
 *
 * The redirect lives in the URL — not sessionStorage/app state — so it is tied
 * to this specific login attempt and can never leak into a later sign-in as a
 * different account.
 */
export function getSafeRedirectPath(searchParams: URLSearchParams): string | null {
  const redirect = searchParams.get("redirect");
  if (!redirect) return null;
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return null;
  if (redirect.length > MAX_REDIRECT_LENGTH) return null;
  // Never bounce straight back into the login flow.
  if (redirect === "/login" || redirect.startsWith("/login?")) return null;
  return redirect;
}

/**
 * Builds a URL for `path` that carries the caller's `?redirect=` along, e.g.
 * the 2FA step so the original destination survives the extra auth step.
 */
export function buildRedirectedPath(
  path: string,
  searchParams: URLSearchParams,
): string {
  const redirect = getSafeRedirectPath(searchParams);
  return redirect ? `${path}?redirect=${encodeURIComponent(redirect)}` : path;
}
