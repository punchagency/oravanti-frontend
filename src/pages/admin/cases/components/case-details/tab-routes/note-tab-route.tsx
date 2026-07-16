import { useParams } from "react-router";
import { Notes } from "../tabs/notes";

export function CaseNotesTabRoute() {
  const { caseId } = useParams<{ caseId: string }>();
  return <Notes caseId={caseId!} />;
}