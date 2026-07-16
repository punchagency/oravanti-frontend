import { Badge, Box, Button, HStack, Skeleton, Table, Text, VStack } from "@chakra-ui/react";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router";
import { useMyLeadTasks, useCompleteLeadTask } from "@/hooks/use-lead-workflows";
import { useRunConflictCheck } from "@/hooks/use-leads";
import { pipelineStageColors, pipelineStageLabels, taskStatusColors } from "./lead-details/constants";
import type { LeadTask } from "@/api/lead-workflows";

const stagePaths: Record<string, string> = {
  conflict_check: "conflict-check",
  questionnaire: "questionnaire",
  consultation: "consultation",
  fee_agreement: "consultation",
  case_opening: "case-opening",
};

export function MyIntakeTasks() {
  const { data: tasks, isLoading } = useMyLeadTasks();

  if (isLoading) {
    return (
      <Box py={6}>
        <VStack align="stretch" gap={3}>
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} h="48px" borderRadius="8px" />
          ))}
        </VStack>
      </Box>
    );
  }

  const pendingTasks = (tasks ?? []).filter((t) => t.status !== "completed" && t.status !== "skipped");
  const completedTasks = (tasks ?? []).filter((t) => t.status === "completed" || t.status === "skipped");

  return (
    <Box py={6}>
      <Text color="fg" fontSize="18px" fontWeight="500" mb={1}>
        My intake tasks
      </Text>
      <Text color="fg.muted" fontSize="12px" mb={5}>
        {pendingTasks.length} pending · {completedTasks.length} completed
      </Text>

      {tasks?.length === 0 ? (
        <Text color="fg.muted" fontSize="13px">No tasks assigned to you.</Text>
      ) : (
        <Box border="1px solid" borderColor="border" borderRadius="10px" overflow="hidden">
          <Table.Root minW="800px">
            <Table.Header>
              <Table.Row bg="bg.subtle">
                <Table.ColumnHeader px={3} py={2.5} fontSize="10px" textTransform="uppercase" color="fg.muted" fontWeight="500">Lead</Table.ColumnHeader>
                <Table.ColumnHeader px={3} py={2.5} fontSize="10px" textTransform="uppercase" color="fg.muted" fontWeight="500">Task</Table.ColumnHeader>
                <Table.ColumnHeader px={3} py={2.5} fontSize="10px" textTransform="uppercase" color="fg.muted" fontWeight="500">Stage</Table.ColumnHeader>
                <Table.ColumnHeader px={3} py={2.5} fontSize="10px" textTransform="uppercase" color="fg.muted" fontWeight="500">Status</Table.ColumnHeader>
                <Table.ColumnHeader px={3} py={2.5} fontSize="10px" textTransform="uppercase" color="fg.muted" fontWeight="500" w="130px">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {tasks?.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}
    </Box>
  );
}

function TaskRow({ task }: { task: LeadTask }) {
  const navigate = useNavigate();
  const doComplete = useCompleteLeadTask(task.leadId);
  const doRunConflictCheck = useRunConflictCheck();

  const colors = taskStatusColors[task.status] ?? taskStatusColors.pending;
  const stageColor = pipelineStageColors[task.pipelineStage] ?? "border";

  function handleAction() {
    if (task.actionType === "run_conflict_check" && task.status !== "completed") {
      doRunConflictCheck.mutate(task.leadId, {
        onSuccess: () => doComplete.mutate(task.id),
      });
      return;
    }
    navigate(
      task.leadId
        ? `/leads/${task.leadId}/${stagePaths[task.pipelineStage] ?? "conflict-check"}`
        : `/leads/${stagePaths[task.pipelineStage] ?? "conflict-check"}`,
    );
  }

  return (
    <Table.Row>
      <Table.Cell px={3} py={2.5} borderBottom="1px solid" borderColor="border.subtle">
        <Text color="fg" fontSize="12px" fontWeight="500">{task.lead?.name ?? "—"}</Text>
        <Text color="fg.muted" fontSize="10px">{task.lead?.email ?? ""}</Text>
      </Table.Cell>
      <Table.Cell px={3} py={2.5} borderBottom="1px solid" borderColor="border.subtle">
        <Text color="fg" fontSize="12px">{task.title}</Text>
        {task.description ? (
          <Text color="fg.muted" fontSize="10px">{task.description}</Text>
        ) : null}
      </Table.Cell>
      <Table.Cell px={3} py={2.5} borderBottom="1px solid" borderColor="border.subtle">
        <HStack gap={1.5}>
          <Box w="6px" h="6px" borderRadius="full" bg={stageColor} />
          <Text color="fg.muted" fontSize="11px">{pipelineStageLabels[task.pipelineStage] ?? task.pipelineStage}</Text>
        </HStack>
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
        <HStack gap={1}>
          {task.status !== "completed" && task.status !== "skipped" ? (
            task.actionType === "run_conflict_check" ? (
              <Button
                size="xs"
                h="24px"
                fontSize="10px"
                onClick={handleAction}
                loading={doRunConflictCheck.isPending}
              >
                Run check
              </Button>
            ) : (
              <Button
                size="xs"
                h="24px"
                fontSize="10px"
                variant="outline"
                borderColor="border"
                onClick={handleAction}
              >
                <ExternalLink size={10} />
                Go to stage
              </Button>
            )
          ) : (
            <Text color="fg.muted" fontSize="10px">Done</Text>
          )}
          {task.status !== "completed" ? (
            <Button
              size="xs"
              h="24px"
              fontSize="10px"
              variant="outline"
              borderColor="border"
              onClick={() => doComplete.mutate(task.id)}
              loading={doComplete.isPending}
            >
              Complete
            </Button>
          ) : null}
        </HStack>
      </Table.Cell>
    </Table.Row>
  );
}
