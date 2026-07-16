import { useParams } from "react-router";
import { LeadDocumentsTab } from "../tabs/documents";

export function DocumentsTabRoute() {
  const { leadId } = useParams<{ leadId: string }>();
  return <LeadDocumentsTab leadId={leadId!} />;
}