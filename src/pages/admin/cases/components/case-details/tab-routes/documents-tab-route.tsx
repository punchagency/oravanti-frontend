import { useParams } from "react-router";
import { Documents } from "../tabs/documents";

export function CaseDocumentsTabRoute() {
  const { caseId } = useParams<{ caseId: string }>();
  return <Documents caseId={caseId!} />;
}