import { Box, HStack, Progress, Separator, Text, VStack } from "@chakra-ui/react";
import { useMemo, type ReactNode } from "react";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { useCaseById } from "@/hooks/use-cases";
import { useTasks } from "@/hooks/use-tasks";
import { useTriggerModule, useWorkflowTemplate } from "@/hooks/use-workflows";
import { PendingModuleNotice } from "./components/pending-module-notice";
import { TaskRow } from "./components/task-row";
import { groupTasksByPhase, stepsOf } from "./group-tasks";

interface WorkflowTabProps {
  caseId: string;
  isActive?: boolean;
}

const COMPLETED_STATUSES = new Set(["completed", "skipped", "cancelled"]);

/** The tab's empty states: one centred line, nothing else on the board. */
function EmptyNotice({ children }: { children: ReactNode }) {
  return (
    <Box py={8} textAlign="center">
      <Text fontSize="12px" color="fg.muted">
        {children}
      </Text>
    </Box>
  );
}

/**
 * The case's workflow: every task on the matter, grouped by phase, with the
 * template's not-yet-unlocked modules shown alongside.
 *
 * Reads two sources because neither is sufficient alone. The tasks are what
 * exists; the template is what *could* exist — which is the only way to tell a
 * conditional module that hasn't unlocked from one that isn't in this template
 * at all. It also carries each step's `dueDateAnchor`, which is what lets a
 * blank due date say what it is waiting for.
 */
export function WorkflowTab({ caseId, isActive = true }: WorkflowTabProps) {
  const { data: caseDetail, isLoading: isCaseLoading } = useCaseById(caseId);
  const caseTypeId = caseDetail?.caseType?.id;

  const { data: tasks, isLoading: isTasksLoading } = useTasks({ caseId }, isActive);
  const { data: template } = useWorkflowTemplate(caseTypeId, isActive);
  const triggerModule = useTriggerModule(caseId);

  /** `workflowTemplateStepId` → the step's anchor, for the due-date copy. */
  const anchorByStepId = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const mod of template?.modules ?? []) {
      for (const step of stepsOf(mod)) map.set(step.id, step.dueDateAnchor);
    }
    return map;
  }, [template]);

  const groups = useMemo(
    () => groupTasksByPhase(tasks ?? [], template),
    [tasks, template],
  );

  const completed = (tasks ?? []).filter((t) => COMPLETED_STATUSES.has(t.status)).length;
  const total = tasks?.length ?? 0;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (isTasksLoading || isCaseLoading) {
    return (
      <VStack align="stretch" gap={4} py={4}>
        <Box>
          <HStack justify="space-between" mb={1}>
            <ThemeSkeleton h="12px" w="100px" borderRadius="4px" />
            <ThemeSkeleton h="12px" w="40px" borderRadius="4px" />
          </HStack>
          <ThemeSkeleton h="6px" w="100%" borderRadius="full" />
        </Box>
        {Array.from({ length: 2 }, (_, i) => (
          <Box key={i}>
            <ThemeSkeleton h="10px" w="90px" borderRadius="4px" />
            <VStack align="stretch" gap={2} mt={2}>
              {Array.from({ length: 2 + i }, (_, j) => (
                <ThemeSkeleton key={j} h="46px" w="100%" borderRadius="6px" />
              ))}
            </VStack>
          </Box>
        ))}
      </VStack>
    );
  }

  // The team comes first: every step is assigned from it, so a workflow
  // generated before one is chosen would be a full board of work nobody can be
  // given — the backend refuses for the same reason, see
  // `materializeTasksForCase`. Until then the template's modules are
  // hypothetical, so listing them as locked under an empty 0-of-0 bar describes
  // a workflow that does not exist and buries the one thing to do about it.
  // Guarded on there being nothing materialized so a case that somehow has
  // tasks without a team still shows them rather than hiding real work.
  if (!caseDetail?.assignedTeam && total === 0) {
    return (
      <EmptyNotice>
        Assign a team to this case before generating its workflow — every step
        is assigned from the case's team.
      </EmptyNotice>
    );
  }

  return (
    <Box>
      <Box mb={4}>
        <HStack justify="space-between" mb={1}>
          <Text fontSize="11px" fontWeight="500" color="fg">
            {completed} of {total} {total === 1 ? "step" : "steps"} complete
          </Text>
          <Text fontSize="11px" fontWeight="500" color="brand.solid">
            {progressPct}%
          </Text>
        </HStack>
        <Progress.Root value={progressPct} size="sm" colorPalette="brand" borderRadius="full">
          <Progress.Track borderRadius="full">
            <Progress.Range borderRadius="full" />
          </Progress.Track>
        </Progress.Root>
      </Box>

      <Separator borderColor="border" mb={4} />

      {groups.length === 0 && (
        <EmptyNotice>
          {template
            ? "No tasks on this case yet."
            : "No workflow template is configured for this case type."}
        </EmptyNotice>
      )}

      <VStack gap={{ base: 4, md: 5 }} align="stretch">
        {groups.map((group) => (
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
              {group.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  dueDateAnchor={
                    task.workflowTemplateStepId
                      ? anchorByStepId.get(task.workflowTemplateStepId)
                      : null
                  }
                />
              ))}

              {group.pendingModules.map((mod) => (
                <PendingModuleNotice
                  key={mod.id}
                  module={mod}
                  onActivate={() => triggerModule.mutate(mod.id)}
                  isActivating={triggerModule.isPending}
                />
              ))}
            </VStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}
