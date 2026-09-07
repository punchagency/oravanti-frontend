import { describe, expect, it } from "vitest";

import { filterFields } from "./field-filter";

/**
 * The search on the wiring views. Its job is to find one field among the 96 on
 * the I-485's biggest part, and the labels come off the form rather than out of
 * anybody's head — so what matters is that it still finds a field when the
 * words are remembered in the wrong order or only half typed.
 */

type Field = { label: string; fieldKey: string };

const fields: Field[] = [
  { label: "1.a. Family Name (Last Name)", fieldKey: "i485.pt1.1a" },
  { label: "3. Date of Birth", fieldKey: "i485.pt1.3_dob" },
  {
    label: "13. Have you EVER violated the terms of your status?",
    fieldKey: "i485.pt9.13",
  },
];

const text = (field: Field) => `${field.label} ${field.fieldKey}`;

describe("finding a field on a long part", () => {
  it("returns everything for an empty query, unchanged", () => {
    // Identity, not a copy: the callers memoize off this and a fresh array
    // every render would rebuild every row.
    expect(filterFields(fields, "", text)).toBe(fields);
    expect(filterFields(fields, "   ", text)).toBe(fields);
  });

  it("matches terms in any order", () => {
    // Nobody remembers "3. Date of Birth"; they type what they mean.
    const found = filterFields(fields, "birth date", text);
    expect(found).toHaveLength(1);
    expect(found[0].label).toBe("3. Date of Birth");
  });

  it("searches the field key as well as the label", () => {
    expect(filterFields(fields, "pt9", text)).toHaveLength(1);
  });

  it("ignores case", () => {
    expect(filterFields(fields, "FAMILY name", text)).toHaveLength(1);
  });

  it("returns nothing when nothing matches, rather than everything", () => {
    expect(filterFields(fields, "passport", text)).toEqual([]);
  });
});
