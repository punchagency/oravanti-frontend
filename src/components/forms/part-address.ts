/**
 * How a part of a form is addressed — on the wire, and in the picker.
 *
 * Apart from `part-select.tsx` so that file exports components only and fast
 * refresh keeps working, the same split `use-paged-list.ts` and `node-values.ts`
 * make.
 */

/**
 * The address of the part whose fields carry no part label of their own.
 *
 * The empty string rather than null because both places that use it need a
 * string: a query parameter has no null, and a select's value is text. It is a
 * real part on a short form, not an error state.
 */
export const UNLABELLED_PART = "";

/** A part's address, from its label. */
export const partValue = (partLabel: string | null) =>
  partLabel ?? UNLABELLED_PART;

/** The same, read back. */
export const partLabelOf = (value: string) =>
  value === UNLABELLED_PART ? null : value;

/**
 * What to call a part with no label of its own, on screen.
 *
 * Named for what it is rather than left blank, and not simply "Fields" — the
 * CRM's first view of a form is now called that, and a part sharing the name
 * of the screen it sits on reads as the whole form rather than one part of it.
 */
export const partTitle = (partLabel: string | null) =>
  partLabel ?? "Fields with no part";
