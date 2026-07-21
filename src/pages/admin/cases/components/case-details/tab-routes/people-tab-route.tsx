import { useParams } from "react-router";
import { People } from "../tabs/people";

export function CasePeopleTabRoute() {
  const { caseId } = useParams<{ caseId: string }>();
  return <People caseId={caseId!} />;
}
