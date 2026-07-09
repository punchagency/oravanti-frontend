// Practice-area presets for the fee-agreement wizard's Costs step, matched
// case-insensitively on a substring of the firm practice-area name. Amounts are
// form strings (the wizard uses the string-input pattern). The immigration
// preset comes from the designer prototype; the other amounts are placeholder
// defaults pending designer-confirmed values — attorneys can edit every row.

export type CostPreset = {
  governmentFees: { name: string; amount: string }[];
  otherCosts: { included: boolean; name: string; amount: string }[];
};

const PRACTICE_AREA_COST_PRESETS: [string, CostPreset][] = [
  [
    "immigration",
    {
      governmentFees: [
        { name: "USCIS filing fee", amount: "535" },
        { name: "Biometrics fee", amount: "85" },
        { name: "USCIS mailing", amount: "25" },
      ],
      otherCosts: [
        { included: false, name: "Translation services", amount: "0" },
        { included: false, name: "Document courier", amount: "0" },
      ],
    },
  ],
  [
    "personal injury",
    {
      governmentFees: [{ name: "Court filing fee", amount: "402" }],
      otherCosts: [
        { included: false, name: "Medical records retrieval", amount: "0" },
        { included: false, name: "Expert witness fees", amount: "0" },
        { included: false, name: "Deposition costs", amount: "0" },
      ],
    },
  ],
  [
    "family",
    {
      governmentFees: [
        { name: "Petition filing fee", amount: "435" },
        { name: "Service of process", amount: "75" },
      ],
      otherCosts: [
        { included: false, name: "Parenting class fee", amount: "0" },
        { included: false, name: "Document courier", amount: "0" },
      ],
    },
  ],
  [
    "criminal",
    {
      governmentFees: [{ name: "Court filing fee", amount: "250" }],
      otherCosts: [
        { included: false, name: "Investigator fees", amount: "0" },
        { included: false, name: "Expert witness fees", amount: "0" },
      ],
    },
  ],
  [
    "business",
    {
      governmentFees: [{ name: "State filing fee", amount: "350" }],
      otherCosts: [
        { included: false, name: "Registered agent fee", amount: "0" },
        { included: false, name: "Document courier", amount: "0" },
      ],
    },
  ],
  [
    "employment",
    {
      governmentFees: [{ name: "Court filing fee", amount: "402" }],
      otherCosts: [
        { included: false, name: "Expert witness fees", amount: "0" },
        { included: false, name: "Deposition costs", amount: "0" },
      ],
    },
  ],
  [
    "estate",
    {
      governmentFees: [{ name: "Probate filing fee", amount: "435" }],
      otherCosts: [
        { included: false, name: "Publication notice", amount: "0" },
        { included: false, name: "Document courier", amount: "0" },
      ],
    },
  ],
  [
    "real estate",
    {
      governmentFees: [
        { name: "Recording fees", amount: "125" },
        { name: "Title search fee", amount: "150" },
      ],
      otherCosts: [
        { included: false, name: "Courier & wire fees", amount: "0" },
      ],
    },
  ],
];

export const DEFAULT_COST_PRESET: CostPreset = {
  governmentFees: [{ name: "", amount: "" }],
  otherCosts: [],
};

export function getCostPreset(practiceAreaName: string | null): CostPreset {
  if (!practiceAreaName) return DEFAULT_COST_PRESET;
  const needle = practiceAreaName.toLowerCase();
  // "real estate" must win over "estate": prefer the longest matching key.
  const match = PRACTICE_AREA_COST_PRESETS.filter(([key]) =>
    needle.includes(key),
  ).sort((a, b) => b[0].length - a[0].length)[0];
  return match?.[1] ?? DEFAULT_COST_PRESET;
}

// How well a contingency arrangement fits the practice area — drives the tag
// on the wizard's Contingency card.
export function getContingencyFit(practiceAreaName: string | null): {
  tone: "success" | "info" | "neutral";
  label: string;
} {
  const needle = (practiceAreaName ?? "").toLowerCase();
  if (needle.includes("personal injury") || needle.includes("employment"))
    return { tone: "success", label: "Common for this case type" };
  if (needle.includes("business") || needle.includes("criminal"))
    return { tone: "info", label: "Sometimes used for this case type" };
  return { tone: "neutral", label: "Less common for this case type" };
}
