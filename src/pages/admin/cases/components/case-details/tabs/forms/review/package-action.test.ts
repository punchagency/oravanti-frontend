import { describe, expect, it } from "vitest";

import type { FilingReview } from "@/api/case-details";
import { packageAction } from "./package-action";

/*
  Who is offered what, and when approval is possible.

  These assertions used to live in `review-panel.test.tsx`, against the two
  buttons the panel carried. The buttons moved up to the tab's header — one
  solid action for the package, with the rest behind the ⋮ — and the rule came
  out with them rather than being re-asserted through a mounted tab, which would
  mean mocking eight hooks to test four branches.

  The rules are enforced on the server too: `form-review.service.ts` refuses an
  approval over open corrections. This is about what the screen offers, and the
  reason it is worth its own test is the one the Forms tab already argues — a
  control that 403s is a promise the app cannot keep, and the person it lies to
  is a partner in a hurry.

  `canReview` is the server's answer to "is this person an attorney", because
  the role is spelled three different ways in real data.
*/

const review = (over: Partial<FilingReview> = {}): FilingReview => ({
  status: "in_review",
  approvedAt: null,
  approvedByName: null,
  openCount: 0,
  corrections: [],
  canReview: true,
  ...over,
});

describe("the one action a filing package offers", () => {
  it("offers Approve to an attorney it is with", () => {
    expect(packageAction(review())).toEqual({
      kind: "approve",
      label: "Approve filing",
      isDisabled: false,
    });
  });

  it("offers nobody else an approval, whatever the state", () => {
    expect(packageAction(review({ canReview: false }))!.kind).toBe("request");
  });

  it("will not let an attorney approve over an open correction", () => {
    expect(packageAction(review({ openCount: 1 }))!.isDisabled).toBe(true);
  });

  /*
    An attorney looking at a package nobody has sent yet is not approving it —
    there is nothing to approve. They see the same verb the team does.
  */
  it("offers an attorney the send, on a package still in preparation", () => {
    const action = packageAction(review({ status: "in_preparation" }));
    expect(action).toMatchObject({ kind: "request", label: "Send for review" });
  });

  it("says a second send is a reminder", () => {
    // "Send for review" on a package already with the reviewer reads as though
    // the first one did not go.
    expect(packageAction(review({ canReview: false }))!.label).toBe(
      "Nudge the reviewer",
    );
  });

  it("offers nothing once it is approved", () => {
    // The work from here is per-form — marking one ready to file — and a
    // package-level button would have nothing left to do.
    expect(packageAction(review({ status: "approved" }))).toBeNull();
  });
});
