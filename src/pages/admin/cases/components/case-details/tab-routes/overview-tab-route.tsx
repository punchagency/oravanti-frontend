import { useParams } from "react-router";
import { Overview } from "../tabs/overview";

export function CaseOverviewTabRoute() {
  const { caseId } = useParams<{ caseId: string }>();
  return <Overview caseId={caseId!} isActive={true} />;
}
