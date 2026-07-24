import type { LeadTask } from "@/api/lead-workflows";
import {
  useMyLeadTasks,
  useSubmitLeadTaskForReview,
  useUpdateLeadTaskStatus,
} from "@/hooks/use-lead-workflows";
import { useRunConflictCheck } from "@/hooks/use-leads";
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
  Play,
  RotateCcw,
  Send,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { pipelineStageLabels } from "./components/intake-pipeline/shared/constants";
import { CompleteTaskDialog } from "./components/intake-pipeline/dialogs/complete-task-dialog";

const TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
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
  {
    key: "completed",
    label: "Completed",
    color: "green.500",
    icon: CheckCircle,
  },
  { key: "total", label: "Total Tasks", color: "fg", icon: ListChecks },
] as const;

const stageSuffix: Record<string, string> = {
  conflict_check: "conflict-check",
  questionnaire: "questionnaire",
  consultation: "consultation",
  fee_agreement: "consultation",
  case_opening: "case-opening",
};

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
  in_progress: { label: "In progress", bg: "blue.50", color: "blue.600" },
  in_review: { label: "In review", bg: "orange.50", color: "orange.600" },
  completed: { label: "Completed", bg: "green.50", color: "green.600" },
  pending: { label: "Pending", bg: "gray.50", color: "gray.600" },
  skipped: { label: "Skipped", bg: "gray.50", color: "gray.400" },
};

function statusIcon(status: string) {
  switch (status) {
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

function TaskCard({ task }: { task: LeadTask }) {
  const navigate = useNavigate();
  const doSubmitForReview = useSubmitLeadTaskForReview(task.leadId);
  const doUpdateStatus = useUpdateLeadTaskStatus(task.leadId);
  const doRunConflictCheck = useRunConflictCheck();
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  const badge = statusBadge[task.status] ?? statusBadge.pending;

  function handleAction() {
    if (
      task.actionType === "run_conflict_check" &&
      task.status !== "completed"
    ) {
      doRunConflictCheck.mutate(task.leadId);
      return;
    }
    const suffix = stageSuffix[task.pipelineStage] ?? task.pipelineStage;
    navigate(`/leads/${task.leadId}/${suffix}`);
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
              <Text
                fontSize="13px"
                fontWeight="500"
                color="fg"
                lineHeight="140%"
              >
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
                color="orange.600"
                bg="orange.50"
                borderRadius="full"
                px={2}
                py={0.5}
              >
                In review
              </Box>
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
