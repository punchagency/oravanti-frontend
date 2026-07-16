import { useDocumentTitle } from "@/hooks/use-document-title";
import { useLocation } from "react-router";
import { CaseOpeningView } from "./components/case-opening-view";
import { ConflictCheckView } from "./components/conflict-check-view";
import { ConsultationView } from "./components/consultation-view";
import { MyIntakeTasks } from "./components/my-intake-tasks";
import { PipelineFrame } from "./components/pipeline-frame";
import { QuestionnaireView } from "./components/questionnaire-view";

type IntakeView =
  | "conflict-check"
  | "questionnaire"
  | "consultation"
  | "case-opening"
  | "my-tasks";

const viewTitles: Record<IntakeView, string> = {
  "conflict-check": "Conflict check",
  questionnaire: "Questionnaire",
  consultation: "Consultation & notes",
  "case-opening": "Case opening",
  "my-tasks": "My intake tasks",
};

function getIntakeView(pathname: string): IntakeView {
  if (pathname.endsWith("/my-tasks")) return "my-tasks";
  if (pathname.endsWith("/conflict-check")) return "conflict-check";
  if (pathname.endsWith("/questionnaire")) return "questionnaire";
  if (pathname.endsWith("/consultation")) return "consultation";
  if (pathname.endsWith("/case-opening")) return "case-opening";
  return "conflict-check";
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
    case "my-tasks":
      return <MyIntakeTasks />;
  }
}

export function IntakePipelinePage() {
  const location = useLocation();
  const view = getIntakeView(location.pathname);
  const title = viewTitles[view];

  useDocumentTitle(`${title} - Intake pipeline - Oravanti`);

  return <PipelineFrame>{renderIntakeView(view)}</PipelineFrame>;
}

export function MyIntakeTasksPage() {
  useDocumentTitle("My intake tasks - Oravanti");

  return (
    <PipelineFrame>
      <MyIntakeTasks />
    </PipelineFrame>
  );
}
