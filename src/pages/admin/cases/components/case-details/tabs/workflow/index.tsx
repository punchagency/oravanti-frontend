import { useMemo } from "react";
import {
  Box,
  HStack,
  Progress,
  Separator,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useCaseWorkflow } from "./hooks";
import { ModuleSection } from "./components/module-section";
import { piTemplate } from "./data/pi-template";
import type { CaseModuleInstance, WorkflowModule } from "./types";

interface WorkflowTabProps {
  caseId: string;
}

interface MergedModule {
  definition: WorkflowModule;
  instance: CaseModuleInstance;
}

interface PhaseGroup {
  phase: string;
  modules: MergedModule[];
}

function groupByPhase(mergedModules: MergedModule[]): PhaseGroup[] {
  const map = new Map<string, MergedModule[]>();
  for (const m of mergedModules) {
    const phase = m.definition.phase;
    if (!map.has(phase)) map.set(phase, []);
    map.get(phase)!.push(m);
  }
  return Array.from(map.entries()).map(([phase, modules]) => ({
    phase,
    modules: modules.sort((a, b) => a.definition.orderIndex - b.definition.orderIndex),
  }));
}

export function WorkflowTab({ caseId }: WorkflowTabProps) {
  const { data: workflowInstance, isLoading, refetch } = useCaseWorkflow(caseId);

  const mergedModules: MergedModule[] = useMemo(() => {
    if (!workflowInstance) return [];
    return piTemplate.modules
      .map((def) => {
        const inst = workflowInstance.modules.find(
          (m) => m.moduleId === def.moduleId,
        );
        return inst ? { definition: def, instance: inst } : null;
      })
      .filter((m): m is MergedModule => m !== null);
  }, [workflowInstance]);

  const phaseGroups = useMemo(() => groupByPhase(mergedModules), [mergedModules]);

  const totalSteps = useMemo(
    () =>
      mergedModules.reduce(
        (sum, m) => sum + m.instance.steps.length,
        0,
      ),
    [mergedModules],
  );
  const completedSteps = useMemo(
    () =>
      mergedModules.reduce(
        (sum, m) =>
          sum + m.instance.steps.filter((s) => s.status === "complete").length,
        0,
      ),
    [mergedModules],
  );
  const progressPct =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <Box py={8} textAlign="center">
        <Text fontSize="12px" color="fg.muted">
          Loading workflow...
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={4}>
        <HStack justify="space-between" mb={1}>
          <Text fontSize="11px" fontWeight="500" color="fg">
            {completedSteps} of {totalSteps} steps complete
          </Text>
          <Text fontSize="11px" fontWeight="500" color="brand.solid">
            {progressPct}%
          </Text>
        </HStack>
        <Progress.Root
          value={progressPct}
          size="sm"
          colorPalette="brand"
          borderRadius="full"
        >
          <Progress.Track borderRadius="full">
            <Progress.Range borderRadius="full" />
          </Progress.Track>
        </Progress.Root>
      </Box>

      <Separator borderColor="border" mb={4} />

      {phaseGroups.length === 0 && (
        <Box py={8} textAlign="center">
          <Text fontSize="12px" color="fg.muted">
            No workflow data available.
          </Text>
        </Box>
      )}

      <VStack gap={{ base: 4, md: 5 }} align="stretch">
        {phaseGroups.map((group) => (
          <Box key={group.phase}>
            <Text
              fontSize="10px"
              fontWeight="600"
              color="fg.subtle"
              textTransform="uppercase"
              letterSpacing="0.8px"
              mb={2}
            >
              {group.phase}
            </Text>

            <VStack gap={2} align="stretch">
              {group.modules.map((m) => (
                <ModuleSection
                  key={m.definition.moduleId}
                  moduleDef={m.definition}
                  moduleInst={m.instance}
                  caseId={caseId}
                  onRefresh={handleRefresh}
                />
              ))}
            </VStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}
