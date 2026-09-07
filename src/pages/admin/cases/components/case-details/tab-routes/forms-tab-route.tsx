import { useParams } from "react-router";
import { FormsTab } from "../tabs/forms";

export function CaseFormsTabRoute() {
  const { caseId } = useParams<{ caseId: string }>();
  return <FormsTab caseId={caseId!} isActive={true} />;
}
