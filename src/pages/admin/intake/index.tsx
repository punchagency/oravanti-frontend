import { useDocumentTitle } from "@/hooks/use-document-title";
import { useLocation } from "react-router";
import { CaseOpeningView } from "./components/case-opening-view";
import { ConflictCheckView } from "./components/conflict-check-view";
import { ConsultationView } from "./components/consultation-view";
import { LeadInboxView } from "./components/lead-inbox-view";
import { PipelineFrame } from "./components/pipeline-frame";
import { QuestionnaireView } from "./components/questionnaire-view";

type IntakeView =
  | "lead-inbox"
  | "conflict-check"
  | "questionnaire"
  | "consultation"
  | "case-opening";

const viewTitles: Record<IntakeView, string> = {
  "lead-inbox": "Intake pipeline",
  "conflict-check": "Conflict check",
  questionnaire: "Questionnaire",
  consultation: "Consultation & notes",
  "case-opening": "Case opening",
};

function getIntakeView(pathname: string): IntakeView {
  if (pathname.endsWith("/conflict-check")) return "conflict-check";
  if (pathname.endsWith("/questionnaire")) return "questionnaire";
  if (pathname.endsWith("/consultation")) return "consultation";
  if (pathname.endsWith("/case-opening")) return "case-opening";
  return "lead-inbox";
}

function renderIntakeView(view: IntakeView) {
  switch (view) {
    case "conflict-check":
      return <ConflictCheckView />;
    case "questionnaire":
      return <QuestionnaireView />;
    case "consultation":
      return <ConsultationView />;
    case "case-opening":
      return <CaseOpeningView />;
    case "lead-inbox":
      return <LeadInboxView />;
  }
}

export function IntakePipelinePage() {
  const location = useLocation();
  const view = getIntakeView(location.pathname);
  const title = viewTitles[view];

  useDocumentTitle(
    view === "lead-inbox"
      ? "Intake pipeline - Oravanti"
      : `${title} - Intake pipeline - Oravanti`,
  );

  return <PipelineFrame>{renderIntakeView(view)}</PipelineFrame>;
}
