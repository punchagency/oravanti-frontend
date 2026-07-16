import { useParams } from "react-router";
import { WorkflowTab } from "../tabs/workflow";

export function CaseWorkflowTabRoute() {
  const { caseId } = useParams<{ caseId: string }>();
  return <WorkflowTab caseId={caseId!} isActive={true} />;
}
