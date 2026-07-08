import { getCaseById } from "@/api/cases";
import { CaseDetailsDrawer } from "@/pages/admin/cases/components/case-details/drawer";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";

interface CaseDrawerOpenerProps {
  caseId: string;
  children: ReactNode;
}

export function CaseDrawerOpener({ caseId, children }: CaseDrawerOpenerProps) {
  const [open, setOpen] = useState(false);

  const { data: caseRow } = useQuery({
    queryKey: ["case", caseId],
    queryFn: () => getCaseById(caseId),
    enabled: open && Boolean(caseId),
    staleTime: 60_000,
  });

  const caseData = caseRow
    ? {
        id: caseRow.id,
        clientName: caseRow.client?.name ?? "",
        caseRef: caseRow.caseNumber,
        caseType: {
          id: caseRow.caseType?.id ?? "",
          code: caseRow.caseType?.code ?? "",
          name: caseRow.caseType?.name ?? "",
        },
        practiceArea: caseRow.practiceArea?.name ?? "",
        stage: caseRow.caseType?.subcategory?.name ?? "",
        stageDetail: {
          phase: "",
          workflowTitle: "",
          stepTitle: caseRow.caseType?.subcategory?.name ?? "",
          stepStatus: "in_progress" as const,
        },
        status: caseRow.status,
        assignedTeam: caseRow.assignee
          ? { id: caseRow.id, name: caseRow.assignee.name }
          : null,
        assignedStaff: caseRow.assignee
          ? { name: caseRow.assignee.name, role: caseRow.assignee.role }
          : null,
        filingDate: caseRow.filingDate ?? "",
        deadline: "",
        courtRef: "",
        caseProgress: caseRow.caseProgress ?? 50,
      }
    : undefined;

  console.log(caseData);

  return (
    <CaseDetailsDrawer
      caseId={caseId}
      caseData={caseData}
      open={open}
      onOpenChange={({ open: isOpen }) => setOpen(isOpen)}
    >
      {children}
    </CaseDetailsDrawer>
  );
}
