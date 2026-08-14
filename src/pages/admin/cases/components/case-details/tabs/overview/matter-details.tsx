import { useMemo } from "react";
import { FieldRow, SectionLabel } from "../../shared";
import { matterFields, type CaseData } from "../../shared-data";

interface MatterDetailsProps {
  caseData?: CaseData;
}

export function MatterDetails({ caseData }: MatterDetailsProps) {
  const values = useMemo(() => {
    if (!caseData)
      return matterFields.map((f) => ({ label: f.label, value: "—" }));
    const map: Record<string, string> = {
      caseType: caseData.caseType?.name ?? "—",
      practiceArea: caseData.practiceArea || "—",
      caseRef: caseData.caseRef || "—",
      createdAt: caseData.createdAt
        ? new Date(caseData.createdAt).toLocaleDateString()
        : "—",
      assignedTeam: caseData.assignedTeam?.name ?? "—",
      currentStep: caseData.currentStep ?? "—",
      status: caseData.status || "—",
    };
    return matterFields.map((f) => ({
      label: f.label,
      value: map[f.key] ?? "—",
    }));
  }, [caseData]);

  return (
    <>
      <SectionLabel>Matter details</SectionLabel>
      {values.map((field) => (
        <FieldRow key={field.label} label={field.label} value={field.value} />
      ))}
    </>
  );
}
