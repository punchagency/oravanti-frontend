import { useParams } from "react-router";
import { AuditLogTab } from "../tabs/audit-log";

export function CaseAuditLogTabRoute() {
  const { caseId } = useParams<{ caseId: string }>();
  return <AuditLogTab caseId={caseId!} isActive={true} />;
}
