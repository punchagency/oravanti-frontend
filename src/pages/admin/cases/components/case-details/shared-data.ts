export const matterFields = [
  { label: "Case type", key: "caseType" },
  { label: "Practice area", key: "practiceArea" },
  { label: "Case reference", key: "caseRef" },
  { label: "Opened", key: "createdAt" },
  { label: "Team", key: "assignedTeam" },
  { label: "Current stage", key: "currentStep" },
  { label: "Status", key: "status" },
];

export const statusBadgeStyle: Record<string, { borderColor: string; textColor: string; bg: string }> = {
  Filed: { borderColor: "brand.emphasized", textColor: "brand.fg", bg: "brand.subtle" },
  Active: { borderColor: "brand.emphasized", textColor: "brand.fg", bg: "brand.subtle" },
  Closed: { borderColor: "border", textColor: "fg.muted", bg: "bg.subtle" },
  RFE: { borderColor: "brand.solid", textColor: "brand.contrast", bg: "brand.solid" },
};

export interface CaseData {
  id: string;
  clientName: string;
  caseRef: string;
  caseType: { id: string; name: string };
  practiceArea: string;
  status: string;
  createdAt: string;
  assignedTeam: { id: string; name: string } | null;
  currentStep: string | null;
}
