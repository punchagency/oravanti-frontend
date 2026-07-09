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
import type { CaseModuleInstance, WorkflowModule } from "./types";

interface WorkflowTabProps {
  caseId: string;
  isActive?: boolean;
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

function mapBackendModule(mod: {
  moduleId: string;
  name: string;
  phase: string;
  orderIndex: number;
  activationType: string;
  activationCondition: string | null;
  status: "locked" | "active" | "completed";
  steps: {
    stepId: string;
    title: string;
    status: "pending" | "in_progress" | "completed" | "skipped" | "in_review";
    assignedTo: { id: string; name: string; role: string } | null;
    dueDate: string | null;
    completedAt: string | null;
    notes: string;
  }[];
}): { definition: WorkflowModule; instance: CaseModuleInstance } {
  const mappedSteps = mod.steps.map((s) => ({
    stepId: s.stepId,
    status: s.status === "completed" ? "complete" as const : s.status === "in_progress" ? "in_progress" as const : s.status === "in_review" ? "in_review" as const : "not_started" as const,
    assignedTo: s.assignedTo,
    assignedAt: null,
    dueDate: s.dueDate,
    completedAt: s.completedAt,
    completedBy: null,
    overrideRationale: null,
    notes: s.notes,
  }));

  const definition: WorkflowModule = {
    moduleId: mod.moduleId,
    name: mod.name,
    phase: mod.phase,
    orderIndex: mod.orderIndex,
    steps: mod.steps.map((s) => ({
      stepId: s.stepId,
      title: s.title,
      description: "",
      assignableTo: ["attorney", "paralegal"],
      requiredCertification: null,
      orderIndex: mod.steps.indexOf(s) + 1,
      defaultDurationDays: 3,
    })),
    conditionalActivation:
      mod.activationType !== "auto"
        ? {
            type: mod.activationType === "manual" ? "manual_trigger" : "condition_met",
            label: mod.activationCondition ?? "Module requires activation",
          }
        : undefined,
  };

  const instance: CaseModuleInstance = {
    moduleId: mod.moduleId,
    status: mod.status,
    steps: mappedSteps,
  };

  return { definition, instance };
}

export function WorkflowTab({ caseId, isActive = true }: WorkflowTabProps) {
  const { data: workflowInstance, isLoading, refetch } = useCaseWorkflow(caseId, isActive);

  const mergedModules: MergedModule[] = useMemo(() => {
    if (!workflowInstance) return [];
    return workflowInstance.modules.map(mapBackendModule);
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
