import { useParams } from "react-router";
import { TimelineTab } from "../tabs/timeline";

export function CaseTimelineTabRoute() {
  const { caseId } = useParams<{ caseId: string }>();
  return <TimelineTab caseId={caseId!} isActive={true} />;
}
