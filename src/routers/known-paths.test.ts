import { describe, expect, it } from "vitest";
import type { RouteObject } from "react-router";
import { createAdminRouter } from "./admin";
import { createClientPortalRouter } from "./client";
import { isKnownProtectedPath, KNOWN_PROTECTED_PATH_PREFIXES } from "./known-paths";

/*
  `known-paths.ts` is a hand-written list, and this is what keeps it honest.

  The public router's catch-all consults that list to decide whether an
  unauthenticated visit to some path is "a real app route, send them to login
  and bring them back afterwards" or "no such page, show a 404". A route added
  to the admin or client router and forgotten here does not fail anywhere — it
  just means a logged-out person opening a bookmarked /my-tasks gets a 404
  instead of a login prompt, and loses the destination they were heading to.
  That is precisely how the list came to be missing eight segments.

  It is asserted rather than derived because deriving it would mean importing
  the admin router — and every page it lazily references — into the bundle the
  public router loads, which is the one bundle that must stay small.

  Adding a top-level route? Add its first segment to
  KNOWN_PROTECTED_PATH_PREFIXES, or list it in PUBLIC_SEGMENTS below with a
  reason it must stay reachable while signed out.
*/

/**
 * Segments that appear in an authenticated router but must NOT redirect to
 * login, each for a specific reason.
 */
const PUBLIC_SEGMENTS = new Set([
  // Auth callbacks and token-gated recipient pages. The URL token is the
  // authorisation; there is deliberately no session to send anyone to log in
  // for, and redirecting would break the emailed link.
  "login",
  "two-factor",
  "email-verified",
  "verify-email",
  "accept-invitation",
  "set-password",
  "questionnaire",
  "consultation-booking",
  "sign",
  "document-upload",
  "invoice-payment",
  "portal-access-disabled",
]);

/**
 * Depth-first walk collecting every route path in a router's tree.
 *
 * The dashboard routes hang off a `path="/"` layout route, so a naive join
 * produces `//dashboard` and the segment reads as empty. Collapsing repeated
 * slashes is what makes the whole admin tree visible here rather than silently
 * contributing nothing.
 */
function collectPaths(routes: RouteObject[], parent = ""): string[] {
  const out: string[] = [];
  for (const route of routes) {
    const path = route.path ?? "";
    // A pathless layout route contributes nothing of its own but still
    // parents its children.
    const joined = path.startsWith("/") ? path : `${parent}/${path}`;
    const full = joined.replace(/\/+/g, "/");
    if (path) out.push(full);
    if (route.children?.length) out.push(...collectPaths(route.children, full));
  }
  return out;
}

/** The first path segment, which is all the prefix check ever looks at. */
function topSegment(path: string): string | null {
  const first = path.replace(/^\//, "").split("/")[0];
  if (!first || first === "*" || first.startsWith(":")) return null;
  return first;
}

const topSegmentsOf = (routes: RouteObject[]): string[] => [
  ...new Set(
    collectPaths(routes)
      .map(topSegment)
      .filter((s): s is string => s !== null),
  ),
];

describe("known protected paths", () => {
  it("covers every top-level segment the admin router declares", () => {
    const segments = topSegmentsOf(createAdminRouter().routes);
    const uncovered = segments.filter(
      (s) => !PUBLIC_SEGMENTS.has(s) && !isKnownProtectedPath(`/${s}`),
    );
    expect(uncovered).toEqual([]);
  });

  it("covers every top-level segment the client portal router declares", () => {
    const segments = topSegmentsOf(createClientPortalRouter().routes);
    const uncovered = segments.filter(
      (s) => !PUBLIC_SEGMENTS.has(s) && !isKnownProtectedPath(`/${s}`),
    );
    expect(uncovered).toEqual([]);
  });

  /*
    The other direction. A prefix left behind after its route is deleted sends
    a logged-out visitor to log in, only to land on a 404 afterwards — a worse
    outcome than the 404 they would have got straight away.
  */
  it("lists no prefix that neither router declares", () => {
    const declared = new Set([
      ...topSegmentsOf(createAdminRouter().routes),
      ...topSegmentsOf(createClientPortalRouter().routes),
    ]);
    const orphaned = KNOWN_PROTECTED_PATH_PREFIXES.filter(
      (prefix) => !declared.has(prefix.replace(/^\//, "")),
    );
    expect(orphaned).toEqual([]);
  });
});
