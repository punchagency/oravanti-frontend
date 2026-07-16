import { useParams } from "react-router";
import { LeadNotesTab } from "../tabs/notes";

export function NotesTabRoute() {
  const { leadId } = useParams<{ leadId: string }>();
  return <LeadNotesTab leadId={leadId!} />;
}