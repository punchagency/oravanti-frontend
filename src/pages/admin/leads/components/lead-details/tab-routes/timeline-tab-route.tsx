import { useParams } from "react-router";
import { LeadTimelineTab } from "../tabs/timeline";

export function TimelineTabRoute() {
  const { leadId } = useParams<{ leadId: string }>();
  return <LeadTimelineTab leadId={leadId} />;
}
