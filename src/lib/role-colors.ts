/**
 * A starting-point swatch offered in the role color picker — mirrors
 * `ROLE_COLOR_PRESETS` in `oravanti-be/src/auth/permissions.ts`. Not a
 * closed set: the picker also offers a native color-wheel pick and a
 * pasted hex code, so the color is always stored and rendered as a plain
 * hex string, never a Chakra `colorPalette` token.
 */
export const ROLE_COLOR_PRESETS = [
  "#6B7280",
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#14B8A6",
  "#3B82F6",
  "#06B6D4",
  "#A855F7",
  "#EC4899",
] as const;

export const DEFAULT_ROLE_COLOR = "#6B7280";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** The role's accent color, or the fallback gray if unset/malformed. */
export function roleColorValue(color: string | null | undefined): string {
  return color && HEX_RE.test(color) ? color : DEFAULT_ROLE_COLOR;
}
