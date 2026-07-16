import { useParams } from "react-router";
import { IntakePipelineTab } from "../tabs/intake-pipeline";

export function IntakePipelineTabRoute() {
  const { leadId } = useParams<{ leadId: string }>();
  return <IntakePipelineTab leadId={leadId!} isActive={true} />;
}
