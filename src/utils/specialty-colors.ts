export type SpecialtyType =
  | "immigration"
  | "family"
  | "business"
  | "estate"
  | "employment"
  | "realestate"
  | "criminal"
  | "personalinjury";

export interface SpecialtyColorTokens {
  bg: string;
  text: string;
  border: string;
}

export const specialtyColorMap: Record<SpecialtyType, SpecialtyColorTokens> = {
  immigration: {
    bg: "specialty.immigration.bg",
    text: "specialty.immigration.text",
    border: "specialty.immigration.border",
  },
  family: {
    bg: "specialty.family.bg",
    text: "specialty.family.text",
    border: "specialty.family.border",
  },
  business: {
    bg: "specialty.business.bg",
    text: "specialty.business.text",
    border: "specialty.business.border",
  },
  estate: {
    bg: "specialty.estate.bg",
    text: "specialty.estate.text",
    border: "specialty.estate.border",
  },
  employment: {
    bg: "specialty.employment.bg",
    text: "specialty.employment.text",
    border: "specialty.employment.border",
  },
  realestate: {
    bg: "specialty.realestate.bg",
    text: "specialty.realestate.text",
    border: "specialty.realestate.border",
  },
  criminal: {
    bg: "specialty.criminal.bg",
    text: "specialty.criminal.text",
    border: "specialty.criminal.border",
  },
  personalinjury: {
    bg: "specialty.personalinjury.bg",
    text: "specialty.personalinjury.text",
    border: "specialty.personalinjury.border",
  },
};

export function getSpecialtyColors(
  specialty: SpecialtyType | string
): SpecialtyColorTokens {
  return (
    specialtyColorMap[specialty as SpecialtyType] || specialtyColorMap.immigration
  );
}
