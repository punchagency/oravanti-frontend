import { Separator } from "@chakra-ui/react";
import { type CaseData } from "../../shared";
import { MatterDetails } from "./matter-details";
import { PipelineProgress } from "./pipeline-progress";
import { AiReview } from "./ai-review";
import { PendingActions } from "./pending-actions";

interface OverviewProps {
  caseData?: CaseData;
}

export function Overview({ caseData }: OverviewProps) {
  return (
    <>
      <MatterDetails caseData={caseData} />

      <Separator borderColor="border" my={3} />

      <PipelineProgress />

      <Separator borderColor="border" my={3} />

      <AiReview />

      <Separator borderColor="border" my={3} />

      <PendingActions />
    </>
  );
}
