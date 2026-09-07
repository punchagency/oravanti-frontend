import type { CatalogueField, FormPdfBox } from "@/api/platform";
import { describe, expect, it } from "vitest";

import {
  buildBoxIndex,
  mappingKey,
  mappingOptions,
  mappingTargets,
  parseMappingKey,
  rankBoxes,
  selectedBoxOption,
  UNMAPPED_BOX,
} from "./pdf-box-matching";

/**
 * The ranker decides what a person is offered first when mapping a field to one
 * of several hundred boxes. Getting it wrong is not a visible bug — it is a
 * paralegal scrolling 736 names, or worse, accepting a plausible-looking wrong
 * box. Every name below is real, taken from the I-130 and I-485 blanks.
 */

/**
 * A box named the way the real blanks name them, trailing `[0]` included — the
 * index is part of every USCIS field name and the tokeniser has to drop it.
 */
const box = (name: string, kind: FormPdfBox["kind"] = "text"): FormPdfBox => ({
  name: `form1[0].#subform[1].${name}[0]`,
  kind,
  options: [],
  // The ranker works on names, not on the printed question — a person mapping a
  // shared datum is looking for a box, and the box is what its name says.
  tooltip: null,
  // Geometry belongs to the mapper; these tests are about names.
  placements: [],
});

const field = (fieldKey: string, label: string) =>
  ({ fieldKey, label }) as CatalogueField;

/** A slice of the real I-485, including the names that used to win wrongly. */
const I485 = [
  box("Pt1Line1_FamilyName"),
  box("Pt1Line1_GivenName"),
  box("Pt1Line3_DOB"),
  box("Pt1Line3A_OtherDOB"),
  box("Pt1Line7_CityTownOfBirth"),
  box("Pt1Line7_CountryOfBirth"),
  box("Pt1Line10_PassportNum"),
  box("Pt1Line10_DateofArrival"),
  box("P1Line12_I94"),
  box("Pt1Line18_CityOrTown"),
  box("Pt1Line19_SSN"),
  // The three that used to beat every real answer, because "number" is common.
  box("AttorneyStateBarNumber"),
  box("VolagNumber"),
  box("USCISOnlineAcctNumber"),
];

const topPick = (fieldKey: string, label: string, boxes: FormPdfBox[]) => {
  const ranked = rankBoxes(field(fieldKey, label), buildBoxIndex(boxes));
  // The first entry is always "Prints nowhere"; the first suggestion follows.
  expect(ranked[0].value).toBe(UNMAPPED_BOX);
  return ranked[1].value.split(".").pop();
};

describe("ranking boxes for a field", () => {
  it("offers the unmapped choice first, always", () => {
    const ranked = rankBoxes(
      field("anything.at_all", "Anything"),
      buildBoxIndex(I485),
    );
    expect(ranked[0]).toEqual({ label: "Prints nowhere", value: UNMAPPED_BOX });
  });

  it("matches an abbreviated box name to a spelled-out field key", () => {
    // `Pt1Line3_DOB` and `beneficiary.date_of_birth` share no literal word.
    expect(topPick("beneficiary.date_of_birth", "Date of Birth", I485)).toBe(
      "Pt1Line3_DOB[0]",
    );
  });

  it("is not fooled by a word that appears all over the form", () => {
    // "number" is on four boxes here and none of them is the passport. Before
    // rarity weighting, `AttorneyStateBarNumber` won all three of these.
    expect(
      topPick("beneficiary.passport_number", "Passport Number", I485),
    ).toBe("Pt1Line10_PassportNum[0]");
    expect(
      topPick("beneficiary.ssn", "U.S. Social Security Number", I485),
    ).toBe("Pt1Line19_SSN[0]");
    expect(
      topPick(
        "beneficiary.i94_number",
        "Form I-94 Arrival-Departure Record Number",
        I485,
      ),
    ).toBe("P1Line12_I94[0]");
  });

  it("separates two boxes that differ by one word", () => {
    expect(
      topPick("beneficiary.country_of_birth", "Country of Birth", I485),
    ).toBe("Pt1Line7_CountryOfBirth[0]");
    expect(
      topPick("beneficiary.city_of_birth", "City/Town/Village of Birth", I485),
    ).toBe("Pt1Line7_CityTownOfBirth[0]");
  });

  it("works on the I-130's spelled-out names too", () => {
    // The same datum, written out in full on a different form. Neither naming
    // style is the one to optimise for.
    const i130 = [
      box("Pt2Line4a_FamilyName"),
      box("Pt2Line8_DateofBirth"),
      box("Pt2Line7_CountryofBirth"),
    ];
    expect(topPick("beneficiary.date_of_birth", "Date of Birth", i130)).toBe(
      "Pt2Line8_DateofBirth[0]",
    );
  });

  it("marks a scored suggestion and leaves the rest plain", () => {
    const ranked = rankBoxes(
      field("beneficiary.passport_number", "Passport Number"),
      buildBoxIndex(I485),
    );
    expect(ranked[1].label.startsWith("★ ")).toBe(true);
    expect(ranked[ranked.length - 1].label.startsWith("★ ")).toBe(false);
  });

  it("names the kind of a box that is not a plain text field", () => {
    const ranked = rankBoxes(
      field("beneficiary.mailing_address.state", "State"),
      buildBoxIndex([box("Pt1Line18_State", "dropdown")]),
    );
    expect(ranked[1].label).toContain("· dropdown");
  });

  it("offers every box, so nothing is unreachable by searching", () => {
    const ranked = rankBoxes(
      field("unrelated.key", "Unrelated"),
      buildBoxIndex(I485),
    );
    expect(ranked).toHaveLength(I485.length + 1);
  });
});

/**
 * A closed row carries one option, not several hundred. On a form catalogued
 * from its blank that is the difference between the screen opening and the tab
 * hanging — four hundred rows times seven hundred boxes is three hundred
 * thousand options nobody has asked to see.
 */
describe("what a closed row shows", () => {
  const index = buildBoxIndex(I485);

  it("reads the same as the ranked entry for the same box", () => {
    const box = "form1[0].#subform[1].Pt1Line10_PassportNum[0]";
    const ranked = rankBoxes(
      field("beneficiary.passport_number", "Passport Number"),
      index,
    );

    expect(selectedBoxOption(box, index)).toEqual({
      // Without the star: a saved mapping is a decision already made, not a
      // suggestion still being offered.
      label: ranked[1].label.replace("★ ", ""),
      value: box,
    });
  });

  it("says so when nothing is mapped", () => {
    expect(selectedBoxOption(UNMAPPED_BOX, index)).toEqual({
      label: "Prints nowhere",
      value: UNMAPPED_BOX,
    });
    expect(selectedBoxOption("", index)).toEqual({
      label: "Prints nowhere",
      value: UNMAPPED_BOX,
    });
  });

  it("shows the raw name of a box this edition no longer has", () => {
    // A new edition moved or dropped the box. Showing the name is how somebody
    // finds out; falling back to "Prints nowhere" would hide a broken mapping
    // behind a row that looks deliberately empty.
    const gone = "form1[0].#subform[9].Pt9Line99_Removed[0]";
    expect(selectedBoxOption(gone, index)).toEqual({
      label: gone,
      value: gone,
    });
  });
});

/**
 * How many decisions a field asks for.
 *
 * A choice prints as one checkbox per option, so mapping it is one decision per
 * answer rather than one per field. Getting this wrong does not look like a
 * bug: the field appears mapped, one answer prints, and every other answer
 * silently prints nothing — which on a filing reads as an answer that was never
 * given.
 */
describe("what a field asks to be mapped", () => {
  const choice = {
    fieldKey: "i130.pt1.1_choice",
    label: "1. I am filing this petition for my",
    type: "single_choice",
    config: { options: ["Spouse", "Brother / Sister", "Parent", "Child"] },
  } as unknown as CatalogueField;

  it("gives a choice one target per option", () => {
    expect(mappingOptions(choice)).toEqual([
      "Spouse",
      "Brother / Sister",
      "Parent",
      "Child",
    ]);
    expect(mappingTargets(choice).map((t) => t.value)).toEqual(
      mappingOptions(choice),
    );
  });

  it("assumes both answers of a yes/no, which carries no option list", () => {
    // The blank has a Yes box and a No box; the catalogue records no options.
    const yesNo = { fieldKey: "i485.pt1.4_yes_no", type: "yes_no" };
    expect(mappingOptions(yesNo as unknown as CatalogueField)).toEqual([
      "Yes",
      "No",
    ]);
  });

  it("leaves a dropdown as a single target despite having options", () => {
    // Its options are values one box accepts, not boxes of their own.
    const state = {
      fieldKey: "i130.pt2.10_state",
      type: "dropdown",
      config: { options: ["CA", "NY"] },
    } as unknown as CatalogueField;
    expect(mappingOptions(state)).toBeNull();
    expect(mappingTargets(state)).toEqual([{ field: state, value: null }]);
  });

  it("round-trips a target through the flat draft key", () => {
    const key = mappingKey("i130.pt1.1_choice", "Brother / Sister");
    expect(parseMappingKey(key)).toEqual({
      fieldKey: "i130.pt1.1_choice",
      fieldValue: "Brother / Sister",
    });
    expect(
      parseMappingKey(mappingKey("beneficiary.date_of_birth", null)),
    ).toEqual({ fieldKey: "beneficiary.date_of_birth", fieldValue: null });
  });
});

/**
 * The answer is the word that tells a choice's boxes apart: they share the
 * field key and the label, and differ only in the option.
 */
describe("ranking the boxes of one choice", () => {
  const boxes = [
    box("Pt1Line1_Spouse", "checkbox"),
    box("Pt1Line1_Parent", "checkbox"),
    box("Pt1Line1_Child", "checkbox"),
    box("Pt1Line1_Siblings", "checkbox"),
  ];
  const relationship = field(
    "i130.pt1.1_choice",
    "1. I am filing this petition for my",
  );

  it("puts the option's own box first", () => {
    const index = buildBoxIndex(boxes);
    const first = (value: string) =>
      rankBoxes(relationship, index, value)[1].value;

    expect(first("Parent")).toContain("Pt1Line1_Parent");
    expect(first("Spouse")).toContain("Pt1Line1_Spouse");
    expect(first("Child")).toContain("Pt1Line1_Child");
  });
});
