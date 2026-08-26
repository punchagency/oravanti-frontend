import {
  Badge,
  Box,
  Button,
  HStack,
  Menu,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  CheckCircle,
  // Lock, // restore with the Locked badge below
  MoreHorizontal,
  RotateCcw,
  SkipForward,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import type { Task } from "@/api/tasks";
import { TaskAssigneeSelect } from "@/components/ui/task-assignee-select";
import { TaskGuidance } from "@/components/ui/task-guidance";
import { useAssignTask, useTransitionTask, useUpdateTask } from "@/hooks/use-tasks";
import { describeDueDate } from "../describe";
import { OverrideDialog } from "./override-dialog";
import { TaskStatusIcon } from "./task-status-icon";

interface TaskRowProps {
  task: Task;
  /** The template step's `dueDateAnchor`, so a null due date can name what it waits on. */
  dueDateAnchor?: string | null;
}

const CLOSED_STATUSES = new Set(["completed", "skipped", "cancelled"]);

/**
 * Statuses a step can be brought back from. Mirrors the backend's
 * `TRANSITIONS.reopen`, so the menu never offers a move the API refuses —
 * `cancelled` is closed but not reopenable.
 */
const REOPENABLE_STATUSES = new Set(["completed", "skipped", "rejected"]);

/**
 * One task in the workflow tab.
 *
 * Field edits go through `PATCH /tasks/:id`; assigning and reopening are their
 * own verbs, because each carries a rule a generic patch does not — a case task
 * may only go to someone on the case's team, and reopening clears who completed
 * the step and records the correction on the case timeline.
 *
 * The one branch that matters: skipping a **locked** step routes through
 * `OverrideDialog`, which will not submit without a rationale. Completing one
 * does not — locking protects the deadline, not the work.
 */
export function TaskRow({ task, dueDateAnchor }: TaskRowProps) {
  const updateTask = useUpdateTask();
  // Assignment is its own verb, not a field patch: a case task may only go to
  // someone on the case's team, and the handover is recorded on the timeline.
  const assignTask = useAssignTask();
  // Reopening is a lifecycle move, not a status patch: it clears who completed
  // the step and when, and writes the correction to the case timeline.
  const transition = useTransitionTask();
  const [assigning, setAssigning] = useState(false);

  const due = describeDueDate(task.dueDate, dueDateAnchor);
  const isClosed = CLOSED_STATUSES.has(task.status);
  const canReopen = REOPENABLE_STATUSES.has(task.status);

  const patch = (params: Parameters<typeof updateTask.mutate>[0]) =>
    updateTask.mutate(params);

  const assign = (staffId: string) => {
    setAssigning(false);
    assignTask.mutate({ taskId: task.id, assignedToId: staffId });
  };

  const skip = (overrideRationale?: string) =>
    patch({ taskId: task.id, status: "skipped", overrideRationale });

  return (
    <Box
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="6px"
      px={2.5}
      py={2}
      bg={isClosed ? "bg.subtle" : "bg"}
      opacity={isClosed ? 0.75 : 1}
    >
      <HStack align="start" gap={2}>
        <Box pt="1px">
          <TaskStatusIcon status={task.status} />
        </Box>

        <VStack align="stretch" gap={1} flex={1} minW={0}>
          <HStack gap={1.5} minW={0}>
            <Text
              fontSize="12px"
              fontWeight="500"
              color="fg"
              
            >
              {task.title}
            </Text>

            {/* Locked badge parked until a step's deadline can be changed from
                the UI. The lock only guards the due date, so with no way to edit
                one the badge warns about a rule nobody can reach. The skip path
                below still enforces it. Restore this (and the `Lock` import)
                alongside due-date editing.

            {task.isLocked && (
              <Badge
                size="xs"
                borderRadius="full"
                px={1.5}
                bg="orange.50"
                color="orange.700"
                fontSize="9px"
                fontWeight="500"
                textTransform="none"
                whiteSpace="nowrap"
                title="Locked step from the firm's template — changing its deadline needs a recorded reason"
              >
                <Lock size={8} />
                Locked
              </Badge>
            )} */}

            {!task.isRequired && (
              <Badge
                size="xs"
                borderRadius="full"
                px={1.5}
                bg="bg.subtle"
                color="fg.subtle"
                fontSize="9px"
                fontWeight="500"
                textTransform="none"
              >
                Optional
              </Badge>
            )}
          </HStack>

          {task.description && (
            <Text fontSize="11px" color="fg.muted">
              {task.description}
            </Text>
          )}

          <HStack gap={3} fontSize="10px" color="fg.subtle" flexWrap="wrap">
            <Text color={due.isPending ? "fg.subtle" : "fg.muted"} fontStyle={due.isPending ? "italic" : undefined}>
              {due.text}
            </Text>
            {task.assignedTo ? (
              <Text>{task.assignedTo.name}</Text>
            ) : (
              <Text color="orange.600">Unassigned</Text>
            )}
          </HStack>

          {/* Owns its own disclosure, and renders nothing at all when the task
              carries no guidance — ad-hoc work and pipeline steps have none. */}
          <TaskGuidance task={task} size="xs" />

          {task.overrideRationale && (
            <Text fontSize="10px" color="orange.700">
              Override: {task.overrideRationale}
            </Text>
          )}

          {assigning && (
            <Box mt={1} maxW="320px">
              <TaskAssigneeSelect
                taskId={task.id}
                value={task.assignedTo?.id ?? ""}
                onChange={assign}
                ariaLabel={`Assign ${task.title}`}
              />
            </Box>
          )}
        </VStack>

        {/* A closed step keeps its menu, holding one item. Work gets marked
            done in error, or skipped and then turns out to matter, and hiding
            the menu left the firm with a wrong record or a duplicate task
            beside it as the only ways out. */}
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button
              variant="ghost"
              size="xs"
              h="24px"
              minW="24px"
              px={1}
              aria-label={`Actions for ${task.title}`}
            >
              <MoreHorizontal size={13} />
            </Button>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content minW="180px">
                {isClosed ? (
                  <Menu.Item
                    value="reopen"
                    disabled={!canReopen}
                    fontSize="12px"
                    onClick={() =>
                      transition.mutate({ taskId: task.id, transition: "reopen" })
                    }
                  >
                    <RotateCcw size={12} />
                    Reopen step
                  </Menu.Item>
                ) : (
                  <>
                    <Menu.Item
                      value="assign"
                      fontSize="12px"
                      onClick={() => setAssigning((v) => !v)}
                    >
                      <UserPlus size={12} />
                      {task.assignedTo ? "Reassign" : "Assign"}
                    </Menu.Item>

                    <Menu.Item
                      value="complete"
                      fontSize="12px"
                      onClick={() => patch({ taskId: task.id, status: "completed" })}
                    >
                      <CheckCircle size={12} />
                      Mark complete
                    </Menu.Item>

                    {task.isLocked ? (
                      <OverrideDialog
                        taskTitle={task.title}
                        action="Skip this step"
                        isPending={updateTask.isPending}
                        onConfirm={skip}
                      >
                        {/* `closeOnSelect={false}` so the menu doesn't unmount the
                            dialog's trigger before the dialog has opened. */}
                        <Menu.Item value="skip" fontSize="12px" closeOnSelect={false}>
                          <SkipForward size={12} />
                          Skip (needs reason)
                        </Menu.Item>
                      </OverrideDialog>
                    ) : (
                      <Menu.Item value="skip" fontSize="12px" onClick={() => skip()}>
                        <SkipForward size={12} />
                        Skip
                      </Menu.Item>
                    )}
                  </>
                )}
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </HStack>
    </Box>
  );
}
