import { useParams } from "react-router";
import { LeadOverview } from "../tabs/overview";

export function LeadOverviewTabRoute() {
  const { leadId } = useParams<{ leadId: string }>();
  return <LeadOverview leadId={leadId!} isActive={true} />;
}
