import { Center, Spinner, Separator } from "@chakra-ui/react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCaseById } from "@/api/cases";
import { type CaseData } from "../../shared";
import { MatterDetails } from "./matter-details";
import { PipelineProgress } from "./pipeline-progress";
import { AiReview } from "./ai-review";
import { PendingActions } from "./pending-actions";

interface OverviewProps {
  caseId: string;
}

export function Overview({ caseId }: OverviewProps) {
  const { data: caseRow, isLoading } = useQuery({
    queryKey: ["case", caseId],
    queryFn: () => getCaseById(caseId),
    staleTime: 60_000,
  });

  const caseData: CaseData | undefined = useMemo(() => {
    if (!caseRow) return undefined;
    return {
      id: caseRow.id,
      clientName: caseRow.client?.name ?? "",
      caseRef: caseRow.caseNumber,
      caseType: {
        id: caseRow.caseType?.id ?? "",
        code: caseRow.caseType?.code ?? "",
        name: caseRow.caseType?.name ?? "",
      },
      practiceArea: caseRow.practiceArea?.name ?? "",
      stage: caseRow.caseType?.subcategory?.name ?? "",
      stageDetail: {
        phase: "",
        workflowTitle: "",
        stepTitle: caseRow.caseType?.subcategory?.name ?? "",
        stepStatus: "in_progress" as const,
      },
      status: caseRow.status,
      assignedTeam: caseRow.assignee
        ? { id: caseRow.id, name: caseRow.assignee.name }
        : null,
      assignedStaff: caseRow.assignee
        ? { name: caseRow.assignee.name, role: caseRow.assignee.role }
        : null,
      filingDate: caseRow.filingDate ?? "",
      deadline: "",
      courtRef: "",
      caseProgress: caseRow.caseProgress ?? 50,
    };
  }, [caseRow]);

  if (isLoading) {
    return (
      <Center flex={1} py={10}>
        <Spinner color="brand.solid" />
      </Center>
    );
  }

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
