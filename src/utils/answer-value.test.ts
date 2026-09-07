import { describe, expect, it } from "vitest";

import { fromInputValue, parseEntries, toInputValue } from "./answer-value";

/**
 * The crossing between what a control edits and what is stored.
 *
 * A repeating answer makes this crossing load-bearing: the draft form is
 * string-valued for performance reasons that are not going to change, so the
 * list rides through it as JSON and every failure here is a lost answer rather
 * than an error anybody sees.
 */
describe("repeating answers", () => {
  it("round-trips a list", () => {
    const entries = [{ street: "123 Main St", city: "Brooklyn" }];
    expect(fromInputValue(toInputValue(entries), "repeat_group")).toEqual(
      entries,
    );
  });

  it("drops entries with nothing in them", () => {
    /*
      Pressing Add and changing your mind is not an address. An empty entry
      stored would print an empty block on the I-485 and count as answered in
      the client's own progress bar.
    */
    const raw = JSON.stringify([
      { street: "123 Main St" },
      {},
      { street: "", city: "" },
    ]);
    expect(parseEntries(raw)).toEqual([{ street: "123 Main St" }]);
  });

  it("treats a list of only empty entries as unanswered", () => {
    expect(parseEntries(JSON.stringify([{}, { city: "" }]))).toBeNull();
  });

  it("survives anything that is not a list of entries", () => {
    // This runs inside the save handler. One unparseable answer must cost that
    // answer and not the other twenty being saved beside it.
    for (const raw of ["", "not json", "42", '"a string"', "[1,2,3]", "{}"]) {
      expect(() => parseEntries(raw)).not.toThrow();
      expect(parseEntries(raw)).toBeNull();
    }
  });

  it("clears the answer when the list is emptied", () => {
    expect(fromInputValue("[]", "repeat_group")).toBeNull();
  });
});

describe("scalar answers keep their type", () => {
  it("keeps yes/no a boolean and a number a number", () => {
    expect(fromInputValue("true", "yes_no")).toBe(true);
    expect(fromInputValue("false", "yes_no")).toBe(false);
    expect(fromInputValue("7", "number")).toBe(7);
  });

  it("reads a cleared field as no answer rather than an empty one", () => {
    expect(fromInputValue("", "short_text")).toBeNull();
  });
});
