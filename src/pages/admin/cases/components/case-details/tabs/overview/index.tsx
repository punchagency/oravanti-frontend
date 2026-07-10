import { Center, Separator, Spinner } from "@chakra-ui/react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCaseById } from "@/api/cases";
import { type CaseData } from "../../shared";
import { AiReview } from "./ai-review";
import { MatterDetails } from "./matter-details";
import { PendingActions } from "./pending-actions";
import { PipelineProgress } from "./pipeline-progress";

interface OverviewProps {
  caseId: string;
  isActive?: boolean;
}

export function Overview({ caseId, isActive = true }: OverviewProps) {
  const { data: caseRow, isLoading } = useQuery({
    queryKey: ["case", caseId],
    queryFn: () => getCaseById(caseId),
    enabled: Boolean(caseId) && isActive,
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
        name: caseRow.caseType?.name ?? "",
      },
      practiceArea: caseRow.practiceArea?.name ?? "",
      status: caseRow.status,
      createdAt: caseRow.createdAt ?? "",
      assignedTeam: caseRow.assignedTeam
        ? { id: caseRow.assignedTeam.id, name: caseRow.assignedTeam.name }
        : null,
      currentStep: caseRow.currentStep ?? null,
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
