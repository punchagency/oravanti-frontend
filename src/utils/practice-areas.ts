export type SpecialtyType =
  | "immigration"
  | "family"
  | "business"
  | "estate"
  | "employment"
  | "realestate"
  | "criminal"
  | "personalinjury";

export interface PracticeArea {
  value: string;
  label: string;
  specialty: SpecialtyType;
}

export const PRACTICE_AREAS: PracticeArea[] = [
  {
    value: "family-law",
    label: "Family law",
    specialty: "family",
  },
  {
    value: "business-corporate-law",
    label: "Business",
    specialty: "business",
  },
  {
    value: "estate-planning",
    label: "Estate planning",
    specialty: "estate",
  },
  {
    value: "employment-labor-law",
    label: "Employment / labor law",
    specialty: "employment",
  },
  {
    value: "real-estate-law",
    label: "Real estate law",
    specialty: "realestate",
  },
  {
    value: "criminal-defense",
    label: "Criminal defense",
    specialty: "criminal",
  },
  {
    value: "personal-injury",
    label: "Personal injury",
    specialty: "personalinjury",
  },
];

export function getPracticeAreaByValue(value: string): PracticeArea | undefined {
  return PRACTICE_AREAS.find((pa) => pa.value === value);
}

export function getPracticeAreaBySpecialty(
  specialty: SpecialtyType
): PracticeArea | undefined {
  return PRACTICE_AREAS.find((pa) => pa.specialty === specialty);
}
