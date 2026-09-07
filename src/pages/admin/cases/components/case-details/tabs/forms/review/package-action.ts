import type { FilingReview } from "@/api/case-details";

/**
 * The one thing the person looking at a filing package is here to do to it.
 *
 * Role-shaped rather than status-shaped: the team prepares a filing and sends
 * it, the attorney reads it and approves it. Each sees their own verb as the
 * single solid button above the forms, and everything else about the package —
 * adding a form, filling from the questionnaire, downloading it — sits behind
 * the ⋮ beside it. Five equal outline buttons across two levels is what this
 * replaces, and none of them was the obvious next thing.
 *
 * A plain function rather than logic in the tab so the rule can be read and
 * tested on its own. It carries no labels for the ⋮ items, deliberately: those
 * are always available and never the answer to "what now?".
 *
 * `canReview` is the server's answer to "is this person an attorney" — the role
 * is spelled three different ways in real data — so this branches on that one
 * flag and never on anything reconstructed locally.
 */
export type PackageAction = {
  kind: "approve" | "request";
  label: string;
  /**
   * Offered but refused, with the reason on screen beside it.
   *
   * Approval over an open correction is refused by the server too, with the
   * count in the message; this only saves the round trip. Rendering it disabled
   * rather than hiding it is the one place this file departs from "a control
   * that 403s is a promise the app cannot keep" — because here the control is
   * genuinely the next thing to do, and the panel underneath says what is in
   * the way.
   */
  isDisabled: boolean;
};

export function packageAction(review: FilingReview): PackageAction | null {
  // Nothing left to do to the package itself. From here the work is on the
  // forms — marking them ready to file, which is a per-form decision.
  if (review.status === "approved") return null;

  if (review.canReview && review.status === "in_review") {
    return {
      kind: "approve",
      label: "Approve filing",
      isDisabled: review.openCount > 0,
    };
  }

  return {
    kind: "request",
    // Sending a package that is already with the reviewer is a reminder, and
    // saying so is the difference between "did I already do this?" and knowing.
    label:
      review.status === "in_review" ? "Nudge the reviewer" : "Send for review",
    isDisabled: false,
  };
}
