import { useMemo } from "react";
import {
  FieldRow,
  matterFields,
  SectionLabel,
  type CaseData,
} from "../../shared";

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
      filingDate: caseData.filingDate || "—",
      assignedTeam: caseData.assignedTeam?.name ?? "—",
      assignedStaff: caseData.assignedStaff?.name
        ? `${caseData.assignedStaff.name} (${caseData.assignedStaff.role})`
        : "—",
      stage: caseData.stage || "—",
      deadline: caseData.deadline || "—",
      courtRef: caseData.courtRef || "—",
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
