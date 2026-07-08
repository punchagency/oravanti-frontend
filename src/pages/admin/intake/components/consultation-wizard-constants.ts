// Shared constants for the consultation wizards (scheduling + instant). Kept
// in a plain module so the component files only export components
// (react-refresh requirement).

export type ConsultationMode = "video" | "in_person" | "phone_call";

export const CONSULTATION_TYPE_OPTIONS: {
  value: ConsultationMode;
  label: string;
}[] = [
  { value: "video", label: "Video call" },
  { value: "phone_call", label: "Phone call" },
  { value: "in_person", label: "In person" },
];

export const DURATION_PRESETS = [30, 45, 60, 90] as const;
export type DurationChoice = (typeof DURATION_PRESETS)[number] | "custom";

export function consultationModeLabel(mode: ConsultationMode): string {
  return (
    CONSULTATION_TYPE_OPTIONS.find((o) => o.value === mode)?.label ??
    "Video call"
  );
}

export const invalidColor = "#ff2d55";

export const fieldStyles = {
  w: "full",
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
};
