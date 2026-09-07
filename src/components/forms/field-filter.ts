/**
 * Narrowing a part's fields to what somebody is looking for.
 *
 * Pure, and separate from the input that drives it, so it can be tested
 * directly — the same division as `pdf-box-matching` beside its editor.
 *
 * ─── Within one part, since that is what is on screen ───────────────────────
 *
 * This used to filter a whole form's parts at once, back when a screen held all
 * fourteen. A screen now holds one, so a query narrows that one — and the
 * cross-part question it used to answer ("where are the fields nothing fills?")
 * is answered better by the part picker, which carries a count per part and so
 * shows the holes without a search being typed at all.
 */

/**
 * The fields a query leaves behind.
 *
 * Every term must match somewhere, in any order, so "birth date" finds "Date of
 * Birth" — the labels come off the form and rarely read the way somebody
 * remembers them. An empty query returns the list unchanged, identity included,
 * so a caller can skip work when nothing is being searched for.
 */
export function filterFields<T>(
  fields: T[],
  query: string,
  text: (field: T) => string,
): T[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return fields;

  return fields.filter((field) => {
    const haystack = text(field).toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}
