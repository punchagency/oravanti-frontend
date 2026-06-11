import { useLocation } from "react-router";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { DashboardHeader } from "./components/dashboard-header";
import { ActivityView } from "./views/activity";
import { OverviewView } from "./views/overview";
import { PipelineView } from "./views/pipeline";

function getDashboardView(pathname: string) {
  if (pathname.endsWith("/dashboard/pipeline")) {
    return {
      title: "Pipeline dashboard - Oravanti",
      content: <PipelineView />,
    };
  }

  if (pathname.endsWith("/dashboard/activity")) {
    return {
      title: "Activity dashboard - Oravanti",
      content: <ActivityView />,
    };
  }

  return {
    title: "Dashboard - Oravanti",
    content: <OverviewView />,
  };
}

export function AdminDashboard() {
  const location = useLocation();
  const view = getDashboardView(location.pathname);

  useDocumentTitle(view.title);

  return (
    <>
      <DashboardHeader />
      {view.content}
    </>
  );
}
