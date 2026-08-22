import type { LeadTask } from "@/api/lead-workflows";
import {
  useMyLeadTasks,
  useSubmitLeadTaskForReview,
  useUpdateLeadTaskStatus,
} from "@/hooks/use-lead-workflows";
import { PageTitle } from "@/components/layout/shared/nav-context";
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
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  ListChecks,
  Play,
  RotateCcw,
  Send,
  XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { TaskReviewThread } from "@/components/ui/task-review-thread";
import { useReopenTask } from "@/hooks/use-task-review";
import {
  leadStagePath,
  pipelineOrigin,
  pipelineStageLabels,
} from "./components/intake-pipeline/shared/constants";
import { CompleteTaskDialog } from "./components/intake-pipeline/dialogs/complete-task-dialog";

const TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

const statusSummaryCards = [
  { key: "pending", label: "Pending", color: "gray.500", icon: Clock },
  {
    key: "in_progress",
    label: "In Progress",
    color: "blue.500",
    icon: RotateCcw,
  },
  { key: "rejected", label: "Rejected", color: "red.500", icon: XCircle },
  {
    key: "completed",
    label: "Completed",
    color: "green.500",
    icon: CheckCircle,
  },
  { key: "total", label: "Total Tasks", color: "fg", icon: ListChecks },
] as const;

export function MyLeadsTasks() {
  const [tab, setTab] = useState<TabValue>("all");

  const { data: allTasks, isLoading } = useMyLeadTasks();

  const tasks = (allTasks ?? []).filter((t) => {
    if (tab === "all") return true;
    return t.status === tab;
  });

  const counts = {
    pending: (allTasks ?? []).filter((t) => t.status === "pending").length,
    in_progress: (allTasks ?? []).filter((t) => t.status === "in_progress")
      .length,
    in_review: (allTasks ?? []).filter((t) => t.status === "in_review").length,
    rejected: (allTasks ?? []).filter((t) => t.status === "rejected").length,
    completed: (allTasks ?? []).filter(
      (t) => t.status === "completed" || t.status === "skipped",
    ).length,
    total: allTasks?.length ?? 0,
  };

  const handleTabChange = useCallback((e: { value: string }) => {
    setTab(e.value as TabValue);
  }, []);

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
            Track and manage your assigned intake tasks
          </Text>
        </Box>
      </Flex>

      {/* ── Status summary ── */}
      <Flex wrap="wrap" gap={{ base: 3, md: 4 }} my={{ base: 4, md: 6 }}>
        {statusSummaryCards.map((card) => {
          const Icon = card.icon;
          const count = counts[card.key as keyof typeof counts] ?? 0;
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
                  <ThemeSkeleton h="28px" w="32px" borderRadius="md" />
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
        <VStack gap={2} align="stretch">
          {Array.from({ length: 4 }, (_, i) => (
            <Box
              key={i}
              border="1px solid"
              borderColor="border.muted"
              borderRadius="md"
              p={3}
              bg="bg"
            >
              <Flex
                align="flex-start"
                gap={3}
                direction={{ base: "column", sm: "row" }}
              >
                <Box flex={1}>
                  <Flex align="center" gap={2} mb={1}>
                    <ThemeSkeleton
                      h="14px"
                      w="14px"
                      borderRadius="full"
                      flexShrink={0}
                    />
                    <ThemeSkeleton
                      h="14px"
                      w={`${160 + i * 30}px`}
                      borderRadius="4px"
                    />
                  </Flex>
                  <HStack gap={1.5} ml={6} mt={1} flexWrap="wrap">
                    <ThemeSkeleton h="18px" w="60px" borderRadius="full" />
                    <ThemeSkeleton h="11px" w="140px" borderRadius="4px" />
                  </HStack>
                  <Box ml={6} mt={1.5}>
                    <ThemeSkeleton
                      h="10px"
                      w={`${200 + i * 20}px`}
                      borderRadius="4px"
                    />
                  </Box>
                </Box>
                <HStack gap={2} flexShrink={0} align="center">
                  <ThemeSkeleton h="16px" w="65px" borderRadius="full" />
                  <ThemeSkeleton h="22px" w="70px" borderRadius="6px" />
                  <ThemeSkeleton h="22px" w="60px" borderRadius="6px" />
                </HStack>
              </Flex>
            </Box>
          ))}
        </VStack>
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
        <VStack gap={2} align="stretch">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </VStack>
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
  in_progress: { label: "In progress", bg: "blue.subtle", color: "blue.fg" },
  in_review: { label: "In review", bg: "orange.subtle", color: "orange.fg" },
  completed: { label: "Completed", bg: "green.subtle", color: "green.fg" },
  pending: { label: "Pending", bg: "bg.subtle", color: "fg.muted" },
  skipped: { label: "Skipped", bg: "bg.subtle", color: "fg.subtle" },
  rejected: { label: "Rejected", bg: "red.subtle", color: "red.fg" },
};

function statusIcon(status: string) {
  switch (status) {
    case "completed":
      return (
        <Box as="span" color="green.500">
          <CheckCircle size={14} />
        </Box>
      );
    case "rejected":
      return (
        <Box as="span" color="red.500">
          <XCircle size={14} />
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

function TaskCard({ task }: { task: LeadTask }) {
  const navigate = useNavigate();
  const location = useLocation();
  const doSubmitForReview = useSubmitLeadTaskForReview(task.leadId);
  const doUpdateStatus = useUpdateLeadTaskStatus(task.leadId);
  const doReopen = useReopenTask("lead_task", task.leadId);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  // Threads are fetched only once opened — a list of 40 tasks must not fire 40
  // requests. A rejected task opens by default, since the feedback is the whole
  // reason the assignee is looking at it.
  const [threadOpen, setThreadOpen] = useState(task.status === "rejected");

  const badge = statusBadge[task.status] ?? statusBadge.pending;
  const isRejected = task.status === "rejected";

  // Carry the origin so the stage page can offer a way back here — otherwise
  // an assignee who opens their task lands on a page with no route home.
  function handleAction() {
    navigate(leadStagePath(task.leadId, task.pipelineStage), {
      state: pipelineOrigin(
        `${location.pathname}${location.search}`,
        "Back to my tasks",
      ),
    });
  }

  return (
    <>
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
              {/* Clicking the title opens the stage — the "Go to stage" button
                  below stays for discoverability. */}
              <Button
                variant="plain"
                h="auto"
                minH="auto"
                p={0}
                justifyContent="flex-start"
                fontSize="13px"
                fontWeight="500"
                color="fg"
                lineHeight="140%"
                whiteSpace="normal"
                textAlign="left"
                _hover={{ color: "brand.solid", textDecoration: "underline" }}
                onClick={handleAction}
              >
                {task.title}
              </Button>
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
                {task.lead?.name ?? "—"} ·{" "}
                {pipelineStageLabels[task.pipelineStage] ?? task.pipelineStage}
              </Text>
            </HStack>
            {task.description ? (
              <Text fontSize="11px" color="fg.muted" ml={6} mt={1}>
                {task.description}
              </Text>
            ) : null}
          </Box>

          <HStack gap={2} flexWrap="wrap" flexShrink={0}>
            {task.dueDate &&
              task.status !== "completed" &&
              task.status !== "skipped" && (
                <Box
                  fontSize="10px"
                  fontWeight="500"
                  bg="gray.50"
                  color="fg.subtle"
                  borderRadius="full"
                  px={2}
                  py={0.5}
                  whiteSpace="nowrap"
                >
                  Due {formatDate(task.dueDate)}
                </Box>
              )}
            {task.status === "pending" && (
              <>
                <Button
                  size="2xs"
                  variant="outline"
                  borderColor="border"
                  fontSize="10px"
                  h="22px"
                  onClick={handleAction}
                >
                  <ExternalLink size={10} />
                  Go to stage
                </Button>
                <Button
                  size="2xs"
                  bg="brand.solid"
                  color="brand.contrast"
                  fontSize="10px"
                  h="22px"
                  onClick={() =>
                    doUpdateStatus.mutate({
                      taskId: task.id,
                      status: "in_progress",
                    })
                  }
                  loading={doUpdateStatus.isPending}
                  _hover={{ bg: "brand.solid/90" }}
                >
                  <Play size={10} />
                  Start
                </Button>
              </>
            )}
            {task.status === "in_progress" && (
              <>
                <Button
                  size="2xs"
                  variant="outline"
                  borderColor="border"
                  fontSize="10px"
                  h="22px"
                  onClick={handleAction}
                >
                  <ExternalLink size={10} />
                  Go to stage
                </Button>
                <Button
                  size="2xs"
                  colorPalette="green"
                  fontSize="10px"
                  h="22px"
                  onClick={() => setSubmitDialogOpen(true)}
                >
                  <Send size={10} />
                  Submit
                </Button>
              </>
            )}
            {task.status === "in_review" && (
              <Box
                fontSize="10px"
                fontWeight="500"
                color="orange.fg"
                bg="orange.subtle"
                borderRadius="full"
                px={2}
                py={0.5}
              >
                In review
              </Box>
            )}
            {isRejected && (
              <>
                <Button
                  size="2xs"
                  variant="outline"
                  borderColor="border"
                  fontSize="10px"
                  h="22px"
                  onClick={handleAction}
                >
                  <ExternalLink size={10} />
                  Go to stage
                </Button>
                {/* Reopening is the assignee's move, not the reviewer's: the
                    feedback has to be read before the task quietly becomes
                    work-in-progress again. */}
                <Button
                  size="2xs"
                  variant="outline"
                  borderColor="border"
                  fontSize="10px"
                  h="22px"
                  onClick={() => doReopen.mutate({ taskId: task.id })}
                  loading={doReopen.isPending}
                >
                  <RotateCcw size={10} />
                  Reopen
                </Button>
                <Button
                  size="2xs"
                  colorPalette="green"
                  fontSize="10px"
                  h="22px"
                  onClick={() => setSubmitDialogOpen(true)}
                >
                  <Send size={10} />
                  Resubmit
                </Button>
              </>
            )}
            {(task.status === "completed" || task.status === "skipped") && (
              <Box
                fontSize="10px"
                fontWeight="500"
                color={badge.color}
                bg={badge.bg}
                borderRadius="full"
                px={2}
                py={0.5}
              >
                {badge.label}
              </Box>
            )}
          </HStack>
        </Flex>

        {/* Every submission note and review decision, appended rather than
            overwritten, so the exchange stays readable after the fact. */}
        <Box mt={2} pt={2} borderTop="1px solid" borderColor="border.subtle">
          <Button
            variant="plain"
            h="auto"
            minH="auto"
            p={0}
            fontSize="11px"
            fontWeight="400"
            color={isRejected ? "red.fg" : "fg.muted"}
            _hover={{ color: "fg" }}
            onClick={() => setThreadOpen((open) => !open)}
          >
            {threadOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {isRejected ? "Review feedback" : "Review history"}
          </Button>

          {threadOpen ? (
            <Box mt={2}>
              <TaskReviewThread
                kind="lead_task"
                parentId={task.leadId}
                taskId={task.id}
                emptyText="Nothing submitted for review yet."
              />
            </Box>
          ) : null}
        </Box>
      </Box>

      <CompleteTaskDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        taskTitle={task.title}
        onConfirm={(notes) => {
          doSubmitForReview.mutate(
            { taskId: task.id, notes },
            { onSettled: () => setSubmitDialogOpen(false) },
          );
        }}
        isPending={doSubmitForReview.isPending}
      />
    </>
  );
}
