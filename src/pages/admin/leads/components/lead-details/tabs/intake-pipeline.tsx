import type { LeadTask, LeadTaskStatus } from "@/api/lead-workflows";
import { conflictStatusLabels, type LeadDetail } from "@/api/leads";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import {
  useAssignLeadTask,
  useCompleteLeadTask,
  useLeadTasks,
  useUpdateLeadTaskStatus,
} from "@/hooks/use-lead-workflows";
import { useLeadById, useRunConflictCheck } from "@/hooks/use-leads";
import { useStaff } from "@/hooks/use-staff";
import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  HStack,
  Menu,
  Portal,
  Select,
  Table,
  Text,
  VStack,
  createListCollection,
} from "@chakra-ui/react";
import {
  Check,
  ChevronDown,
  ExternalLink,
  Play,
  RotateCcw,
  SkipForward,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import {
  pipelineStageColors,
  pipelineStageLabels,
  taskStatusColors,
} from "../../intake-pipeline/shared/constants";
import { SectionLabel } from "../shared";

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
  const { data: tasks, isLoading } = useLeadTasks(isActive ? leadId : "");
  const { data: leadDetail } = useLeadById(isActive ? leadId : "");
  const updateStatus = useUpdateLeadTaskStatus(leadId);
  const completeTask = useCompleteLeadTask(leadId);
  const assignTask = useAssignLeadTask(leadId);
  const runConflictCheck = useRunConflictCheck();
  const { data: staffList } = useStaff();

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignTaskId, setAssignTaskId] = useState<string | null>(null);
  const [assignTaskTitle, setAssignTaskTitle] = useState("");

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
    tasks: (tasks ?? []).filter((t) => t.pipelineStage === stage),
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
              <HStack gap={2} mb={2}>
                <Box w="8px" h="8px" borderRadius="full" bg={group.color} />
                <SectionLabel>{group.label}</SectionLabel>
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
                        onComplete={() => completeTask.mutate(task.id)}
                        onAction={() => handleAction(task)}
                        onOpenAssignDialog={() => {
                          setAssignTaskId(task.id);
                          setAssignTaskTitle(task.title);
                          setAssignDialogOpen(true);
                        }}
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
                    onComplete={() => completeTask.mutate(task.id)}
                    onAction={() => handleAction(task)}
                    onOpenAssignDialog={() => {
                      setAssignTaskId(task.id);
                      setAssignTaskTitle(task.title);
                      setAssignDialogOpen(true);
                    }}
                  />
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>

      <AssignStaffDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        taskTitle={assignTaskTitle}
        staffList={staffList ?? []}
        onAssign={(staffId) => {
          if (assignTaskId) {
            assignTask.mutate(
              { taskId: assignTaskId, assignedToId: staffId },
              { onSettled: () => setAssignDialogOpen(false) },
            );
          }
        }}
        isPending={assignTask.isPending}
      />
    </>
  );
}

function TaskRow({
  task,
  onStatusChange,
  onComplete,
  onAction,
  onOpenAssignDialog,
}: {
  task: LeadTask;
  onStatusChange: (status: LeadTaskStatus) => void;
  onComplete: () => void;
  onAction: () => void;
  onOpenAssignDialog: () => void;
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
        <Text color="fg" fontSize="12px" fontWeight="500" truncate>
          {task.title}
        </Text>
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
          {task.staff?.name ?? "—"}
        </Text>
      </Table.Cell>
      <Table.Cell
        px={3}
        py={2.5}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <HStack gap={1}>
          {task.actionType === "run_conflict_check" &&
          task.status !== "completed" ? (
            <Button size="xs" h="24px" fontSize="10px" onClick={onAction}>
              Run check
            </Button>
          ) : null}

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
                  {task.actionType !== "run_conflict_check" && (
                    <Menu.Item value="go" onClick={onAction}>
                      <ExternalLink size={13} />
                      <Box flex="1">Go to stage</Box>
                    </Menu.Item>
                  )}
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
                  {task.status !== "completed" && (
                    <Menu.Item value="assign" onClick={onOpenAssignDialog}>
                      <UserPlus size={13} />
                      <Box flex="1">Assign staff</Box>
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
}: {
  task: LeadTask;
  onStatusChange: (status: LeadTaskStatus) => void;
  onComplete: () => void;
  onAction: () => void;
  onOpenAssignDialog: () => void;
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
          <Text color="fg" fontSize="13px" fontWeight="500">
            {task.title}
          </Text>
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
          Assigned: {task.staff?.name ?? "—"}
        </Text>
        <HStack gap={1}>
          {task.actionType === "run_conflict_check" &&
          task.status !== "completed" ? (
            <Button size="2xs" h="22px" fontSize="10px" onClick={onAction}>
              Run check
            </Button>
          ) : null}

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
                  {task.actionType !== "run_conflict_check" && (
                    <Menu.Item value="go" onClick={onAction}>
                      <ExternalLink size={13} />
                      <Box flex="1">Go to stage</Box>
                    </Menu.Item>
                  )}
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
                  {task.status !== "completed" && (
                    <Menu.Item value="assign" onClick={onOpenAssignDialog}>
                      <UserPlus size={13} />
                      <Box flex="1">Assign staff</Box>
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
      </HStack>
    </Box>
  );
}

function AssignStaffDialog({
  open,
  onOpenChange,
  taskTitle,
  staffList,
  onAssign,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  staffList: { id: string; firstName: string; lastName: string }[];
  onAssign: (staffId: string) => void;
  isPending: boolean;
}) {
  const staffCollection = createListCollection({
    items: staffList.map((s) => ({
      label: `${s.firstName} ${s.lastName}`,
      value: s.id,
    })),
  });

  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        onOpenChange(details.open);
        if (!details.open) setSelectedStaff([]);
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
                Assign staff
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={3} align="stretch">
                <Text fontSize="12px" color="fg.muted">
                  Assign "
                  <Text as="span" fontWeight="500" color="fg">
                    {taskTitle}
                  </Text>
                  " to a staff member
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
                  <Select.Root
                    collection={staffCollection}
                    value={selectedStaff}
                    onValueChange={(e) => setSelectedStaff(e.value)}
                  >
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="Select staff member" />
                      </Select.Trigger>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {staffCollection.items.map((item) => (
                            <Select.Item key={item.value} item={item}>
                              <Select.ItemText>{item.label}</Select.ItemText>
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
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
                onClick={() => onAssign(selectedStaff[0] ?? "")}
                loading={isPending}
                disabled={selectedStaff.length === 0}
                _hover={{ bg: "brand.solid/90" }}
              >
                <UserPlus size={14} />
                Assign
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
