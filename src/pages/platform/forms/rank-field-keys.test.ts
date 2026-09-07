import {
  compareDomains,
  datumDomain,
  domainLabel,
  isSharedDatum,
} from "@/utils/field-domains";
import { describe, expect, it } from "vitest";

import {
  rankFieldKeys,
} from "./pdf-box-matching";
import { VOCABULARY, WIRED_BY_HAND } from "./wired-by-hand.fixture";

/**
 * Telling a datum from a name that only exists on one form.
 *
 * This is what decides whether a box is offered a choice at all, and whether
 * the overlay calls it done — so it is worth pinning against real keys rather
 * than invented ones. Getting it wrong in one direction hides every datum on a
 * form; in the other it offers 1,530 targets that print blank.
 */
describe("shared data against form-local names", () => {
  it("reads every hand-wired datum as shared, on its own form", () => {
    const local = WIRED_BY_HAND.filter(
      ([formCode, , chosen]) => !isSharedDatum(chosen, formCode),
    );
    expect(local).toEqual([]);
  });

  it("reads an extraction's own name as form-local", () => {
    expect(isSharedDatum("i130.pt2.2_uscis_online_account_number", "I-130")).toBe(
      false,
    );
    expect(isSharedDatum("i485.pt1.1_family_name", "I-485")).toBe(false);
    // The form code is compacted, so the dash must not matter either way.
    expect(isSharedDatum("i765.pt1.initial_permission", "i765")).toBe(false);
  });

  it("does not read one form's names as local to another", () => {
    // Nothing points a box on the I-485 at an I-130 key today, but if
    // something ever did it is a mistake to surface, not one to hide.
    expect(isSharedDatum("i130.pt2.4a_family_name", "I-485")).toBe(true);
  });

  it("groups the whole vocabulary into the eight domains", () => {
    const domains = [...new Set(VOCABULARY.map(datumDomain))].sort();
    expect(domains).toEqual([
      "beneficiary",
      "biographic",
      "employment",
      "family",
      "immigration",
      "marriage",
      "petitioner",
      "sponsor",
    ]);
  });

  it("names a domain it has never seen rather than dropping it", () => {
    // A seventh form may introduce a ninth domain. The label table is for
    // display and must never decide whether a datum appears.
    expect(domainLabel("guarantor_details")).toBe("Guarantor details");
    expect(compareDomains("guarantor", "beneficiary")).toBeGreaterThan(0);
  });

  it("puts the two most-used domains first", () => {
    const ordered = ["marriage", "petitioner", "sponsor", "beneficiary"].sort(
      compareDomains,
    );
    expect(ordered.slice(0, 2)).toEqual(["beneficiary", "petitioner"]);
  });
});

/**
 * What the ranking is worth, measured rather than asserted.
 *
 * `rank-field-keys.ts` exists instead of an auto-mapper, and the case for that
 * is entirely empirical: an auto-mapper was tried against these same 252
 * hand-made mappings and was wrong more often than right, while the ranking
 * puts the chosen datum in the first handful of a 159-key list most of the
 * time. This file is where both halves of that claim live, so a change that
 * quietly degrades the ranking — or a future attempt to promote it into an
 * answer — shows up as a failing number rather than as a wrong filing months
 * later.
 *
 * The floors are set just under the measured rates. They are a ratchet against
 * regression, not a target.
 */
describe("ranking the datum picker for a selected box", () => {
  /** Where the datum a person actually chose lands in the ranked list. */
  const rankOf = (tail: string, chosen: string) =>
    rankFieldKeys(tail, VOCABULARY).findIndex(
      (entry) => entry.fieldKey === chosen,
    );

  const within = (limit: number) =>
    WIRED_BY_HAND.filter(([, tail, chosen]) => {
      const rank = rankOf(tail, chosen);
      return rank >= 0 && rank < limit;
    }).length;

  it("has 252 hand-made mappings to measure against", () => {
    // If this changes, the floors below were read off a different corpus and
    // need re-reading. See `wired-by-hand.fixture.ts`.
    expect(WIRED_BY_HAND).toHaveLength(252);
    expect(VOCABULARY).toHaveLength(159);
  });

  it("puts the chosen datum in the top 3 for most boxes", () => {
    // Measured: 138/252 = 55%.
    expect(within(3)).toBeGreaterThanOrEqual(130);
  });

  it("puts it in the top 10 for three boxes in four", () => {
    // Measured: 197/252 = 78%. This is the number that matters — ten rows is
    // a glance, and the operator confirms against the paper either way.
    expect(within(10)).toBeGreaterThanOrEqual(190);
  });

  it("offers the chosen datum at all for nine boxes in ten", () => {
    // Measured: 235/252 = 93%. The other 7% share no word with the box name
    // — `CityTownOfBirth` against `immigration.consulate_country`, which is a
    // judgement no amount of word-matching reaches. They cost nothing: the
    // full vocabulary is one click away and always was.
    expect(within(VOCABULARY.length)).toBeGreaterThanOrEqual(225);
  });

  it("shortens the list it is ranking", () => {
    // The point is not only the order. A `FamilyName` box should not present
    // all 159 keys, most of which share no word with it.
    const shown = rankFieldKeys("FamilyName", VOCABULARY);
    expect(shown.length).toBeLessThan(VOCABULARY.length / 2);
    expect(shown.length).toBeGreaterThan(0);
  });

  /*
    ─── The part that must never become an answer ──────────────────────────

    A box name gives the shape of a datum and never its owner: `FamilyName` is
    nine different data on these six forms, all of them a `*_family_name`. A
    ranking that collapsed to one of them would be picking a person, which is
    the judgement the operator is there to make.
  */
  it("keeps every owner of an ambiguous datum on the list", () => {
    const ranked = rankFieldKeys("FamilyName", VOCABULARY).map(
      (entry) => entry.fieldKey,
    );

    for (const owner of [
      "beneficiary.family_name",
      "petitioner.family_name",
      "family.parents[1].family_name",
      "marriage.prior_spouses[1].family_name",
    ]) {
      expect(ranked).toContain(owner);
    }
  });

  it("never returns a single candidate for a name that has several", () => {
    expect(rankFieldKeys("DateOfBirth", VOCABULARY).length).toBeGreaterThan(1);
  });

  it("drops keys that share no word with the box", () => {
    const ranked = rankFieldKeys("HeightFeet", VOCABULARY).map(
      (entry) => entry.fieldKey,
    );
    expect(ranked).toContain("biographic.height_feet");
    expect(ranked).not.toContain("beneficiary.family_name");
  });

  it("reads a repeat-group entry as the same kind of thing as its siblings", () => {
    // Entry 1 and entry 2 of an address history are one question asked twice,
    // so a `PriorStreetName` box should offer both rather than neither.
    const ranked = rankFieldKeys("PriorStreetName", VOCABULARY).map(
      (entry) => entry.fieldKey,
    );
    expect(ranked).toContain("beneficiary.address_history[1].street");
    expect(ranked).toContain("beneficiary.address_history[2].street");
  });

  it("scores nothing for a box name with no words in it", () => {
    expect(rankFieldKeys("", VOCABULARY)).toEqual([]);
    // `_YN` and `CB_` say only that a box is a yes/no or a checkbox, which is
    // true of a great many candidates and distinguishes none of them.
    expect(rankFieldKeys("YN", VOCABULARY)).toEqual([]);
  });

  it("orders ties stably, so the list does not move under the cursor", () => {
    const once = rankFieldKeys("CityOrTown", VOCABULARY);
    const again = rankFieldKeys("CityOrTown", VOCABULARY);
    expect(once).toEqual(again);
  });
});
