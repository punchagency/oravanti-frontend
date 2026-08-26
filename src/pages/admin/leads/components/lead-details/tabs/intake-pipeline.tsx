
import type { Task, TaskStatus } from "@/api/tasks";
import { conflictStatusLabels, type LeadDetail } from "@/api/leads";
import { TaskAssigneeSelect } from "@/components/ui/task-assignee-select";
import { TaskReviewThread } from "@/components/ui/task-review-thread";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { useLeadById } from "@/hooks/use-leads";
import {
  useAssignTask,
  useTasks,
  useTransitionTask,
  useUpdateTask,
} from "@/hooks/use-tasks";
import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  HStack,
  Menu,
  Portal,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ExternalLink,
  MessageSquare,
  Play,
  RotateCcw,
  SkipForward,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  leadStagePath,
  pipelineOrigin,
  pipelineStageColors,
  pipelineStageLabels,
  taskStatusColors,
} from "../../intake-pipeline/shared/constants";
import { SectionLabel } from "../shared";

/**
 * Statuses a task can be brought back from. Mirrors the backend's
 * `TRANSITIONS.reopen`: work gets marked done in error, or skipped and then
 * turns out to matter, and without a way back the firm is left with a wrong
 * record or a duplicate task beside it.
 */
const REOPENABLE_STATUSES = new Set(["completed", "skipped", "rejected"]);

const consultationStatusLabels: Record<string, string> = {
  pending_payment: "Awaiting payment",
  awaiting_slot_selection: "Awaiting slot",
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

const feeAgreementStatusLabels: Record<string, string> = {
  draft: "Draft",
  pending_signature: "Awaiting signature",
  signed: "Signed",
  voided: "Voided",
};

const stageStatusColors: Record<
  string,
  { bg: string; color: string; borderColor: string }
> = {
  pass: {
    bg: "green.subtle",
    color: "green.fg",
    borderColor: "green.emphasized",
  },
  needs_review: {
    bg: "orange.subtle",
    color: "orange.fg",
    borderColor: "orange.emphasized",
  },
  conflict_found: {
    bg: "red.subtle",
    color: "red.fg",
    borderColor: "red.emphasized",
  },
  pending: {
    bg: "gray.subtle",
    color: "gray.fg",
    borderColor: "gray.emphasized",
  },
  scheduled: {
    bg: "blue.subtle",
    color: "blue.fg",
    borderColor: "blue.emphasized",
  },
  completed: {
    bg: "green.subtle",
    color: "green.fg",
    borderColor: "green.emphasized",
  },
  in_progress: {
    bg: "blue.subtle",
    color: "blue.fg",
    borderColor: "blue.emphasized",
  },
  cancelled: {
    bg: "red.subtle",
    color: "red.fg",
    borderColor: "red.emphasized",
  },
  no_show: { bg: "red.subtle", color: "red.fg", borderColor: "red.emphasized" },
  sent: {
    bg: "green.subtle",
    color: "green.fg",
    borderColor: "green.emphasized",
  },
  not_sent: {
    bg: "gray.subtle",
    color: "gray.fg",
    borderColor: "gray.emphasized",
  },
  draft: {
    bg: "gray.subtle",
    color: "gray.fg",
    borderColor: "gray.emphasized",
  },
  pending_signature: {
    bg: "orange.subtle",
    color: "orange.fg",
    borderColor: "orange.emphasized",
  },
  signed: {
    bg: "green.subtle",
    color: "green.fg",
    borderColor: "green.emphasized",
  },
  voided: { bg: "red.subtle", color: "red.fg", borderColor: "red.emphasized" },
  converted: {
    bg: "green.subtle",
    color: "green.fg",
    borderColor: "green.emphasized",
  },
  not_converted: {
    bg: "gray.subtle",
    color: "gray.fg",
    borderColor: "gray.emphasized",
  },
};

type StageStatus = { label: string; colorKey: string };

function getStageStatus(
  stage: string,
  leadDetail: LeadDetail | undefined,
): StageStatus | null {
  if (!leadDetail) return null;

  switch (stage) {
    case "conflict_check": {
      const status = leadDetail.conflictCheck?.status ?? "pending";
      return {
        label: conflictStatusLabels[status] ?? status,
        colorKey: status,
      };
    }
    case "questionnaire": {
      const sent = Boolean(leadDetail.questionnaireSendId);
      return {
        label: sent ? "Sent" : "Not sent",
        colorKey: sent ? "sent" : "not_sent",
      };
    }
    case "consultation": {
      const status = leadDetail.consultation?.status;
      if (!status) return { label: "Not scheduled", colorKey: "not_sent" };
      return {
        label: consultationStatusLabels[status] ?? status,
        colorKey: status,
      };
    }
    case "fee_agreement": {
      const status = leadDetail.feeAgreement?.status;
      if (!status) return { label: "No agreement", colorKey: "not_sent" };
      return {
        label: feeAgreementStatusLabels[status] ?? status,
        colorKey: status,
      };
    }
    case "case_opening": {
      const converted = Boolean(leadDetail.convertedCaseId);
      return {
        label: converted ? "Case opened" : "Not converted",
        colorKey: converted ? "converted" : "not_converted",
      };
    }
    default:
      return null;
  }
}

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

export function IntakePipelineTab({
  leadId,
  isActive,
}: IntakePipelineTabProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: tasks, isLoading } = useTasks(
    { leadId, source: "pipeline" },
    isActive,
  );
  const { data: leadDetail } = useLeadById(isActive ? leadId : "");
  // Start / skip / reset are plain status edits; completing is a lifecycle move
  // that also stamps who finished it and when.
  const updateStatus = useUpdateTask();
  const transition = useTransitionTask();
  const assignTask = useAssignTask();

  // The task being (re)assigned, or null when the dialog is closed. One piece
  // of state rather than an open flag plus copies of the id and title: the
  // dialog also needs the current assignee to preselect, and a fourth parallel
  // setter is a fourth thing to forget.
  const [assignTarget, setAssignTarget] = useState<Task | null>(null);

  // The task whose review history is open. Same one-piece-of-state reasoning as
  // above, and it keeps the board a board: the exchange is a step's whole
  // submit/approve/reject story, which does not fit a table row.
  const [historyTarget, setHistoryTarget] = useState<Task | null>(null);

  // Stage pages live outside the lead detail layout, so they need to be told
  // where the reader came from to render a way back to this tab.
  function openStage(stage: string) {
    navigate(leadStagePath(leadId, stage), {
      state: pipelineOrigin(
        `${location.pathname}${location.search}`,
        "Back to intake pipeline",
      ),
    });
  }

  if (isLoading) {
    return (
      <VStack align="stretch" gap={5} py={4}>
        {Array.from({ length: 2 }, (_, groupIdx) => (
          <Box key={groupIdx}>
            <HStack gap={2} mb={2}>
              <ThemeSkeleton h="8px" w="8px" borderRadius="full" />
              <ThemeSkeleton h="12px" w="100px" borderRadius="4px" />
            </HStack>
            <Box
              border="1px solid"
              borderColor="border"
              borderRadius="8px"
              overflow="hidden"
            >
              <Table.Root w="full" tableLayout="fixed">
                <Table.Header>
                  <Table.Row bg="bg.subtle">
                    <Table.ColumnHeader px={3} py={2} w="38%">
                      <ThemeSkeleton h="10px" w="40px" borderRadius="4px" />
                    </Table.ColumnHeader>
                    <Table.ColumnHeader px={3} py={2} w="14%">
                      <ThemeSkeleton h="10px" w="45px" borderRadius="4px" />
                    </Table.ColumnHeader>
                    <Table.ColumnHeader px={3} py={2} w="18%">
                      <ThemeSkeleton h="10px" w="60px" borderRadius="4px" />
                    </Table.ColumnHeader>
                    <Table.ColumnHeader px={3} py={2} w="30%">
                      <ThemeSkeleton h="10px" w="50px" borderRadius="4px" />
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {Array.from({ length: 3 }, (_, i) => (
                    <Table.Row key={i}>
                      <Table.Cell px={3} py={2.5}>
                        <ThemeSkeleton
                          h="12px"
                          w="80%"
                          borderRadius="4px"
                          mb={1}
                        />
                        <ThemeSkeleton h="8px" w="60%" borderRadius="4px" />
                      </Table.Cell>
                      <Table.Cell px={3} py={2.5}>
                        <ThemeSkeleton h="18px" w="60px" borderRadius="full" />
                      </Table.Cell>
                      <Table.Cell px={3} py={2.5}>
                        <ThemeSkeleton h="10px" w="70%" borderRadius="4px" />
                      </Table.Cell>
                      <Table.Cell px={3} py={2.5}>
                        <HStack gap={1}>
                          <ThemeSkeleton h="24px" w="50px" borderRadius="6px" />
                          <ThemeSkeleton h="24px" w="24px" borderRadius="6px" />
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          </Box>
        ))}
      </VStack>
    );
  }

  const grouped = PIPELINE_ORDER.map((stage) => ({
    stage,
    label: pipelineStageLabels[stage],
    color: pipelineStageColors[stage],
    tasks: (tasks ?? []).filter((t) => t.phase === stage),
  }));

  return (
    <>
      <Box py={4}>
        {grouped.map((group) => {
          const stageStatus = getStageStatus(group.stage, leadDetail);
          if (group.tasks.length === 0 && !stageStatus) return null;

          const statusColors = stageStatus
            ? (stageStatusColors[stageStatus.colorKey] ??
              stageStatusColors.pending)
            : null;

          return (
            <Box key={group.stage} mb={5}>
              <HStack gap={2} mb={2} align="center">
                <Box w="8px" h="8px" borderRadius="full" bg={group.color} />
                {/* The stage heading opens the stage — the same destination the
                    row menus offer, without having to find a menu first. */}
                <Button
                  variant="plain"
                  h="auto"
                  minH="auto"
                  p={0}
                  gap={1}
                  color="fg"
                  _hover={{ color: "brand.solid", textDecoration: "underline" }}
                  onClick={() => openStage(group.stage)}
                >
                  <SectionLabel>{group.label}</SectionLabel>
                  <ArrowUpRight size={12} />
                </Button>
                {stageStatus && statusColors ? (
                  <Badge
                    size="xs"
                    borderRadius="full"
                    px={2}
                    py={0.5}
                    borderWidth="1px"
                    borderColor={statusColors.borderColor}
                    bg={statusColors.bg}
                    color={statusColors.color}
                    fontWeight="500"
                    fontSize="10px"
                    textTransform="none"
                  >
                    {stageStatus.label}
                  </Badge>
                ) : null}
              </HStack>

              {group.tasks.length === 0 ? (
                <Box
                  border="1px dashed"
                  borderColor="border.muted"
                  borderRadius="8px"
                  px={3}
                  py={5}
                  textAlign="center"
                >
                  <Text color="fg.muted" fontSize="12px">
                    No tasks in this stage yet.
                  </Text>
                </Box>
              ) : (
                <>
                  {/* Desktop table */}
                  <Box
                    border="1px solid"
                    borderColor="border"
                    borderRadius="8px"
                    overflow="hidden"
                    display={{ base: "none", md: "block" }}
                  >
                    <Table.Root w="full" tableLayout="fixed">
                      <Table.Header>
                        <Table.Row bg="bg.subtle">
                          <Table.ColumnHeader
                            px={3}
                            py={2}
                            fontSize="10px"
                            textTransform="uppercase"
                            color="fg.muted"
                            fontWeight="500"
                            w="38%"
                          >
                            Task
                          </Table.ColumnHeader>
                          <Table.ColumnHeader
                            px={3}
                            py={2}
                            fontSize="10px"
                            textTransform="uppercase"
                            color="fg.muted"
                            fontWeight="500"
                            w="14%"
                          >
                            Status
                          </Table.ColumnHeader>
                          <Table.ColumnHeader
                            px={3}
                            py={2}
                            fontSize="10px"
                            textTransform="uppercase"
                            color="fg.muted"
                            fontWeight="500"
                            w="18%"
                          >
                            Assigned To
                          </Table.ColumnHeader>
                          <Table.ColumnHeader
                            px={3}
                            py={2}
                            fontSize="10px"
                            textTransform="uppercase"
                            color="fg.muted"
                            fontWeight="500"
                            w="30%"
                          >
                            Actions
                          </Table.ColumnHeader>
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
                            onComplete={() =>
                              transition.mutate({ taskId: task.id, transition: "complete" })
                            }
                            onAction={() => openStage(task.phase ?? group.stage)}
                            onOpenAssignDialog={() => setAssignTarget(task)}
                            onOpenHistory={() => setHistoryTarget(task)}
                            onReopen={() =>
                              transition.mutate({ taskId: task.id, transition: "reopen" })
                            }
                          />
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Box>

                  {/* Mobile cards */}
                  <Box display={{ base: "block", md: "none" }}>
                    {group.tasks.map((task) => (
                      <MobileTaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={(status) =>
                          updateStatus.mutate({ taskId: task.id, status })
                        }
                        onComplete={() =>
                              transition.mutate({ taskId: task.id, transition: "complete" })
                            }
                        onAction={() => openStage(task.phase ?? group.stage)}
                        onOpenAssignDialog={() => setAssignTarget(task)}
                            onOpenHistory={() => setHistoryTarget(task)}
                            onReopen={() =>
                              transition.mutate({ taskId: task.id, transition: "reopen" })
                            }
                      />
                    ))}
                  </Box>
                </>
              )}
            </Box>
          );
        })}
      </Box>

      <AssignStaffDialog
        key={assignTarget?.id ?? "none"}
        task={assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssign={(staffId) => {
          if (!assignTarget) return;
          assignTask.mutate(
            { taskId: assignTarget.id, assignedToId: staffId },
            { onSettled: () => setAssignTarget(null) },
          );
        }}
        isPending={assignTask.isPending}
      />

      <TaskHistoryDialog task={historyTarget} onClose={() => setHistoryTarget(null)} />
    </>
  );
}

function TaskRow({
  task,
  onStatusChange,
  onComplete,
  onAction,
  onOpenAssignDialog,
  onOpenHistory,
  onReopen,
}: {
  task: Task;
  onStatusChange: (status: TaskStatus) => void;
  onComplete: () => void;
  onAction: () => void;
  onOpenAssignDialog: () => void;
  onOpenHistory: () => void;
  onReopen: () => void;
}) {
  const colors = taskStatusColors[task.status] ?? taskStatusColors.pending;

  return (
    <Table.Row>
      <Table.Cell
        px={3}
        py={2.5}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        {/* The title is the primary way into the stage; the row menu keeps
            "Go to stage" for anyone who looks for it there. */}
        <Button
          variant="plain"
          h="auto"
          minH="auto"
          p={0}
          w="full"
          justifyContent="flex-start"
          color="fg"
          fontSize="12px"
          fontWeight="500"
          _hover={{ color: "brand.solid", textDecoration: "underline" }}
          onClick={onAction}
        >
          <Text truncate>{task.title}</Text>
        </Button>
        {task.description ? (
          <Text color="fg.muted" fontSize="10px" mt={0.5} truncate>
            {task.description}
          </Text>
        ) : null}
      </Table.Cell>
      <Table.Cell
        px={3}
        py={2.5}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
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
      <Table.Cell
        px={3}
        py={2.5}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <Text color="fg.muted" fontSize="11px" truncate>
          {task.assignedTo?.name ?? "Unassigned"}
        </Text>
      </Table.Cell>
      <Table.Cell
        px={3}
        py={2.5}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <HStack gap={1}>
          <Button
            size="xs"
            h="24px"
            fontSize="10px"
            variant="outline"
            borderColor="border"
            onClick={onAction}
          >
            <ExternalLink size={10} />
            Go to stage
          </Button>

          <Menu.Root>
            <Menu.Trigger asChild>
              <Button
                size="xs"
                variant="outline"
                borderColor="border"
                h="24px"
                fontSize="10px"
                px={1.5}
                minW="auto"
              >
                <ChevronDown size={10} />
              </Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content minW="160px">
                  <Menu.Item value="go" onClick={onAction}>
                    <ExternalLink size={13} />
                    <Box flex="1">Go to stage</Box>
                  </Menu.Item>
                  {task.status !== "completed" && (
                    <Menu.Item value="complete" onClick={onComplete}>
                      <Check size={13} />
                      <Box flex="1">Mark complete</Box>
                    </Menu.Item>
                  )}
                  {task.status !== "in_progress" &&
                    task.status !== "completed" && (
                      <Menu.Item
                        value="start"
                        onClick={() => onStatusChange("in_progress")}
                      >
                        <Play size={13} />
                        <Box flex="1">Start task</Box>
                      </Menu.Item>
                    )}
                  {task.status !== "skipped" && task.status !== "completed" && (
                    <Menu.Item
                      value="skip"
                      onClick={() => onStatusChange("skipped")}
                    >
                      <SkipForward size={13} />
                      <Box flex="1">Skip task</Box>
                    </Menu.Item>
                  )}
                  <Menu.Item value="assign" onClick={onOpenAssignDialog}>
                      <UserPlus size={13} />
                      <Box flex="1">
                        {task.assignedTo ? "Reassign step" : "Assign step"}
                      </Box>
                    </Menu.Item>
                  {REOPENABLE_STATUSES.has(task.status) && (
                    <Menu.Item value="reopen" onClick={onReopen}>
                      <RotateCcw size={13} />
                      <Box flex="1">Reopen task</Box>
                    </Menu.Item>
                  )}
                  <Menu.Item value="history" onClick={onOpenHistory}>
                    <MessageSquare size={13} />
                    <Box flex="1">Review history</Box>
                  </Menu.Item>
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
      </Table.Cell>
    </Table.Row>
  );
}

function MobileTaskCard({
  task,
  onStatusChange,
  onComplete,
  onAction,
  onOpenAssignDialog,
  onOpenHistory,
  onReopen,
}: {
  task: Task;
  onStatusChange: (status: TaskStatus) => void;
  onComplete: () => void;
  onAction: () => void;
  onOpenAssignDialog: () => void;
  onOpenHistory: () => void;
  onReopen: () => void;
}) {
  const colors = taskStatusColors[task.status] ?? taskStatusColors.pending;

  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="8px"
      p={3}
      mb={2}
      bg="bg"
    >
      <Flex justify="space-between" align="flex-start" gap={2}>
        <Box flex={1} minW={0}>
          <Button
            variant="plain"
            h="auto"
            minH="auto"
            p={0}
            w="full"
            justifyContent="flex-start"
            color="fg"
            fontSize="13px"
            fontWeight="500"
            whiteSpace="normal"
            textAlign="left"
            _hover={{ color: "brand.solid", textDecoration: "underline" }}
            onClick={onAction}
          >
            {task.title}
          </Button>
          {task.description ? (
            <Text color="fg.muted" fontSize="11px" mt={0.5}>
              {task.description}
            </Text>
          ) : null}
        </Box>
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
          flexShrink={0}
        >
          {task.status.replace("_", " ")}
        </Badge>
      </Flex>

      <HStack mt={2} justify="space-between" wrap="wrap" gap={1.5}>
        <Text color="fg.muted" fontSize="11px">
          Assigned: {task.assignedTo?.name ?? "Unassigned"}
        </Text>
        <HStack gap={1}>
          <Button
            size="2xs"
            h="22px"
            fontSize="10px"
            variant="outline"
            borderColor="border"
            onClick={onAction}
          >
            <ExternalLink size={10} />
            Go to stage
          </Button>

          <Menu.Root>
            <Menu.Trigger asChild>
              <Button
                size="2xs"
                variant="outline"
                borderColor="border"
                h="22px"
                fontSize="10px"
                px={1.5}
                minW="auto"
              >
                <ChevronDown size={9} />
              </Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content minW="160px">
                  <Menu.Item value="go" onClick={onAction}>
                    <ExternalLink size={13} />
                    <Box flex="1">Go to stage</Box>
                  </Menu.Item>
                  {task.status !== "completed" && (
                    <Menu.Item value="complete" onClick={onComplete}>
                      <Check size={13} />
                      <Box flex="1">Mark complete</Box>
                    </Menu.Item>
                  )}
                  {task.status !== "in_progress" &&
                    task.status !== "completed" && (
                      <Menu.Item
                        value="start"
                        onClick={() => onStatusChange("in_progress")}
                      >
                        <Play size={13} />
                        <Box flex="1">Start task</Box>
                      </Menu.Item>
                    )}
                  {task.status !== "skipped" && task.status !== "completed" && (
                    <Menu.Item
                      value="skip"
                      onClick={() => onStatusChange("skipped")}
                    >
                      <SkipForward size={13} />
                      <Box flex="1">Skip task</Box>
                    </Menu.Item>
                  )}
                  <Menu.Item value="assign" onClick={onOpenAssignDialog}>
                      <UserPlus size={13} />
                      <Box flex="1">
                        {task.assignedTo ? "Reassign step" : "Assign step"}
                      </Box>
                    </Menu.Item>
                  {REOPENABLE_STATUSES.has(task.status) && (
                    <Menu.Item value="reopen" onClick={onReopen}>
                      <RotateCcw size={13} />
                      <Box flex="1">Reopen task</Box>
                    </Menu.Item>
                  )}
                  <Menu.Item value="history" onClick={onOpenHistory}>
                    <MessageSquare size={13} />
                    <Box flex="1">Review history</Box>
                  </Menu.Item>
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
      </HStack>
    </Box>
  );
}

/**
 * One step's submit/approve/reject exchange.
 *
 * The same thread the reviewer reads in the review queue and the assignee reads
 * in My Tasks — rendered here so the lead's own board is not the one place the
 * decisions are invisible.
 */
function TaskHistoryDialog({
  task,
  onClose,
}: {
  task: Task | null;
  onClose: () => void;
}) {
  return (
    <Dialog.Root
      open={Boolean(task)}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      size="sm"
    >
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            w="full"
            maxW="480px"
            border="1px solid"
            borderColor="border"
            borderRadius="lg"
            bg="bg"
          >
            <Dialog.Header>
              <Dialog.Title fontSize="14px" fontWeight="600">
                Review history
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Text fontSize="12px" color="fg.muted" mb={3}>
                {task?.title}
              </Text>
              {/* Mounted only while open, so the board does not fetch a thread
                  per step just to render the table. */}
              {task ? (
                <TaskReviewThread
                  taskId={task.id}
                  emptyText="Nothing submitted for review yet."
                />
              ) : null}
            </Dialog.Body>

            <Dialog.Footer gap={2}>
              <Dialog.ActionTrigger asChild>
                <Button
                  variant="outline"
                  borderColor="border"
                  size="sm"
                  fontSize="12px"
                  h="32px"
                >
                  Close
                </Button>
              </Dialog.ActionTrigger>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

/**
 * Hands one intake step to a specific person.
 *
 * Every step is auto-assigned by role when the lead's pipeline is stamped, so
 * this is almost always a *re*assignment — it opens on whoever holds the step
 * now, and says so.
 *
 * The caller keys this on the task id so it remounts per task: the preselected
 * value is initial state, and without the remount the second step opened in a
 * session would show the first one's assignee.
 */
function AssignStaffDialog({
  task,
  onClose,
  onAssign,
  isPending,
}: {
  task: Task | null;
  onClose: () => void;
  onAssign: (staffId: string) => void;
  isPending: boolean;
}) {
  const [selectedStaff, setSelectedStaff] = useState(task?.assignedTo?.id ?? "");
  const isReassign = Boolean(task?.assignedTo);

  return (
    <Dialog.Root
      open={Boolean(task)}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      size="sm"
    >
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            w="full"
            maxW="420px"
            border="1px solid"
            borderColor="border"
            borderRadius="lg"
            bg="bg"
          >
            <Dialog.Header>
              <Dialog.Title fontSize="14px" fontWeight="600">
                {isReassign ? "Reassign step" : "Assign step"}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={3} align="stretch">
                <Text fontSize="12px" color="fg.muted">
                  {isReassign ? "Reassign" : "Assign"} "
                  <Text as="span" fontWeight="500" color="fg">
                    {task?.title}
                  </Text>
                  "
                  {task?.assignedTo ? (
                    <>
                      , currently with{" "}
                      <Text as="span" fontWeight="500" color="fg">
                        {task.assignedTo.name}
                      </Text>
                    </>
                  ) : null}
                </Text>

                <Box>
                  <Text
                    fontSize="10px"
                    fontWeight="500"
                    color="fg.subtle"
                    textTransform="uppercase"
                    letterSpacing="0.5px"
                    mb={1}
                  >
                    Staff member
                  </Text>
                  {/* Same picker the case workflow uses, so one rule decides
                      who may hold a task. An intake step has no team, so this
                      lists the firm — the component reads that off the task. */}
                  {task ? (
                    <TaskAssigneeSelect
                      taskId={task.id}
                      value={selectedStaff}
                      onChange={setSelectedStaff}
                      ariaLabel="Staff member to assign"
                    />
                  ) : null}
                </Box>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer gap={2}>
              <Dialog.ActionTrigger asChild>
                <Button
                  variant="outline"
                  borderColor="border"
                  size="sm"
                  fontSize="12px"
                  h="32px"
                >
                  Cancel
                </Button>
              </Dialog.ActionTrigger>
              <Button
                bg="brand.solid"
                color="brand.contrast"
                size="sm"
                fontSize="12px"
                h="32px"
                onClick={() => onAssign(selectedStaff)}
                loading={isPending}
                // Nothing to do when the preselected assignee is still selected.
                disabled={!selectedStaff || selectedStaff === task?.assignedTo?.id}
                _hover={{ bg: "brand.solid/90" }}
              >
                <UserPlus size={14} />
                {isReassign ? "Reassign" : "Assign"}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
