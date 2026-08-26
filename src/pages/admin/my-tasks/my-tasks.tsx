import type { TaskQueueItem } from "@/api/task-queue";
import type { TaskSource } from "@/api/tasks";
import { PageTitle } from "@/components/layout/shared/nav-context";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { TaskActionDialog } from "@/components/ui/task-action-dialog";
import {
  TaskListPlaceholder,
  TaskQueueCard,
  TaskStatusTabs,
  TaskStatusTiles,
  type TaskTabSpec,
  type TaskTileSpec,
} from "@/components/ui/task-queue";
import { useHasPermission } from "@/hooks/use-has-permission";
import { useMyTasks, useTransitionTask, useUpdateTask } from "@/hooks/use-tasks";
import { usePaginationQueryStates } from "@/hooks/usePaginationQueryStates";
import { Box, Button, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import {
  CheckCircle,
  Clock,
  ListChecks,
  Play,
  RotateCcw,
  SendHorizontal,
  XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Link } from "react-router";

/**
 * One person's tasks, for whichever `source` the mounting page names.
 *
 * The same component, endpoint and card as the review queue — deliberately. The
 * submitter and the reviewer are looking at the same task, and when these were
 * separate implementations the submitter's view was the poorer one: it showed a
 * title and a due date where the reviewer got context and a decision history.
 */

const TABS: readonly TaskTabSpec[] = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending", counted: ["pending"] },
  { value: "in_progress", label: "In Progress", counted: ["in_progress"] },
  { value: "in_review", label: "In Review", counted: ["in_review"] },
  { value: "rejected", label: "Rejected", counted: ["rejected"] },
  { value: "completed", label: "Completed", counted: ["completed"] },
];

const TILES: readonly TaskTileSpec[] = [
  { key: "in_progress", label: "In Progress", color: "blue.500", icon: RotateCcw },
  { key: "in_review", label: "Awaiting Review", color: "orange.500", icon: Clock },
  { key: "rejected", label: "Sent Back", color: "red.500", icon: XCircle },
  { key: "completed", label: "Completed", color: "green.500", icon: CheckCircle },
  { key: "total", label: "Total Tasks", color: "fg", icon: ListChecks },
];

export interface MyTasksProps {
  source: TaskSource;
  heading: string;
  description: string;
  emptyText: string;
  /** Where the matching review queue lives, for the shortcut in the header. */
  reviewQueuePath: string;
}

export function MyTasks({
  source,
  heading,
  description,
  emptyText,
  reviewQueuePath,
}: MyTasksProps) {
  const isManager = useHasPermission("case_review", "resolve");
  const [status, setStatus] = useState<string>("");
  const { currentPage, limit: pageLimit, setPagination } = usePaginationQueryStates();

  const { data, isLoading } = useMyTasks({
    source,
    status: status || undefined,
    page: currentPage,
    limit: pageLimit,
  });

  const items = data?.items ?? [];
  const counts = data?.counts;
  // Every status the tabs offer — "All" lists them all, so the tile must too.
  const total = counts
    ? counts.pending +
      counts.in_progress +
      counts.in_review +
      counts.rejected +
      counts.completed +
      counts.skipped +
      counts.cancelled
    : 0;

  const handleTabChange = useCallback(
    (value: string) => {
      setStatus(value);
      setPagination({ currentPage: 1 });
    },
    [setPagination],
  );

  return (
    <Box>
      <Flex
        as="header"
        align="center"
        justify="space-between"
        gap="24px"
        py="20px"
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <Box flex="1">
          <PageTitle>
            <Text as="h1" m="0" color="fg" fontSize="24px" fontWeight="600" lineHeight="1.2">
              {heading}
            </Text>
          </PageTitle>
          <Text m="8px 0 0" color="fg.muted" fontSize="14px">
            {description}
          </Text>
        </Box>
        {isManager && (
          <HStack gap="12px" flexShrink="0">
            <Button asChild size="sm" variant="outline" borderColor="border" fontSize="13px" h="34px">
              <Link to={reviewQueuePath}>
                <CheckCircle size={15} />
                Review queue
              </Link>
            </Button>
          </HStack>
        )}
      </Flex>

      <TaskStatusTiles tiles={TILES} counts={counts} total={total} isLoading={isLoading} />

      <TaskStatusTabs tabs={TABS} value={status} onChange={handleTabChange} counts={counts} />

      {isLoading || items.length === 0 ? (
        <TaskListPlaceholder isLoading={isLoading} emptyText={emptyText} />
      ) : (
        <>
          <VStack gap={3} align="stretch">
            {items.map((task) => (
              <TaskQueueCard key={task.id} task={task} actions={<AssigneeActions task={task} />} />
            ))}
          </VStack>

          {(data?.pagination.total ?? 0) > 0 && (
            <Box mt={5}>
              <PaginationControls
                total={data!.pagination.total}
                currentPage={currentPage}
                limit={pageLimit}
                onPageChange={(page) => setPagination({ currentPage: page, limit: pageLimit })}
                onLimitChange={(newLimit) => setPagination({ currentPage: 1, limit: newLimit })}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

/** What the person the task is assigned to can do about it, from here. */
function AssigneeActions({ task }: { task: TaskQueueItem }) {
  const [submitOpen, setSubmitOpen] = useState(false);
  // Starting a task is a plain status edit; the rest are lifecycle moves that
  // also write the review thread.
  const start = useUpdateTask();
  const transition = useTransitionTask();

  const rejected = task.status === "rejected";

  // Closed by mistake, or skipped and now it matters. Same verb as a rejected
  // task's Reopen, and the same audited correction.
  if (task.status === "completed" || task.status === "skipped") {
    return (
      <Button
        size="xs"
        variant="outline"
        borderColor="border"
        fontSize="11px"
        h="26px"
        onClick={() => transition.mutate({ taskId: task.id, transition: "reopen" })}
        loading={transition.isPending}
      >
        <RotateCcw size={11} />
        Reopen
      </Button>
    );
  }

  if (task.status === "pending") {
    return (
      <Button
        size="xs"
        bg="brand.solid"
        color="brand.contrast"
        fontSize="11px"
        h="26px"
        _hover={{ bg: "brand.solid/90" }}
        onClick={() => start.mutate({ taskId: task.id, status: "in_progress" })}
        loading={start.isPending}
      >
        <Play size={11} />
        Start
      </Button>
    );
  }

  if (task.status !== "in_progress" && !rejected) return null;

  return (
    <>
      {rejected && (
        /* Reopening is the assignee's move, not the reviewer's: the feedback has
           to be read before the task quietly becomes work-in-progress again. */
        <Button
          size="xs"
          variant="outline"
          borderColor="border"
          fontSize="11px"
          h="26px"
          onClick={() => transition.mutate({ taskId: task.id, transition: "reopen" })}
          loading={transition.isPending}
        >
          <RotateCcw size={11} />
          Reopen
        </Button>
      )}
      <Button
        size="xs"
        colorPalette="yellow"
        fontSize="11px"
        h="26px"
        onClick={() => setSubmitOpen(true)}
        loading={transition.isPending}
      >
        <SendHorizontal size={11} />
        {rejected ? "Resubmit" : "Submit for review"}
      </Button>
      {/* Shared by both: the backend accepts a resubmission straight from
          `rejected`, without a reopen first. */}
      <TaskActionDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        title={rejected ? "Resubmit for review" : "Submit for review"}
        description={
          rejected
            ? `Send "${task.title}" back for review after addressing the feedback?`
            : `Mark "${task.title}" as ready for review?`
        }
        confirmLabel={rejected ? "Resubmit" : "Submit"}
        confirmIcon={<SendHorizontal size={14} />}
        colorPalette="yellow"
        notesRequired={false}
        placeholder={
          rejected ? "Describe what you changed…" : "Add notes about what was completed..."
        }
        onConfirm={(note) =>
          transition.mutate(
            { taskId: task.id, transition: "submit-review", note: note || undefined },
            { onSettled: () => setSubmitOpen(false) },
          )
        }
        isPending={transition.isPending}
      />
    </>
  );
}
