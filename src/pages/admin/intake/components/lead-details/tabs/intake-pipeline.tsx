import {
  Badge,
  Box,
  Button,
  HStack,
  Menu,
  Portal,
  Skeleton,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router";
import {
  useLeadTasks,
  useInitializePipeline,
  useUpdateLeadTaskStatus,
  useCompleteLeadTask,
} from "@/hooks/use-lead-workflows";
import type { LeadTask, LeadTaskStatus } from "@/api/lead-workflows";
import { useRunConflictCheck } from "@/hooks/use-leads";
import { SectionLabel } from "../shared";
import { pipelineStageColors, pipelineStageLabels, taskStatusColors } from "../constants";
import { Check, ChevronDown, ExternalLink, Play, RotateCcw, SkipForward } from "lucide-react";

interface IntakePipelineTabProps {
  leadId: string;
  isActive: boolean;
}

const PIPELINE_ORDER = [
  "conflict_check",
  "questionnaire",
  "consultation",
  "fee_agreement",
  "case_opening",
] as const;

export function IntakePipelineTab({ leadId, isActive }: IntakePipelineTabProps) {
  const navigate = useNavigate();

  function stagePath(stage: string) {
    const suffix: Record<string, string> = {
      conflict_check: "conflict-check",
      questionnaire: "questionnaire",
      consultation: "consultation",
      fee_agreement: "consultation",
      case_opening: "case-opening",
    };
    return `/leads/${leadId}/${suffix[stage] ?? "conflict-check"}`;
  }
  const { data: tasks, isLoading } = useLeadTasks(isActive ? leadId : "");
  const initPipeline = useInitializePipeline();
  const updateStatus = useUpdateLeadTaskStatus(leadId);
  const completeTask = useCompleteLeadTask(leadId);
  const runConflictCheck = useRunConflictCheck();

  const needsInit = isActive && !isLoading && !tasks?.length;

  function handleAction(task: LeadTask) {
    if (task.actionType === "run_conflict_check") {
      runConflictCheck.mutate(task.leadId, {
        onSuccess: () => {
          completeTask.mutate(task.id);
        },
      });
      return;
    }
    navigate(stagePath(task.pipelineStage));
  }

  if (isLoading) {
    return (
      <VStack align="stretch" gap={3} py={4}>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} h="36px" borderRadius="6px" />
        ))}
      </VStack>
    );
  }

  if (needsInit) {
    return (
      <VStack align="center" gap={3} py={8}>
        <Text color="fg.muted" fontSize="13px">
          No pipeline steps initialized yet
        </Text>
        <Button
          size="sm"
          onClick={() => initPipeline.mutate(leadId)}
          loading={initPipeline.isPending}
        >
          Initialize Pipeline Steps
        </Button>
      </VStack>
    );
  }

  const grouped = PIPELINE_ORDER.map((stage) => ({
    stage,
    label: pipelineStageLabels[stage],
    color: pipelineStageColors[stage],
    tasks: (tasks ?? []).filter((t) => t.pipelineStage === stage),
  }));

  return (
    <Box py={4}>
      {grouped.map((group) => {
        if (group.tasks.length === 0) return null;

        return (
          <Box key={group.stage} mb={5}>
            <HStack gap={2} mb={2}>
              <Box w="8px" h="8px" borderRadius="full" bg={group.color} />
              <SectionLabel>{group.label}</SectionLabel>
            </HStack>

            <Box
              border="1px solid"
              borderColor="border"
              borderRadius="8px"
              overflow="hidden"
            >
              <Table.Root minW="600px">
                <Table.Header>
                  <Table.Row bg="bg.subtle">
                    <Table.ColumnHeader px={3} py={2} fontSize="10px" textTransform="uppercase" color="fg.muted" fontWeight="500">Task</Table.ColumnHeader>
                    <Table.ColumnHeader px={3} py={2} fontSize="10px" textTransform="uppercase" color="fg.muted" fontWeight="500">Status</Table.ColumnHeader>
                    <Table.ColumnHeader px={3} py={2} fontSize="10px" textTransform="uppercase" color="fg.muted" fontWeight="500">Assigned To</Table.ColumnHeader>
                    <Table.ColumnHeader px={3} py={2} fontSize="10px" textTransform="uppercase" color="fg.muted" fontWeight="500" w="120px">Actions</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {group.tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onStatusChange={(status) =>
                        updateStatus.mutate({ taskId: task.id, status })
                      }
                      onComplete={() => completeTask.mutate(task.id)}
                      onAction={() => handleAction(task)}
                    />
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function TaskRow({
  task,
  onStatusChange,
  onComplete,
  onAction,
}: {
  task: LeadTask;
  onStatusChange: (status: LeadTaskStatus) => void;
  onComplete: () => void;
  onAction: () => void;
}) {
  const colors = taskStatusColors[task.status] ?? taskStatusColors.pending;

  return (
    <Table.Row>
      <Table.Cell px={3} py={2.5} borderBottom="1px solid" borderColor="border.subtle">
        <Text color="fg" fontSize="12px" fontWeight="500">{task.title}</Text>
        {task.description ? (
          <Text color="fg.muted" fontSize="10px" mt={0.5}>{task.description}</Text>
        ) : null}
      </Table.Cell>
      <Table.Cell px={3} py={2.5} borderBottom="1px solid" borderColor="border.subtle">
        <Badge
          size="xs"
          borderRadius="full"
          px={2}
          py={0.5}
          borderWidth="1px"
          borderColor={colors.borderColor}
          bg={colors.bg}
          color={colors.textColor}
          fontWeight="500"
          fontSize="10px"
          textTransform="none"
        >
          {task.status.replace("_", " ")}
        </Badge>
      </Table.Cell>
      <Table.Cell px={3} py={2.5} borderBottom="1px solid" borderColor="border.subtle">
        <Text color="fg.muted" fontSize="11px">
          {task.staff?.name ?? "—"}
        </Text>
      </Table.Cell>
      <Table.Cell px={3} py={2.5} borderBottom="1px solid" borderColor="border.subtle">
        <HStack gap={1}>
          {task.actionType === "run_conflict_check" && task.status !== "completed" ? (
            <Button size="xs" h="24px" fontSize="10px" onClick={onAction}>
              Run check
            </Button>
          ) : task.status !== "completed" ? (
            <Button size="xs" h="24px" fontSize="10px" variant="outline" borderColor="border" onClick={onAction}>
              <ExternalLink size={10} />
              Go to stage
            </Button>
          ) : null}

          <Menu.Root>
            <Menu.Trigger asChild>
              <Button size="xs" variant="outline" borderColor="border" h="24px" fontSize="10px" px={1.5} minW="auto">
                <ChevronDown size={10} />
              </Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content minW="150px">
                  {task.status !== "completed" && (
                    <Menu.Item value="complete" onClick={onComplete}>
                      <Check size={13} />
                      <Box flex="1">Mark complete</Box>
                    </Menu.Item>
                  )}
                  {task.status !== "in_progress" && (
                    <Menu.Item value="start" onClick={() => onStatusChange("in_progress")}>
                      <Play size={13} />
                      <Box flex="1">Start task</Box>
                    </Menu.Item>
                  )}
                  {task.status !== "skipped" && (
                    <Menu.Item value="skip" onClick={() => onStatusChange("skipped")}>
                      <SkipForward size={13} />
                      <Box flex="1">Skip task</Box>
                    </Menu.Item>
                  )}
                  <Menu.Item value="reset" onClick={() => onStatusChange("pending")}>
                    <RotateCcw size={13} />
                    <Box flex="1">Reset to pending</Box>
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </HStack>
      </Table.Cell>
    </Table.Row>
  );
}
