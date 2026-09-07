import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { CaseForm, CaseFormField } from "@/api/case-details";
import { useDraftForm } from "@/components/questionnaire/use-draft-form";
import { Provider } from "@/providers/provider";
import { FormView } from "./form-view";

/*
  The firm side of the boundary, asserted where a person would see it.

  The governing rule is that a form is a government blank: a firm fills it in,
  and only Oravanti says what the boxes are. That rule is enforced on the
  server — the catalogue routes are gated by `requirePlatformAdmin`, and
  `__tests__/unit/platform/platform-access.test.ts` pins that — but a button
  that 403s is still a promise the app cannot keep. This is about what the
  screen offers.

  It matters because the controls were here, in this component, until recently:
  Add field, Edit field, Edit form, and a per-row Pencil and Trash. Each was one
  line of JSX, and any of them could come back in a merge without failing a type
  check or a server test.

  It matters more now that there *is* a per-row pencil again. It edits the
  value, not the field, and the two are one word apart — so the names are what
  this file pins.
*/

const form: CaseForm = {
  id: "form-1",
  caseId: "case-1",
  formCode: "I-485",
  role: "core",
  status: "in_preparation",
  editionDate: "2025-01-20",
  filedDate: null,
  receiptNumber: null,
  feeCents: null,
  notes: null,
  completion: {
    populated: 1,
    total: 2,
    requiredPopulated: 1,
    requiredTotal: 1,
  },
  definition: {
    id: "def-1",
    title: "Application to Register Permanent Residence",
    description: null,
    providedBy: null,
  },
};

const fields: CaseFormField[] = [
  {
    id: "field-1",
    fieldKey: "beneficiary.date_of_birth",
    label: "Date of Birth",
    partLabel: "Part 1. Information About You",
    type: "date",
    helpText: null,
    config: null,
    isRequired: true,
    value: "1990-01-01",
    valueSource: "questionnaire",
    isManualOverride: false,
    conflictsWith: null,
  },
];

const parts = [{ partLabel: "Part 1. Information About You", fields }];

/*
  The saved values, hoisted out of the component on purpose.

  `useDraftForm` requires `stored` to be referentially stable: it re-seeds the
  form whenever the reference changes, so an object literal built during render
  re-seeds, re-renders, and builds another one. The test does not fail — it
  hangs.
*/
const stored = { "beneficiary.date_of_birth": "1990-01-01" };

/**
 * The form with a real draft behind it.
 *
 * `useDraftForm` is a hook, so it needs a component to live in. Nothing else is
 * mocked — this renders the same tree the Forms tab does.
 */
function Harness({
  isEditing,
  onSaveField,
  canMark = false,
}: {
  isEditing: boolean;
  onSaveField?: () => void;
  canMark?: boolean;
}) {
  const draftForm = useDraftForm(stored);

  return (
    <FormView
      caseId="case-1"
      form={form}
      draftForm={draftForm}
      parts={parts}
      completion={{
        populated: 1,
        total: 2,
        percentage: 50,
        missingRequired: [],
      }}
      isEditing={isEditing}
      onEdit={vi.fn()}
      onSave={vi.fn()}
      onDiscard={vi.fn()}
      onDone={vi.fn()}
      isSaving={false}
      onRemoveForm={vi.fn()}
      onFormHistory={vi.fn()}
      onFieldHistory={vi.fn()}
      onSaveAndDone={vi.fn()}
      onSaveField={onSaveField}
      canMark={canMark}
      onMarkField={vi.fn()}
    />
  );
}

const open = (isEditing = true, onSaveField?: () => void) =>
  render(
    <Provider>
      <Harness isEditing={isEditing} onSaveField={onSaveField} />
    </Provider>,
  );

describe("the form offers no way to change what the form is", () => {
  it("has no Add field", () => {
    open();

    expect(
      screen.queryByRole("button", { name: /add field/i }),
    ).not.toBeInTheDocument();
  });

  it("has no Edit on the form itself", () => {
    open();

    // By accessible name rather than by icon: the control that existed was
    // labelled "Edit I-485", and any replacement would have to name the form
    // the same way to be usable.
    expect(
      screen.queryByRole("button", { name: /^edit i-485$/i }),
    ).not.toBeInTheDocument();
  });

  /*
    The distinction the per-row pencil now has to carry.

    "Edit Date of Birth" changed the *field* — its label, whether the form has
    it — which is Oravanti's decision for every firm. What is offered instead
    is "Edit the value of Date of Birth", which is this matter's answer. The
    exact-match assertion is the point: an unanchored `/edit date of birth/`
    would pass on either.
  */
  it("has no per-field Edit or Remove of the field itself", () => {
    open(false);

    expect(
      screen.queryByRole("button", { name: /^edit date of birth$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /remove date of birth/i }),
    ).not.toBeInTheDocument();
  });

  /*
    The one destructive control that stays, and the reason it is worded as it
    is.

    Taking a form off a matter is a decision about the matter. Removing it from
    the catalogue would be a decision about every firm, and is not offered here
    at all — so the label says "off this matter" rather than "remove", because
    the two would otherwise be a click apart and indistinguishable.
  */
  it("offers taking the form off the matter, named as such", () => {
    open();

    expect(
      screen.getByRole("button", { name: /take i-485 off this matter/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /from the catalogue/i }),
    ).not.toBeInTheDocument();
  });
});

/*
  A review is reading the filing as it prints.

  Marking used to be offered here too — a flag on every row, and "Mark this part
  for correction" above each part — so an attorney could raise a correction
  against a list of keys and values without ever seeing the page it prints on.
  The mark now goes on the box, in *Review on the form*, and this list is where
  it is read and answered.

  Asserted with `canMark` on, because that is the flag every one of those
  controls was behind: with it off the absence proves nothing.
*/
describe("the field list reads marks and raises none", () => {
  const asAttorney = () =>
    render(
      <Provider>
        <Harness isEditing={false} canMark />
      </Provider>,
    );

  it("offers no flag on a field", () => {
    asAttorney();

    expect(
      screen.queryByRole("button", { name: /mark date of birth/i }),
    ).not.toBeInTheDocument();
  });

  it("offers no way to mark a whole part", () => {
    // There is no section review at all now. A part has no box on the page, so
    // it has nothing to anchor to on the surface where marking happens.
    asAttorney();

    expect(
      screen.queryByRole("button", { name: /mark this part/i }),
    ).not.toBeInTheDocument();
  });

  it("still offers the way to the page, where marking happens", () => {
    asAttorney();

    expect(
      screen.getByRole("button", { name: /review on the form/i }),
    ).toBeInTheDocument();
  });
});

describe("the form keeps everything about values", () => {
  it("renders the field", () => {
    open();

    expect(screen.getByText("Date of Birth")).toBeInTheDocument();
  });

  it("still offers history, which is a record of the matter", () => {
    open();

    expect(
      screen.getByRole("button", { name: /history of i-485/i }),
    ).toBeInTheDocument();
  });

  /*
    One level decides what happens to the draft.

    Leaving the editor used to be a ✕ Done editing in the form's header, inches
    from Preview PDF and a scroll away from the sticky bar's Discard and Save —
    three buttons across two levels over one draft, and the one furthest from
    the work was the one that threw it away. The bar is now the only level, and
    the header says which state you are in rather than offering to change it.
  */
  it("offers the way out of editing in the bar, not the header", () => {
    open();

    const done = screen.getByRole("button", { name: /done editing/i });
    // The bar is the last thing on the page; the header is the first. Nothing
    // else on this screen distinguishes them, and asserting the parent would
    // pin the markup rather than the rule.
    expect(done).toBeInTheDocument();
    expect(screen.getByText("Editing")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^edit$/i }),
    ).not.toBeInTheDocument();
  });
});

/*
  Reading is the resting state, and the way out of it.

  The form used to be two components — a list of values, and a page of inputs —
  and pressing Edit swapped one for the other. It is one component now with the
  controls in the same places, so what a person sees is the *same form* either
  way; the difference is whether it takes typing.
*/
describe("reading a form", () => {
  it("offers Edit for the whole form and the value of one field", () => {
    open(false);

    expect(screen.getByRole("button", { name: /^edit$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /edit the value of date of birth/i }),
    ).toBeInTheDocument();
  });

  it("does not offer a per-field unlock once the whole form is editable", () => {
    // Two ways into the same state would leave a row in one neither of them
    // explains — the pencil would toggle something already true.
    open(true);

    expect(
      screen.queryByRole("button", { name: /edit the value of date of birth/i }),
    ).not.toBeInTheDocument();
  });
});

/*
  ─── One change, one Save ───────────────────────────────────────────────────

  There are two ways to fill a form and each has exactly one commit: Edit works
  down the whole blank and ends at the sticky bar; the row own pencil answers
  one of the reviewing attorney marks and ends at *Save this field*.

  Both showing at once is the bug this pins. The person editing one field saw
  two buttons for one change, and the more prominent of them quietly meant "and
  everything else I have touched" — on a form where the other things touched
  may be somebody else corrections.

  A text field rather than the date one above, so the assertions can be about
  what was typed rather than about how a date picker renders.
*/
const textField: CaseFormField = {
  ...fields[0],
  id: "field-2",
  fieldKey: "beneficiary.family_name",
  label: "Family Name",
  type: "short_text",
  value: "Okafor",
};

const textParts = [
  { partLabel: "Part 1. Information About You", fields: [textField] },
];

/** Stable, for the reason given on `stored`. */
const textStored = { "beneficiary.family_name": "Okafor" };

function TextHarness({
  isEditing = false,
  onSaveField,
}: {
  isEditing?: boolean;
  onSaveField?: () => void;
}) {
  const draftForm = useDraftForm(textStored);

  return (
    <FormView
      caseId="case-1"
      form={form}
      draftForm={draftForm}
      parts={textParts}
      completion={{ populated: 1, total: 1, percentage: 100, missingRequired: [] }}
      isEditing={isEditing}
      onEdit={vi.fn()}
      onSave={vi.fn()}
      onDiscard={vi.fn()}
      onDone={vi.fn()}
      isSaving={false}
      onRemoveForm={vi.fn()}
      onFormHistory={vi.fn()}
      onFieldHistory={vi.fn()}
      onSaveAndDone={vi.fn()}
      onSaveField={onSaveField}
    />
  );
}

describe("the two ways of filling a form each have one Save", () => {
  // Exact: "Save this field" is the other Save on this screen, and the whole
  // point of these tests is that the two are never offered together.
  const formWide = () => screen.queryByRole("button", { name: /^save$/i });
  const rowSave = () => screen.queryByRole("button", { name: /save this field/i });
  /*
    Exact, because the ✕ in the corner now says it discards too — its name is
    "Discard the change to Family Name *and stop editing it*". An unanchored
    pattern would match either and the assertions below would stop meaning what
    they say.
  */
  const rowDiscard = () =>
    screen.queryByRole("button", {
      name: /^discard the change to family name$/i,
    });
  const closeRow = () =>
    screen.getByRole("button", { name: /and stop editing it$/i });

  const unlock = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(
      screen.getByRole("button", { name: /edit the value of family name/i }),
    );
    const input = screen.getByDisplayValue("Okafor");
    await user.clear(input);
    await user.type(input, "Adeyemi");
    return input;
  };

  it("shows no form-wide Save while a single field is unlocked", async () => {
    const user = userEvent.setup();
    render(
      <Provider>
        <TextHarness onSaveField={vi.fn()} />
      </Provider>,
    );

    await unlock(user);

    expect(rowSave()).toBeInTheDocument();
    expect(formWide()).not.toBeInTheDocument();
  });

  it("shows no form-wide Save while the form is only being read", () => {
    open(false);
    expect(formWide()).not.toBeInTheDocument();
  });

  /*
    Closing the row abandons the edit. Without the reset the value stayed in the
    draft — invisible, since the bar belongs to form-wide editing — and the next
    Save form would have written it.
  */
  it("puts the stored value back when an unlocked row is closed", async () => {
    const user = userEvent.setup();
    render(
      <Provider>
        <TextHarness onSaveField={vi.fn()} />
      </Provider>,
    );

    await unlock(user);
    expect(screen.getByDisplayValue("Adeyemi")).toBeInTheDocument();

    await user.click(closeRow());

    expect(screen.queryByDisplayValue("Adeyemi")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Okafor")).toBeInTheDocument();
    // Dirty state went with it, so nothing is left to commit.
    expect(rowSave()).not.toBeInTheDocument();
  });

  /*
    The same thing said in a word.

    The ✕ discards, but an icon is fine for "close" and no good at all for "and
    lose what I typed" — which is the half somebody wants to be sure of before
    pressing it. So the row carries the pair the sticky bar already has.
  */
  it("offers Discard beside Save this field, and it puts the value back", async () => {
    const user = userEvent.setup();
    render(
      <Provider>
        <TextHarness onSaveField={vi.fn()} />
      </Provider>,
    );

    // Nothing to throw away until something has been typed.
    await user.click(
      screen.getByRole("button", { name: /edit the value of family name/i }),
    );
    expect(rowDiscard()).not.toBeInTheDocument();

    const input = screen.getByDisplayValue("Okafor");
    await user.clear(input);
    await user.type(input, "Adeyemi");

    await user.click(rowDiscard()!);

    expect(screen.getByDisplayValue("Okafor")).toBeInTheDocument();
    // Back to reading, the same as the ✕ — one of the two controls leaving the
    // row unlocked would be a third state neither of them explains.
    expect(
      screen.getByRole("button", { name: /edit the value of family name/i }),
    ).toBeInTheDocument();
  });

  /*
    And the other way round.

    Form-wide editing already has its commit in the sticky bar; a per-row Save
    beside it is the same two-buttons-for-one-change bug mirrored, and a per-row
    Discard would drop one field's typing while the bar above still counted it.
  */
  it("offers no per-row Save or Discard while the whole form is editable", async () => {
    const user = userEvent.setup();
    render(
      <Provider>
        <TextHarness isEditing onSaveField={vi.fn()} />
      </Provider>,
    );

    const input = screen.getByDisplayValue("Okafor");
    await user.clear(input);
    await user.type(input, "Adeyemi");

    expect(formWide()).toBeInTheDocument();
    expect(rowSave()).not.toBeInTheDocument();
    expect(rowDiscard()).not.toBeInTheDocument();
  });
});
