import { CaseDetailsDrawer } from "@/pages/admin/cases/components/case-details/drawer";
import type { ReactNode } from "react";
import { useState } from "react";

interface CaseDrawerOpenerProps {
  caseId: string;
  children: ReactNode;
}

export function CaseDrawerOpener({ caseId, children }: CaseDrawerOpenerProps) {
  const [open, setOpen] = useState(false);

  return (
    <CaseDetailsDrawer
      caseId={caseId}
      open={open}
      onOpenChange={({ open: isOpen }) => setOpen(isOpen)}
    >
      {children}
    </CaseDetailsDrawer>
  );
}
