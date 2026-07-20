import { useParams } from "react-router";
import { LeadAuditLogTab } from "../tabs/audit-log";

export function LeadAuditLogTabRoute() {
  const { leadId } = useParams<{ leadId: string }>();
  return <LeadAuditLogTab leadId={leadId} />;
}
