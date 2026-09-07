import { useParams } from "react-router";
import { QuestionnaireTab } from "../tabs/questionnaire";

export function CaseQuestionnaireTabRoute() {
  const { caseId } = useParams<{ caseId: string }>();
  return <QuestionnaireTab caseId={caseId!} isActive={true} />;
}
