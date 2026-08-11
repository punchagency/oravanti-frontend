import type { MyTaskItem } from "@/api/workflows";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PageTitle } from "@/components/layout/shared/nav-context";
import { useMyTasks, useSubmitForReview } from "@/hooks/use-workflows";
import { usePaginationQueryStates } from "@/hooks/usePaginationQueryStates";
import { useAuthStore } from "@/store/auth-store";
import { toTrailEntries } from "@/utils/workflow-trail";
import {
  Box,
  Button,
  Flex,
  HStack,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  CheckCircle,
  Clock,
  ExternalLink,
  ListChecks,
  MessageSquare,
  RotateCcw,
  SendHorizontal,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Link } from "react-router";
import { WorkflowActionDialog } from "./workflow-action-dialog";

const TABS = [
  { value: "all", label: "All" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "completed", label: "Completed" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

const statusSummaryCards = [
  {
    key: "in_progress",
    label: "In Progress",
    color: "blue.500",
    icon: RotateCcw,
  },
  {
    key: "in_review",
    label: "Awaiting Review",
    color: "orange.500",
    icon: Clock,
  },
  {
    key: "completed",
    label: "Completed",
    color: "green.500",
    icon: CheckCircle,
  },
  { key: "total", label: "Total Tasks", color: "fg", icon: ListChecks },
] as const;

export function MyTasksPage() {
  const memberRole = useAuthStore((s) => s.memberRole);
  const [tab, setTab] = useState<TabValue>("all");
  const {
    currentPage,
    limit: pageLimit,
    setPagination,
  } = usePaginationQueryStates();

  const statusParam = tab === "all" ? undefined : tab;
  const { data: response, isLoading } = useMyTasks(
    statusParam,
    currentPage,
    pageLimit,
  );

  const tasks = response?.data ?? [];
  const counts = response?.counts;
  const pagination = response?.pagination ?? {
    total: 0,
    limit: pageLimit,
    offset: 0,
  };

  const isManager = memberRole === "owner" || memberRole === "admin";

  const handleTabChange = useCallback(
    (e: { value: string }) => {
      setTab(e.value as TabValue);
      setPagination({ currentPage: 1 });
    },
    [setPagination],
  );

  return (
    <Box>
      {/* ── Header ── */}
      <Flex
        as="header"
        align="center"
        justify="space-between"
        gap="24px"
        py="20px"
        pb="20px"
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <Box flex="1">
          <PageTitle>
            <Text
              as="h1"
              m="0"
              color="fg"
              fontSize="24px"
              fontWeight="600"
              lineHeight="1.2"
            >
              My Tasks
            </Text>
          </PageTitle>
          <Text m="8px 0 0" color="fg.muted" fontSize="14px">
            Track and manage your assigned workflow steps
          </Text>
        </Box>
        {isManager && (
          <HStack gap="12px" flexShrink="0">
            <Button
              asChild
              size="sm"
              variant="outline"
              borderColor="border"
              fontSize="13px"
              h="34px"
            >
              <Link to="/cases/review-queue">
                <CheckCircle size={15} />
                Review queue
              </Link>
            </Button>
          </HStack>
        )}
      </Flex>

      {/* ── Status summary ── */}
      <Flex wrap="wrap" gap={{ base: 3, md: 4 }} my={{ base: 4, md: 6 }}>
        {statusSummaryCards.map((card) => {
          const Icon = card.icon;
          const count =
            card.key === "total"
              ? counts
                ? Object.values(counts).reduce((a, b) => a + b, 0)
                : 0
              : (counts?.[card.key as keyof typeof counts] ?? 0);
          return (
            <Box
              key={card.key}
              flex={{
                base: "1 1 calc(50% - 12px)",
                md: "1 1 calc(25% - 12px)",
              }}
              minW={{ base: 0, md: "120px" }}
              bg="bg"
              border="1px solid"
              borderColor="border"
              borderRadius="lg"
              px={{ base: 3, md: 4 }}
              py={{ base: 3, md: 4 }}
            >
              <Flex align="center" gap={2.5}>
                <Box color={card.color}>
                  <Icon size={18} />
                </Box>
                {isLoading ? (
                  <Box h="24px" w="32px" bg="bg.subtle" borderRadius="md" />
                ) : (
                  <Text
                    fontWeight="bold"
                    fontSize={{ base: "xl", md: "2xl" }}
                    color="fg"
                  >
                    {count}
                  </Text>
                )}
              </Flex>
              <Text
                mt={1}
                fontSize="13px"
                color="fg.subtle"
                whiteSpace="nowrap"
              >
                {card.label}
              </Text>
            </Box>
          );
        })}
      </Flex>

      {/* ── Tabs ── */}
      <Tabs.Root value={tab} onValueChange={handleTabChange} size="sm" mb={6}>
        <Tabs.List>
          {TABS.map((t) => (
            <Tabs.Trigger
              key={t.value}
              value={t.value}
              px={3.5}
              py={2}
              fontSize="12px"
              color="fg.muted"
              borderBottom="1px solid"
              borderColor="transparent"
              _selected={{
                color: "fg",
                borderColor: "brand.solid",
                fontWeight: "500",
              }}
            >
              {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs.Root>

      {/* ── Content ── */}
      {isLoading ? (
        <Text fontSize="13px" color="fg.muted">
          Loading tasks...
        </Text>
      ) : tasks.length === 0 ? (
        <Box
          border="1px dashed"
          borderColor="border.muted"
          borderRadius="lg"
          p={10}
          textAlign="center"
        >
          <Text fontSize="13px" color="fg.muted">
            No tasks in this category.
          </Text>
        </Box>
      ) : (
        <>
          <VStack gap={2} align="stretch">
            {tasks.map((task) => (
              <TaskCard key={task.stepId} task={task} />
            ))}
          </VStack>

          {pagination.total > 0 && (
            <Box mt={5}>
              <PaginationControls
                total={pagination.total}
                currentPage={currentPage}
                limit={pageLimit}
                onPageChange={(page) =>
                  setPagination({ currentPage: page, limit: pageLimit })
                }
                onLimitChange={(newLimit) =>
                  setPagination({ currentPage: 1, limit: newLimit })
                }
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const statusBadge: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  in_progress: { label: "In progress", bg: "blue.50", color: "blue.600" },
  in_review: {
    label: "Awaiting approval",
    bg: "orange.50",
    color: "orange.600",
  },
  completed: { label: "Completed", bg: "green.50", color: "green.600" },
  pending: { label: "Pending", bg: "gray.50", color: "gray.600" },
  skipped: { label: "Skipped", bg: "gray.50", color: "gray.400" },
};

function statusIcon(status: string) {
  switch (status) {
    case "in_review":
      return (
        <Box as="span" color="orange.500">
          <Clock size={14} />
        </Box>
      );
    case "completed":
      return (
        <Box as="span" color="green.500">
          <CheckCircle size={14} />
        </Box>
      );
    default:
      return (
        <Box as="span" color="blue.500">
          <RotateCcw size={14} />
        </Box>
      );
  }
}

function TaskCard({ task }: { task: MyTaskItem }) {
  const isOverdue = task.dueDate
    ? new Date(task.dueDate).getTime() < Date.now()
    : false;
  const [showTrail, setShowTrail] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const submitMutation = useSubmitForReview(task.caseId);

  const trailEntries = toTrailEntries(task.auditLog);

  const badge = statusBadge[task.status] ?? statusBadge.pending;

  return (
    <Box
      border="1px solid"
      borderColor="border.muted"
      borderRadius="md"
      p={3}
      bg="bg"
      _hover={{ borderColor: "border" }}
    >
      <Flex
        align="flex-start"
        gap={3}
        direction={{ base: "column", sm: "row" }}
      >
        <Box flex={1}>
          <Flex align="center" gap={2} mb={1}>
            {statusIcon(task.status)}
            <Text fontSize="13px" fontWeight="500" color="fg" lineHeight="140%">
              {task.title}
            </Text>
          </Flex>
          <HStack gap={1.5} ml={6} mt={0.5} flexWrap="wrap">
            <Box
              fontSize="10px"
              color={badge.color}
              bg={badge.bg}
              borderRadius="full"
              px={2}
              py={0.5}
              fontWeight="500"
            >
              {badge.label}
            </Box>
            <Text fontSize="11px" color="fg.subtle">
              {task.caseTitle} · {task.moduleName} ({task.phaseName})
            </Text>
          </HStack>
        </Box>

        <HStack gap={2} flexWrap="wrap" flexShrink={0}>
          {task.dueDate && task.status !== "completed" && (
            <Box
              fontSize="10px"
              fontWeight="500"
              bg={isOverdue ? "red.50" : "gray.50"}
              color={isOverdue ? "red.600" : "fg.subtle"}
              borderRadius="full"
              px={2}
              py={0.5}
              whiteSpace="nowrap"
            >
              {isOverdue ? "Overdue" : `Due ${formatDate(task.dueDate)}`}
            </Box>
          )}
          {trailEntries.length > 0 && (
            <Button
              size="2xs"
              variant="ghost"
              fontSize="10px"
              h="22px"
              color="fg.muted"
              onClick={() => setShowTrail(!showTrail)}
            >
              <MessageSquare size={10} />
              {showTrail ? "Hide" : `${trailEntries.length} feedback`}
            </Button>
          )}
          {task.status === "in_progress" && (
            <>
              <Button
                size="2xs"
                colorPalette="yellow"
                fontSize="10px"
                h="22px"
                onClick={() => setSubmitOpen(true)}
                loading={submitMutation.isPending}
              >
                Submit for review
              </Button>
              <WorkflowActionDialog
                open={submitOpen}
                onOpenChange={setSubmitOpen}
                title="Submit for review"
                description={`Mark "${task.title}" as ready for review?`}
                confirmLabel="Submit"
                confirmIcon={<SendHorizontal size={14} />}
                colorPalette="yellow"
                notesRequired={false}
                placeholder="Add notes about what was completed..."
                onConfirm={(notes) =>
                  submitMutation.mutate(
                    { stepId: task.stepId, notes: notes || undefined },
                    { onSettled: () => setSubmitOpen(false) },
                  )
                }
                isPending={submitMutation.isPending}
              />
            </>
          )}
          <Link to={`/cases/${task.caseId}`}>
            <Button
              size="2xs"
              variant="outline"
              borderColor="border"
              fontSize="10px"
              h="22px"
            >
              <ExternalLink size={10} />
              Open case
            </Button>
          </Link>
        </HStack>
      </Flex>

      {showTrail && trailEntries.length > 0 && (
        <Box
          mt={2}
          ml={6}
          pl={3}
          borderLeft="2px solid"
          borderColor="border.muted"
        >
          {trailEntries.map((entry, i) => (
            <Box key={i} mb={i < trailEntries.length - 1 ? 2 : 0}>
              <Text fontSize="10px" fontWeight="500" color="fg.subtle">
                {entry.label}
              </Text>
              <Text fontSize="11px" color="fg" mt={0.5} whiteSpace="pre-wrap">
                {entry.text}
              </Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
