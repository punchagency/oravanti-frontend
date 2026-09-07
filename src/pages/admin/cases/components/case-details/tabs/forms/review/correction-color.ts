import type { CorrectionColor } from "@/api/case-details";

/**
 * What each mark colour looks like on the page.
 *
 * A Chakra palette name per colour rather than a hex, so a mark reads the same
 * in both themes without this file knowing anything about either — `red.solid`
 * and `red.subtle` resolve per theme, a `#c53030` does not.
 *
 * The colours are deliberately unlabelled. The product asked for "a red mark or
 * any colour of their choice", which is a request for the attorney's own
 * shorthand — a firm that means "blocking" by red and "check this" by amber
 * should not have to argue with a legend the app invented.
 */
export const CORRECTION_PALETTE: Record<
  CorrectionColor,
  { label: string; palette: string }
> = {
  red: { label: "Red", palette: "red" },
  amber: { label: "Amber", palette: "orange" },
  blue: { label: "Blue", palette: "blue" },
  violet: { label: "Violet", palette: "purple" },
};

/** The Chakra colour palette for a mark, falling back for a colour a newer build added. */
export const paletteFor = (color: CorrectionColor) =>
  CORRECTION_PALETTE[color]?.palette ?? "red";
