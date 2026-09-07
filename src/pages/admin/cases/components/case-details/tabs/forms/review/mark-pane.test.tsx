import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { CaseFormField, FormCorrection } from "@/api/case-details";
import { Provider } from "@/providers/provider";
import { MarkPane } from "./mark-pane";

/*
  The pane beside the rendered page.

  `FormReviewView` itself needs a filled PDF and pdf.js to say anything at all,
  and none of the rules worth pinning are about the raster. They are about who
  is offered what, which is the same argument the review panel and the Forms tab
  already make: a control that 403s is a promise the app cannot keep, and here
  the person it would lie to is a paralegal who thinks they have flagged a
  problem for the attorney.

  `canMark` is the server's answer to "is this person an attorney" — the role is
  spelled three different ways in real data — so the pane branches on that one
  flag and these tests fix both sides of it.

  This is also now the *only* place a mark is raised. The field list renders the
  attorney's notes and offers no way to write one, because a review is reading
  the filing as it prints. So the composer being here, and working, is the
  feature rather than a convenience.
*/

const field = (over: Partial<CaseFormField> = {}): CaseFormField => ({
  id: "field-1",
  fieldKey: "beneficiary.family_name",
  label: "Family Name (Last Name)",
  partLabel: "Part 1. Information About You",
  type: "short_text",
  helpText: null,
  config: null,
  isRequired: true,
  value: "Okonkwo",
  valueSource: "questionnaire",
  isManualOverride: false,
  conflictsWith: null,
  ...over,
});

const mark = (over: Partial<FormCorrection> = {}): FormCorrection => ({
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

const open = (props: Partial<Parameters<typeof MarkPane>[0]> = {}) =>
  render(
    <Provider>
      <MarkPane
        field={field()}
        marks={[]}
        allMarks={[]}
        canMark={false}
        hasGeometry
        onMark={vi.fn()}
        onSelect={vi.fn()}
        {...props}
      />
    </Provider>,
  );

const submit = () => screen.queryByRole("button", { name: /mark this field/i });
const noteBox = () =>
  screen.getByPlaceholderText(/say what is wrong/i);

describe("marking a field from the page", () => {
  it("offers the note to an attorney", () => {
    open({ canMark: true });
    expect(noteBox()).toBeInTheDocument();
    expect(submit()).toBeInTheDocument();
  });

  it("does not render it for anybody else", () => {
    open({ canMark: false });
    expect(submit()).not.toBeInTheDocument();
  });

  /*
    A coloured mark with no words is a message the person who has to act on it
    cannot read, and it is the single most likely thing to be left out in a
    hurry. The button says so by being disabled rather than by complaining
    afterwards.
  */
  it("will not raise one with no words in it", async () => {
    const user = userEvent.setup();
    const onMark = vi.fn();
    open({ canMark: true, onMark });

    expect(submit()).toBeDisabled();

    await user.type(noteBox(), "   ");
    expect(submit()).toBeDisabled();

    await user.clear(noteBox());
    await user.type(noteBox(), "Does not match the passport.");
    await user.click(submit()!);

    expect(onMark).toHaveBeenCalledWith({
      color: "red",
      note: "Does not match the passport.",
    });
  });

  it("raises it in the colour the attorney reached for", async () => {
    const user = userEvent.setup();
    const onMark = vi.fn();
    open({ canMark: true, onMark });

    // Unlabelled on the page, named for anyone reading it aloud — see
    // `correction-color.ts` on why there is no legend.
    await user.click(screen.getByRole("button", { name: "Amber" }));
    await user.type(noteBox(), "Check this against the I-94.");
    await user.click(submit()!);

    expect(onMark).toHaveBeenCalledWith({
      color: "amber",
      note: "Check this against the I-94.",
    });
  });

  it("names the field the way the form does, not the way the datum is keyed", () => {
    // The paralegal is reading a USCIS blank. `beneficiary.family_name` is the
    // right anchor and the wrong heading, so both appear and the label leads.
    open();
    expect(screen.getByText("Family Name (Last Name)")).toBeInTheDocument();
    expect(screen.getByText("beneficiary.family_name")).toBeInTheDocument();
  });

  it("says a field is empty rather than showing nothing", () => {
    open({ field: field({ value: null }) });
    expect(screen.getByText("Nothing yet")).toBeInTheDocument();
  });
});

describe("with no box selected", () => {
  it("lists what is still open, as the way back to it", () => {
    open({ field: null, allMarks: [mark()] });
    expect(screen.getByText("Open on this form")).toBeInTheDocument();
    expect(
      screen.getByText("Does not match the passport."),
    ).toBeInTheDocument();
  });

  it("leaves an answered mark out of that list", () => {
    // The thread is still readable on the field itself. This list is what is
    // outstanding, and an answered mark in it is a job that looks undone.
    open({ field: null, allMarks: [mark({ status: "resolved" })] });
    expect(screen.queryByText("Open on this form")).not.toBeInTheDocument();
  });

  it("says why nothing can be pointed at when the form has no geometry", () => {
    // A catalogued form whose boxes are not mapped yet. The page still renders
    // — it is the document being filed — but there is nothing to click, and
    // silence there reads as a bug rather than as a form awaiting wiring.
    open({ field: null, hasGeometry: false });
    expect(screen.getByText(/boxes are not mapped yet/i)).toBeInTheDocument();
  });
});

describe("a mark's thread", () => {
  it("shows the comments staff have added", () => {
    open({
      marks: [
        mark({
          comments: [
            {
              id: "c-1",
              body: "Corrected from the passport bio page.",
              createdAt: "2026-09-02T09:00:00.000Z",
              authorId: "staff-2",
              authorName: "Ife Balogun",
            },
          ],
        }),
      ],
    });

    expect(
      screen.getByText("Corrected from the passport bio page."),
    ).toBeInTheDocument();
    expect(screen.getByText("Ife Balogun")).toBeInTheDocument();
  });

  it("does not offer a comment box where commenting is not wired up", () => {
    open({ marks: [mark()] });
    expect(screen.queryByText("Add a comment")).not.toBeInTheDocument();
  });

  it("offers one where it is", () => {
    open({ marks: [mark()], onComment: vi.fn() });
    expect(screen.getByText("Add a comment")).toBeInTheDocument();
  });
});
