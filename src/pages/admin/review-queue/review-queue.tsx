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
import { useReviewQueue, useTransitionTask } from "@/hooks/use-tasks";
import { usePaginationQueryStates } from "@/hooks/usePaginationQueryStates";
import { Box, Button, Flex, Text, VStack } from "@chakra-ui/react";
import { CheckCircle, Clock, ListChecks, RotateCcw, XCircle } from "lucide-react";
import { useCallback, useState } from "react";

/**
 * The review queue, for whichever `source` the mounting page names.
 *
 * `/cases/review-queue` and `/leads/review-queue` are separate pages — a
 * reviewer works one or the other — but this is the one implementation behind
 * both. When they were two, they drifted: only the case one grew a Rejected tab,
 * its "All" tab then quietly excluded rejected rows anyway, and neither ever
 * showed the review thread the decision was recorded in.
 */

const TABS: readonly TaskTabSpec[] = [
  // "All" names its statuses explicitly rather than sending none. The endpoint's
  // own default would do, but writing it here is what makes the Rejected rows'
  // presence on this tab visible to whoever reads it next — their absence was
  // the original bug.
  { value: "in_review,rejected,completed", label: "All" },
  { value: "in_review", label: "In Review", counted: ["in_review"] },
  { value: "rejected", label: "Rejected", counted: ["rejected"] },
  { value: "completed", label: "Approved", counted: ["completed"] },
];

const TILES: readonly TaskTileSpec[] = [
  { key: "in_review", label: "Awaiting Review", color: "orange.500", icon: Clock },
  { key: "rejected", label: "Rejected", color: "red.500", icon: XCircle },
  { key: "completed", label: "Approved", color: "green.500", icon: CheckCircle },
  { key: "total", label: "Total Items", color: "fg", icon: ListChecks },
];

export interface ReviewQueueProps {
  source: TaskSource;
  heading: string;
  description: string;
  emptyText: string;
}

export function ReviewQueue({ source, heading, description, emptyText }: ReviewQueueProps) {
  const isManager = useHasPermission("case_review", "resolve");
  const [status, setStatus] = useState<string>(TABS[0].value);
  const { currentPage, limit: pageLimit, setPagination } = usePaginationQueryStates();

  const { data, isLoading } = useReviewQueue({
    source,
    status,
    page: currentPage,
    limit: pageLimit,
  });

  const items = data?.items ?? [];
  const counts = data?.counts;
  const total = (counts?.in_review ?? 0) + (counts?.rejected ?? 0) + (counts?.completed ?? 0);

  const handleTabChange = useCallback(
    (value: string) => {
      setStatus(value);
      setPagination({ currentPage: 1 });
    },
    [setPagination],
  );

  if (!isManager) {
    return (
      <Box p={6} maxW="960px" mx="auto">
        <Text fontSize="13px" color="fg.muted">
          You do not have permission to access the review queue.
        </Text>
      </Box>
    );
  }

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
      </Flex>

      <TaskStatusTiles tiles={TILES} counts={counts} total={total} isLoading={isLoading} />

      <TaskStatusTabs tabs={TABS} value={status} onChange={handleTabChange} counts={counts} />

      {isLoading || items.length === 0 ? (
        <TaskListPlaceholder isLoading={isLoading} emptyText={emptyText} />
      ) : (
        <>
          <VStack gap={3} align="stretch">
            {items.map((task) => (
              <TaskQueueCard key={task.id} task={task} actions={<ReviewActions task={task} />} />
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

/** Approve and reject while in review; a way back once a decision is in. */
function ReviewActions({ task }: { task: TaskQueueItem }) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  // One mutation for both verbs — it already invalidates the queue, so no call
  // site here refetches by hand.
  const transition = useTransitionTask();

  // An approved step a reviewer got wrong needs a way back from here too —
  // otherwise the only route is to find the task again on someone else's board.
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

  if (task.status !== "in_review") return null;

  return (
    <>
      <Button
        size="xs"
        colorPalette="green"
        fontSize="11px"
        h="26px"
        onClick={() => setApproveOpen(true)}
        loading={transition.isPending}
      >
        <CheckCircle size={11} />
        Approve
      </Button>
      <TaskActionDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve task"
        description={`Approve "${task.title}"?`}
        confirmLabel="Approve"
        confirmIcon={<CheckCircle size={14} />}
        colorPalette="green"
        notesRequired={false}
        placeholder="Add notes (optional)..."
        onConfirm={(note) =>
          transition.mutate(
            { taskId: task.id, transition: "approve", note: note || undefined },
            { onSettled: () => setApproveOpen(false) },
          )
        }
        isPending={transition.isPending}
      />

      <Button
        size="xs"
        variant="outline"
        borderColor="red.emphasized"
        color="red.fg"
        fontSize="11px"
        h="26px"
        onClick={() => setRejectOpen(true)}
        loading={transition.isPending}
      >
        <XCircle size={11} />
        Reject
      </Button>
      <TaskActionDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject task"
        description={`Reject "${task.title}"? Provide feedback on what needs to change.`}
        confirmLabel="Reject"
        confirmIcon={<XCircle size={14} />}
        colorPalette="red"
        notesRequired
        placeholder="Explain what needs to be fixed..."
        onConfirm={(note) =>
          transition.mutate(
            { taskId: task.id, transition: "reject", note },
            { onSettled: () => setRejectOpen(false) },
          )
        }
        isPending={transition.isPending}
      />
    </>
  );
}
