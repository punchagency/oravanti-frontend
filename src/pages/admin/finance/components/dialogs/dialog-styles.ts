/**
 * Shared field styling for the finance dialogs.
 *
 * Split out of `dialog-shell.tsx` so that file exports only components — a
 * module mixing components and constants disables Fast Refresh for it.
 */
export const fieldStyles = {
  h: "36px",
  px: "12px",
  border: "1px solid",
  borderColor: "border",
  borderRadius: "7px",
  bg: "bg",
  color: "fg",
  fontSize: "13px",
  _placeholder: { color: "fg.muted" },
  _focus: {
    borderColor: "brand.solid",
    boxShadow: "0 0 0 1px var(--brand-cta)",
  },
} as const;
