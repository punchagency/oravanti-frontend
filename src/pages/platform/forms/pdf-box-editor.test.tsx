import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CatalogueField, CatalogueForm, FormPdfBox } from "@/api/platform";
import { useDraftForm } from "@/components/questionnaire/use-draft-form";
import { Provider } from "@/providers/provider";
import { PdfBoxEditor } from "./pdf-box-editor";
import { mappingKey } from "./pdf-box-matching";

/*
  An answer that prints into two boxes must not be offered a control that can
  name one.

  The I-130 asks the date of the marriage in Part 2, from the petitioner, and
  again in Part 4, from the beneficiary. Both extracted fields are given the key
  `marriage.date` on the Fields view, `fillForCase` prints both boxes, and the
  database no longer forbids the pair.

  What that leaves is this screen. A select holds one value, and `setMapping`
  addresses the *datum* — it clears every row for the key before writing — so
  choosing a box on this row would delete the other one, and Part 4 would stop
  printing with nothing anywhere saying so. The row shows both boxes instead.

  This is asserted here rather than trusted to review because the select is the
  default for every other row on the screen: the branch is one ternary, and
  losing it in a merge fails no type check and no server test.
*/

const PT2_BOX = "form1[0].#subform[2].Pt2Line18_DateOfMarriage[0]";
const PT4_BOX = "form1[0].#subform[5].Pt4Line19_DateOfMarriage[0]";
const NAME_BOX = "form1[0].#subform[0].Pt1Line6a_FamilyName[0]";

const form: CatalogueForm = {
  id: "form-1",
  formCode: "I-130",
  title: "Petition for Alien Relative",
  description: null,
  providedBy: null,
};

const field = (
  fieldKey: string,
  label: string,
  orderIndex: number,
): CatalogueField => ({
  id: fieldKey,
  formCode: "I-130",
  fieldKey,
  label,
  partLabel: "Part 2. Information About You (Petitioner)",
  type: "date",
  orderIndex,
  helpText: null,
  config: null,
  isRequired: false,
  // These fixtures are all shared data — `marriage.date`, `petitioner.*` — so
  // they carry a node. A form-local box would be null here, which is what the
  // mapper paints amber.
  schemaNodeId: `node-${fieldKey}`,
  entryIndex: null,
});

const fields = [
  field("marriage.date", "Date of Current Marriage", 1),
  field("petitioner.family_name", "Family Name (Last Name)", 2),
];

const box = (name: string): FormPdfBox => ({
  name,
  kind: "text",
  options: [],
  tooltip: null,
  // Geometry is the mapper's concern; these tests are about names.
  placements: [],
});

const boxes = [box(PT2_BOX), box(PT4_BOX), box(NAME_BOX)];

/*
  Hoisted out of the component on purpose: `useDraftForm` re-seeds whenever
  `stored` changes identity, so an object literal built during render re-seeds,
  re-renders and builds another. The test does not fail — it hangs.
*/
const stored = {
  "marriage.date": PT2_BOX,
  "petitioner.family_name": NAME_BOX,
};

const sharedBoxes = {
  [mappingKey("marriage.date", null)]: [PT2_BOX, PT4_BOX],
};

function Harness() {
  const draftForm = useDraftForm(stored);

  return (
    <PdfBoxEditor
      form={form}
      partLabel="Part 2. Information About You (Petitioner)"
      fields={fields}
      boxes={boxes}
      sharedBoxes={sharedBoxes}
      draftForm={draftForm}
      onSave={vi.fn()}
      onDiscard={vi.fn()}
      isSaving={false}
    />
  );
}

const open = () =>
  render(
    <Provider>
      <Harness />
    </Provider>,
  );

describe("a datum printing into more than one box", () => {
  it("offers no select on that row", async () => {
    open();

    // The ordinary row first, so the absence below is about this rule rather
    // than about the part never having opened. Parts mount in batches across
    // animation frames — see `FormParts`.
    expect(
      await screen.findByLabelText("Box for Family Name (Last Name)"),
    ).toBeInTheDocument();

    expect(
      screen.queryByLabelText("Box for Date of Current Marriage"),
    ).not.toBeInTheDocument();
  });

  it("names every box it prints into, and where they are set", async () => {
    open();

    expect(await screen.findByText(PT2_BOX)).toBeInTheDocument();
    expect(screen.getByText(PT4_BOX)).toBeInTheDocument();

    /*
      And that it says where to go instead of leaving somebody stuck on a row
      with no control. It used to name a committed JSON file; that file was
      deleted when the forms left the repo, so the row pointed at nothing.
    */
    expect(screen.getByText(/Fields view/i)).toBeInTheDocument();
  });
});
