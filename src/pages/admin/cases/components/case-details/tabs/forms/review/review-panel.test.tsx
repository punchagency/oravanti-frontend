import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { FilingReview, FormCorrection } from "@/api/case-details";
import { Provider } from "@/providers/provider";
import { ReviewPanel } from "./review-panel";

/*
  Who is offered what, and when approval is possible.

  The rules live on the server — `form-review.service.ts` refuses an approval
  over open corrections and refuses a mark from anybody who is not an attorney.
  These tests are about the screen, and the reason they exist separately is the
  same one the Forms tab already argues: a control that 403s is a promise the
  app cannot keep, and the person it lies to is a partner in a hurry.

  `canReview` is the server's answer to "is this person an attorney", because
  the role is spelled three different ways in real data. So the panel branches
  on that one flag, and these tests fix what each side of it sees.
*/

const correction = (over: Partial<FormCorrection> = {}): FormCorrection => ({
  id: "corr-1",
  caseFormId: "form-1",
  formCode: "I-485",
  partLabel: null,
  fieldKey: "beneficiary.family_name",
  color: "red",
  note: "Does not match the passport.",
  status: "open",
  raisedById: "staff-1",
  raisedByName: "Dana Okafor",
  raisedAt: "2026-09-01T10:00:00.000Z",
  resolvedById: null,
  resolvedByName: null,
  resolvedAt: null,
  comments: [],
  ...over,
});

const review = (over: Partial<FilingReview> = {}): FilingReview => ({
  status: "in_review",
  approvedAt: null,
  approvedByName: null,
  openCount: 0,
  corrections: [],
  canReview: true,
  ...over,
});

const open = (value: FilingReview) =>
  render(
    <Provider>
      <ReviewPanel
        review={value}
        onSelectForm={vi.fn()}
        onResolve={vi.fn()}
        onReopen={vi.fn()}
        onComment={vi.fn()}
      />
    </Provider>,
  );

/**
 * Unfold a panel that has nothing open.
 *
 * The fold follows the marks, so a review with only answered corrections — or
 * none — starts as a status line. Everything below it is still there, one
 * chevron away, which is what these tests are about.
 *
 * Through `userEvent` rather than a bare `.click()` on the node: a raw click
 * does not flush the state update it causes, so the assertion after it runs
 * against the panel as it was.
 */
const expand = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: /show the review detail/i }));

describe("what the panel offers", () => {
  /*
    Not the package's own actions.

    Approve filing and Send for review act on the whole filing, so they moved to
    the tab's header where the other package actions are — one solid button for
    whichever the person's role makes next. `package-action.test.ts` pins which
    one that is. What is asserted here is that they did not stay behind as a
    second way in: two Approve buttons on one screen is the fragmentation this
    change exists to end.
  */
  it("carries no package-level action of its own", () => {
    open(review());

    expect(
      screen.queryByRole("button", { name: /approve filing/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /send for review/i }),
    ).not.toBeInTheDocument();
  });

  /*
    A heading, a badge and a sentence, above the work, on every visit — for a
    package with nothing open to say anything about. Folded, it still answers
    where the filing stands, in the space a status line deserves.
  */
  it("folds to a status line when nothing is open", () => {
    open(review());

    expect(screen.getByText("Attorney review")).toBeInTheDocument();
    expect(screen.getByText("In review")).toBeInTheDocument();
    expect(screen.queryByText(/nothing is marked for correction/i)).toBeNull();
  });

  it("opens itself when there is a correction to read", () => {
    open(review({ openCount: 1, corrections: [correction()] }));

    expect(
      screen.getByText("Does not match the passport."),
    ).toBeInTheDocument();
  });

  it("offers Resolve on an open correction to everybody", () => {
    open(review({ canReview: false, openCount: 1, corrections: [correction()] }));

    expect(
      screen.getByRole("button", { name: /^resolve$/i }),
    ).toBeInTheDocument();
  });

  it("offers Reopen on an answered correction only to an attorney", async () => {
    const user = userEvent.setup();
    const answered = correction({
      status: "resolved",
      resolvedById: "staff-2",
      resolvedByName: "Ana Ruiz",
      resolvedAt: "2026-09-02T10:00:00.000Z",
    });

    const { unmount } = open(review({ corrections: [answered] }));
    await expand(user);
    // Answered corrections are folded away until asked for — the panel is about
    // what is still open.
    await user.click(screen.getByRole("button", { name: /show 1 answered/i }));
    expect(screen.getByRole("button", { name: /reopen/i })).toBeInTheDocument();
    unmount();

    open(review({ canReview: false, corrections: [answered] }));
    await expand(user);
    await user.click(screen.getByRole("button", { name: /show 1 answered/i }));
    expect(
      screen.queryByRole("button", { name: /reopen/i }),
    ).not.toBeInTheDocument();
  });

  it("says why nothing can be filed yet, in the state's own words", () => {
    open(review({ openCount: 2, corrections: [correction()] }));

    expect(
      screen.getByText(/2 corrections still to answer/i),
    ).toBeInTheDocument();
  });

  it("says who approved it once it is approved", async () => {
    const user = userEvent.setup();
    open(
      review({
        status: "approved",
        approvedByName: "Dana Okafor",
        approvedAt: "2026-09-02T10:00:00.000Z",
      }),
    );
    await expand(user);

    expect(screen.getByText(/approved by dana okafor/i)).toBeInTheDocument();
    // Nothing left to approve, and nothing to send.
    expect(
      screen.queryByRole("button", { name: /approve filing/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /send for review/i }),
    ).not.toBeInTheDocument();
  });
});
