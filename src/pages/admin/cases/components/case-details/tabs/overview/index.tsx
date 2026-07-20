import { getCaseById } from "@/api/cases";
import { Box, HStack, Separator, VStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ThemeSkeleton } from "../../../../../../../components/ui/theme-skeleton";
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
      <VStack align="stretch" gap={0} py={4}>
        <ThemeSkeleton h="11px" w="90px" borderRadius="4px" mb={2} />
        {Array.from({ length: 7 }, (_, i) => (
          <Box
            key={i}
            borderBottom="1px solid"
            borderColor="border.muted"
            py={2}
          >
            <ThemeSkeleton
              h="10px"
              w={`${70 + i * 5}px`}
              borderRadius="4px"
              mb={1.5}
            />
            <ThemeSkeleton
              h="12px"
              w={`${100 + i * 15}px`}
              borderRadius="4px"
            />
          </Box>
        ))}

        <ThemeSkeleton h="1px" w="100%" my={3} />

        <ThemeSkeleton h="11px" w="100px" borderRadius="4px" mb={3} />
        <ThemeSkeleton h="6px" w="100%" borderRadius="full" mb={2} />
        <HStack justify="space-between">
          <ThemeSkeleton h="10px" w="50px" borderRadius="4px" />
          <ThemeSkeleton h="10px" w="30px" borderRadius="4px" />
        </HStack>

        <ThemeSkeleton h="1px" w="100%" my={3} />

        <ThemeSkeleton h="11px" w="80px" borderRadius="4px" mb={3} />
        <HStack gap={2} mb={2}>
          <ThemeSkeleton h="20px" w="20px" borderRadius="full" />
          <ThemeSkeleton h="12px" w="120px" borderRadius="4px" />
        </HStack>
        <ThemeSkeleton h="10px" w="100%" borderRadius="4px" mb={1} />
        <ThemeSkeleton h="10px" w="80%" borderRadius="4px" />

        <ThemeSkeleton h="1px" w="100%" my={3} />

        <ThemeSkeleton h="11px" w="90px" borderRadius="4px" mb={3} />
        {Array.from({ length: 3 }, (_, i) => (
          <HStack key={i} gap={2} mb={2}>
            <ThemeSkeleton h="12px" w="12px" borderRadius="4px" />
            <ThemeSkeleton
              h="12px"
              w={`${120 + i * 20}px`}
              borderRadius="4px"
            />
          </HStack>
        ))}
      </VStack>
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
