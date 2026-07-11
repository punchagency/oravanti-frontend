import {
  Badge,
  Box,
  Button,
  HStack,
  Menu,
  Portal,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  useLeadTasks,
  useInitializePipeline,
  useUpdateLeadTaskStatus,
  useCompleteLeadTask,
} from "@/hooks/use-lead-workflows";
import type { LeadTask, LeadTaskStatus } from "@/api/lead-workflows";
import { SectionLabel } from "../shared";
import { pipelineStageColors, pipelineStageLabels, taskStatusColors } from "../constants";
import { Check, ChevronDown, Play, RotateCcw, SkipForward } from "lucide-react";

interface IntakePipelineTabProps {
  leadId: string;
  isActive: boolean;
}

const PIPELINE_ORDER = [
  "lead_inbox",
  "conflict_check",
  "questionnaire",
  "consultation",
  "fee_agreement",
  "case_opening",
] as const;

export function IntakePipelineTab({ leadId, isActive }: IntakePipelineTabProps) {
  const { data: tasks, isLoading } = useLeadTasks(isActive ? leadId : "");
  const initPipeline = useInitializePipeline();
  const updateStatus = useUpdateLeadTaskStatus(leadId);
  const completeTask = useCompleteLeadTask(leadId);

  const needsInit = isActive && !isLoading && !tasks?.length;

  if (isLoading) {
    return (
      <VStack align="stretch" gap={3} py={4}>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} h="48px" borderRadius="8px" />
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

            <VStack align="stretch" gap={2}>
              {group.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onStatusChange={(status) =>
                    updateStatus.mutate({ taskId: task.id, status })
                  }
                  onComplete={() => completeTask.mutate(task.id)}
                />
              ))}
            </VStack>
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
}: {
  task: LeadTask;
  onStatusChange: (status: LeadTaskStatus) => void;
  onComplete: () => void;
}) {
  const colors = taskStatusColors[task.status] ?? taskStatusColors.pending;

  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="8px"
      p={3}
      bg="bg"
    >
      <HStack justify="space-between" align="flex-start">
        <Box flex={1} minW={0}>
          <HStack gap={2}>
            <Text color="fg" fontSize="13px" fontWeight="500">
              {task.title}
            </Text>
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
          </HStack>
          {task.description ? (
            <Text color="fg.muted" fontSize="11px" mt={0.5}>
              {task.description}
            </Text>
          ) : null}
          <HStack gap={3} mt={1.5}>
            {task.staff ? (
              <Text color="fg.muted" fontSize="10px">
                Assigned to: {task.staff.name}
              </Text>
            ) : (
              <Text color="fg.muted" fontSize="10px">
                Unassigned
              </Text>
            )}
            {task.dueDate ? (
              <Text color="fg.muted" fontSize="10px">
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </Text>
            ) : null}
          </HStack>
        </Box>

        <Menu.Root>
          <Menu.Trigger asChild>
            <Button
              size="xs"
              variant="outline"
              borderColor="border"
              h="26px"
              fontSize="10px"
              px={2}
              flexShrink={0}
            >
              Actions
              <ChevronDown size={10} />
            </Button>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content minW="160px">
                {task.status !== "completed" && (
                  <Menu.Item value="complete" onClick={onComplete}>
                    <Check size={13} />
                    <Box flex="1">Mark complete</Box>
                  </Menu.Item>
                )}
                {task.status !== "in_progress" && (
                  <Menu.Item
                    value="start"
                    onClick={() => onStatusChange("in_progress")}
                  >
                    <Play size={13} />
                    <Box flex="1">Start task</Box>
                  </Menu.Item>
                )}
                {task.status !== "skipped" && (
                  <Menu.Item
                    value="skip"
                    onClick={() => onStatusChange("skipped")}
                  >
                    <SkipForward size={13} />
                    <Box flex="1">Skip task</Box>
                  </Menu.Item>
                )}
                <Menu.Item
                  value="reset"
                  onClick={() => onStatusChange("pending")}
                >
                  <RotateCcw size={13} />
                  <Box flex="1">Reset to pending</Box>
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </HStack>
    </Box>
  );
}
