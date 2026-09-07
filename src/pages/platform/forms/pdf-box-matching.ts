import type { CatalogueField, FormPdfBox } from "@/api/platform";

/**
 * Matching field keys to boxes on a government blank.
 *
 * Pure logic, kept out of the component so it can be tested directly — the
 * ranking is the difference between mapping a 736-box form in a few clicks and
 * searching it by hand, and it is not something to verify by eye.
 */

/** The sentinel for "this datum prints nowhere on the form". */
export const UNMAPPED_BOX = "__unmapped_box__";

/**
 * ─── A choice is not one box ────────────────────────────────────────────────
 *
 * A text field is one datum in one box, and mapping it is one decision. A
 * choice is not: USCIS prints a *separate checkbox per option*, each with its
 * own name — `Pt1Line1_Spouse[0]`, `Pt1Line1_Parent[0]`, `Pt1Line1_Child[0]` —
 * so "which box does this field print into?" has no single answer. Mapping one
 * of them and calling the field done leaves every other answer printing
 * nowhere, and a filing that silently omits the answer rather than showing a
 * blank is the worst kind of wrong.
 *
 * So the unit of mapping is a *target*: a field, plus the answer that marks the
 * box — null for a field whose box holds the whole datum.
 *
 * A dropdown is deliberately on the whole-datum side. It has options too, but
 * they are values a single box accepts, not boxes of their own.
 */
export const mappingOptions = (field: CatalogueField): string[] | null => {
  if (field.type === "yes_no") return ["Yes", "No"];
  if (field.type === "single_choice" || field.type === "multiple_choice") {
    return field.config?.options ?? [];
  }
  return null;
};

/** Every mapping decision a field asks for, in the order they are offered. */
export const mappingTargets = (field: CatalogueField) =>
  mappingOptions(field)?.map((value) => ({ field, value })) ?? [
    { field, value: null as string | null },
  ];

/**
 * The draft key for a target.
 *
 * The draft is flat — one string per key — so a choice's options have to be
 * told apart within it. `::` never occurs in a field key, which is
 * `[a-z0-9_.]` by validation, so the split is unambiguous from the left.
 */
export const mappingKey = (fieldKey: string, fieldValue: string | null) =>
  fieldValue === null ? fieldKey : `${fieldKey}::${fieldValue}`;

export const parseMappingKey = (key: string) => {
  const at = key.indexOf("::");
  return at < 0
    ? { fieldKey: key, fieldValue: null }
    : { fieldKey: key.slice(0, at), fieldValue: key.slice(at + 2) };
};

/**
 * A form's boxes, prepared for matching.
 *
 * The weights are the important part. Word overlap alone ranks badly on a real
 * form: "number" appears in 57 of the I-485's boxes and "passport" in two, so
 * counting both as one match buries `Pt1Line10_PassportNum` under every
 * unrelated Number field on the form. Weighting each word by how *rare* it is
 * across this form's own boxes fixes that without anybody maintaining a list of
 * noise words — the noise is whatever this particular form repeats.
 */
export type BoxIndex = ReturnType<typeof buildBoxIndex>;

export function buildBoxIndex(boxes: FormPdfBox[]) {
  const entries = boxes.map((box, index) => {
    const tail = box.name.split(".").pop() ?? box.name;
    return { box, tail, words: words(tail), index };
  });

  const frequency = new Map<string, number>();
  for (const entry of entries) {
    for (const word of entry.words) {
      frequency.set(word, (frequency.get(word) ?? 0) + 1);
    }
  }

  return { entries, frequency };
}

/**
 * The boxes most likely to be the right one, first.
 *
 * A box's name carries its part and line — `Pt4Line9_DateOfBirth` — and the tail
 * is written in roughly the vocabulary our labels use, so weighted word overlap
 * does most of the work. Two things make it hold up on real forms:
 *
 * - **Rare words count more** (see `buildBoxIndex`), so `passport` decides a
 *   match and `number` barely moves it.
 * - **Abbreviations are expanded**, because USCIS shortens inconsistently
 *   between forms: the I-130 writes `Pt2Line8_DateofBirth` and the I-485 writes
 *   `Pt1Line3_DOB` for the same datum.
 *
 * Ties keep the form's own field order, which is the order somebody checking
 * against the printed page reads in. Nothing is ever auto-selected — this only
 * decides what to offer first.
 */
export function rankBoxes(
  field: CatalogueField,
  index: BoxIndex,
  fieldValue: string | null = null,
) {
  // The answer itself is the most decisive word there is when mapping a
  // choice: every option shares the field's label, and only "Spouse" tells
  // `Pt1Line1_Spouse` apart from `Pt1Line1_Parent`.
  const wanted = words(`${field.fieldKey} ${field.label} ${fieldValue ?? ""}`);

  const scored = index.entries.map((entry) => {
    let score = 0;
    for (const word of entry.words) {
      if (!wanted.has(word)) continue;
      // Rarer is more decisive. A word on every box is worth almost nothing.
      score += 1 / (index.frequency.get(word) ?? 1);
    }
    return { ...entry, score };
  });

  scored.sort((a, b) => b.score - a.score || a.index - b.index);

  return [
    NOWHERE_OPTION,
    ...scored.map(({ box, tail, score }) => optionFor(box, tail, score > 0)),
  ];
}

const NOWHERE_OPTION = { label: "Prints nowhere", value: UNMAPPED_BOX };

/**
 * The tail is what a person recognises; the kind matters because a dropdown
 * only accepts its own options and a checkbox only ticks.
 */
const optionFor = (box: FormPdfBox, tail: string, suggested: boolean) => ({
  label: `${suggested ? "★ " : ""}${tail}${box.kind === "text" ? "" : ` · ${box.kind}`}`,
  value: box.name,
});

/**
 * The one option a closed select needs: whatever it currently shows.
 *
 * Ranking all several hundred boxes is worth doing when somebody opens a row
 * and is about to read them. Doing it for every row on a form with four hundred
 * fields, before anyone has opened anything, is a hundred thousand option
 * objects nobody looks at — which is the difference between this screen opening
 * and this screen hanging the tab.
 */
export function selectedBoxOption(value: string, index: BoxIndex) {
  if (!value || value === UNMAPPED_BOX) return NOWHERE_OPTION;

  const entry = index.entries.find((candidate) => candidate.box.name === value);
  // A mapping pointing at a box this edition no longer has. Showing the raw
  // name is how somebody finds out, rather than the row looking unmapped.
  if (!entry) return { label: value, value };

  return optionFor(entry.box, entry.tail, false);
}

/*
  ─── The other direction: a box is selected, which datum is it? ─────────────

  Everything above answers "given this field, which box?" — the question the
  PDF boxes list asks, working down a form field by field. The mapper asks the
  inverse, because there the operator clicks a rectangle on the paper first.

  Same vocabulary, same synonyms, deliberately the same file: two word-matchers
  for one pair of names would drift, and the drift would show up as a box that
  ranks well from one screen and not from the other.
*/

/*
  ─── A shared datum, and a name that only exists on this form ───────────────

  Extraction names every box it finds — `i130.pt2.2_uscis_online_account_number`
  — and the field-sources file then *renames* the ones a person has decided are
  a shared datum. So a form's fields are two populations with one shape, and the
  difference is the whole point of the catalogue:

      i130.pt2.2_uscis_online_account_number   asked by nothing, prints blank
      beneficiary.uscis_online_account_number  asked by the questionnaire

  Population matches purely on the key, so pointing a box at the first kind
  accomplishes nothing at all — no error, no warning, just a blank on the
  filing. Across the six catalogued forms there are 1,530 of those against 252
  real data, which is why the mapper does not offer them: a picker that is 86%
  choices-that-do-nothing is worse than a shorter one.

  The test is the first segment, because `fieldKeyFor` builds a form-local key
  as `<form code, compacted>.pt<n>.<item>`. That same segment is the datum's
  *domain* on the other population — beneficiary, petitioner, marriage — which
  is where the picker's categories come from. One rule, both jobs.

  The backend states the naming half of it in `pdf-field-naming.ts` — it has to,
  because `fieldKeyFor` builds a generated key before any row exists and
  `clearGeneratedFields` has to recognise its own output. Not a mirrored file
  like `audit/actions.ts`: three lines and a docblock each side.

  What this rule no longer decides is whether a box *prints*. That was
  `isSharedDatum` on both sides, and it is a column now —
  `CatalogueField.schemaNodeId`, null exactly when the box carries no shared
  datum — read by the mapper's overlay, the CRM's coverage bar and population
  alike. The string rule survives only where there are no rows to join:
  `rank-field-keys.test.ts` scoring the ranking against the 252 mappings made by
  hand. `formLocalPrefix`, `isSharedDatum` and `datumDomain` live in
  `utils/field-domains.ts`, because the question dialog groups by domain too and
  it is shared by both tiers.
*/


export type RankedFieldKey = {
  fieldKey: string;
  /** Only ever an ordering. See `rankFieldKeys`. */
  score: number;
};

/**
 * The vocabulary, most plausible first, for a box that reads `hint`.
 *
 * ─── Why this ranks and never answers ──────────────────────────────────────
 *
 * The tempting version auto-maps: read `Pt2Line4a_FamilyName`, write
 * `beneficiary.family_name`, mark it high confidence, done. It was measured
 * against the 252 mappings a person has already made by hand across the six
 * catalogued forms, and it is wrong more often than right. Two reasons, and
 * neither is fixable with a better pattern:
 *
 * 1. **The part says less than it looks like it does.** On the I-130, Parts 2
 *    and 6 are the petitioner and Part 4 is the beneficiary, so a rule keyed on
 *    the box name alone maps most of that form to the wrong person. Adding the
 *    part does not rescue it: Part 6 of the I-485 holds `beneficiary.*`,
 *    `petitioner.*` and `marriage.*` boxes together.
 * 2. **A box name gives the shape of a datum, never its owner.** `FamilyName`
 *    is nine different data on these six forms — the applicant's, the
 *    petitioner's, both parents', a prior spouse's, two children's — and every
 *    one of them is a `*_family_name`.
 *
 * Guessing anyway is the failure this catalogue is built against:
 * population fills purely by matching `fieldKey`, so a wrong mapping prints a
 * plausible wrong answer in a right-looking box, nothing downstream can tell it
 * from a correct one, and the first reader who can is USCIS.
 *
 * What (2) does buy is a good ordering. Measured the same way, the datum a
 * person actually chose is in the top 3 of the 159-key vocabulary 55% of the
 * time, the top 10 78% of the time, and on the list at all 93% of the time — a
 * search through 159 keys becomes a glance at three. Being an ordering rather
 * than an answer, it cannot be wrong, only unhelpful, and the 7% it cannot
 * place cost nothing: the full vocabulary is one click away and always was.
 * `rank-field-keys.test.ts` pins those rates.
 *
 * `hint` is anything the caller has that describes the box in words: its name,
 * its tooltip, or both. Keys sharing no word with it are dropped rather than
 * ranked last — a list ordered by nothing is the whole vocabulary wearing a
 * misleading order.
 */
export function rankFieldKeys(
  hint: string,
  vocabulary: readonly string[],
): RankedFieldKey[] {
  const asked = words(hint);
  if (asked.size === 0) return [];

  return vocabulary
    .map((fieldKey) => {
      const found = words(fieldKey);
      let shared = 0;
      for (const word of found) if (asked.has(word)) shared += 1;

      return {
        fieldKey,
        // Jaccard, so a key that matches the box *and says nothing else*
        // outranks one that matches and carries three other words:
        // `marriage.date` above `marriage.prior_spouses[1].marriage_date` for
        // a bare `DateOfMarriage`, with both still on the list.
        score: shared === 0 ? 0 : shared / (asked.size + found.size - shared),
      };
    })
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        // A tie is two keys the box name cannot separate. Ordering them
        // stably is what stops the list reshuffling under the cursor.
        a.fieldKey.length - b.fieldKey.length ||
        a.fieldKey.localeCompare(b.fieldKey),
    );
}

/**
 * Word-parts of an identifier, lower-cased and expanded.
 *
 * `Pt4Line9_DateOfBirth` → date, birth. `Pt1Line3_DOB` → dob, date, birth, so
 * the two forms' names for one datum meet in the middle.
 */
function words(text: string) {
  const found = new Set<string>();

  for (const part of text
    .replace(/\[\d+\]/g, "")
    .split(/[^A-Za-z0-9]+|(?<=[a-z0-9])(?=[A-Z])/)) {
    const word = part.toLowerCase();
    if (word.length < 2 || SCAFFOLDING.test(word)) continue;
    found.add(word);
    for (const synonym of SYNONYMS[word] ?? []) found.add(synonym);
  }

  return found;
}

/**
 * Box-name structure rather than meaning: `pt2`, `line18`, `cb`, the trailing
 * `yn` on a yes/no pair. Present on hundreds of boxes and never the reason one
 * box is the right one.
 */
const SCAFFOLDING = /^(pt\d*|p\d+|line\d*|cb|yn|form|the|of|and)$/;

/**
 * What USCIS shortens, expanded both ways.
 *
 * Applied to our field keys and to box names alike, so it does not matter which
 * side wrote it out in full — and they disagree between forms for the same
 * datum, which is exactly why this exists.
 */
const SYNONYMS: Record<string, string[]> = {
  dob: ["date", "birth"],
  birth: ["dob"],
  num: ["number"],
  number: ["num"],
  no: ["number"],
  addr: ["address"],
  address: ["addr"],
  tel: ["telephone", "phone"],
  phone: ["telephone", "tel"],
  telephone: ["phone", "tel"],
  ssn: ["social", "security"],
  alien: ["anumber"],
  apt: ["unit"],
  ste: ["unit"],
  flr: ["unit"],
  zip: ["postal"],
  dept: ["department"],
  exp: ["expiration", "expires"],
  i94: ["arrival", "departure"],
  mailing: ["current"],
};
