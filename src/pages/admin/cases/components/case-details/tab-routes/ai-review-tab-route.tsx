import { MatterIssues } from "@/pages/admin/ai-review/components/matter-issues";
import { useParams } from "react-router";

export function CaseAiReviewTabRoute() {
  const { caseId } = useParams<{ caseId: string }>();
  return <MatterIssues caseId={caseId!} />;
}
