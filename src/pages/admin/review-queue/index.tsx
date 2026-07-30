import type { ReviewQueueItem } from "@/api/workflows";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PageTitle } from "@/components/layout/navigation";
import {
  useApproveStep,
  useRejectStep,
  useReviewQueue,
  workflowKeys,
} from "@/hooks/use-workflows";
import { usePaginationQueryStates } from "@/hooks/usePaginationQueryStates";
import { useAuthStore } from "@/store/auth-store";
import { toTrailEntries } from "@/utils/workflow-trail";
import { Box, Button, Flex, Tabs, Text, VStack } from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  Clock,
  ExternalLink,
  ListChecks,
  MessageSquare,
  XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Link } from "react-router";
import { WorkflowActionDialog } from "../my-tasks/workflow-action-dialog";

const TABS = [
  { value: "all", label: "All" },
  { value: "in_review", label: "In Review" },
  { value: "completed", label: "Approved" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

const statusSummaryCards = [
  {
    key: "in_review",
    label: "Awaiting Review",
    color: "orange.500",
    icon: Clock,
  },
  {
    key: "completed",
    label: "Approved",
    color: "green.500",
    icon: CheckCircle,
  },
  { key: "total", label: "Total Items", color: "fg", icon: ListChecks },
] as const;

export function ReviewQueuePage() {
  const memberRole = useAuthStore((s) => s.memberRole);
  const isManager = memberRole === "owner" || memberRole === "admin";
  const [tab, setTab] = useState<TabValue>("all");
  const {
    currentPage,
    limit: pageLimit,
    setPagination,
  } = usePaginationQueryStates();

  const statusParam = tab === "all" ? "in_review,completed" : tab;
  const { data: response, isLoading } = useReviewQueue(
    statusParam,
    currentPage,
    pageLimit,
  );

  const queue = response?.data ?? [];
  const counts = response?.counts;
  const pagination = response?.pagination ?? {
    total: 0,
    limit: pageLimit,
    offset: 0,
  };

  const handleTabChange = useCallback(
    (e: { value: string }) => {
      setTab(e.value as TabValue);
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
              Review Queue
            </Text>
          </PageTitle>
          <Text m="8px 0 0" color="fg.muted" fontSize="14px">
            Approve or reject workflow steps submitted for review
          </Text>
        </Box>
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
          Loading review queue...
        </Text>
      ) : queue.length === 0 ? (
        <Box
          border="1px dashed"
          borderColor="border.muted"
          borderRadius="lg"
          p={10}
          textAlign="center"
        >
          <Text fontSize="13px" color="fg.muted">
            No matching items.
          </Text>
        </Box>
      ) : (
        <>
          <VStack gap={3} align="stretch">
            {queue.map((item) => (
              <ReviewCard key={item.stepId} item={item} />
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
  in_review: { label: "In review", bg: "orange.50", color: "orange.600" },
  completed: { label: "Approved", bg: "green.50", color: "green.600" },
};

function ReviewCard({ item }: { item: ReviewQueueItem }) {
  const queryClient = useQueryClient();
  const [showTrail, setShowTrail] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const approveMutation = useApproveStep(item.caseId);
  const rejectMutation = useRejectStep(item.caseId);

  const trailEntries = toTrailEntries(item.auditLog);
  const badge = statusBadge[item.status] ?? {
    label: item.status,
    bg: "gray.50",
    color: "gray.600",
  };

  const handleApprove = (notes: string) => {
    approveMutation.mutate(
      { stepId: item.stepId, notes: notes || undefined },
      {
        onSettled: () => {
          setApproveOpen(false);
          queryClient.invalidateQueries({
            queryKey: workflowKeys.reviewQueue(),
          });
        },
      },
    );
  };

  const handleReject = (feedback: string) => {
    rejectMutation.mutate(
      { stepId: item.stepId, feedback },
      {
        onSettled: () => {
          setRejectOpen(false);
          queryClient.invalidateQueries({
            queryKey: workflowKeys.reviewQueue(),
          });
        },
      },
    );
  };

  const isInReview = item.status === "in_review";

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
        direction={{ base: "column", md: "row" }}
      >
        <Box flex={1}>
          <Text fontSize="13px" fontWeight="500" color="fg" mb={0.5}>
            {item.title}
          </Text>
          <Flex gap={2} mt={0.5} flexWrap="wrap" align="center">
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
              {item.caseTitle} · {item.moduleName} ({item.phaseName})
            </Text>
          </Flex>
          <Flex gap={2} mt={1} flexWrap="wrap">
            {item.assignedToName && (
              <Box fontSize="10px" color="fg.subtle">
                Submitted by {item.assignedToName}
              </Box>
            )}
            {item.dueDate && (
              <Box fontSize="10px" color="fg.subtle">
                Due {formatDate(item.dueDate)}
              </Box>
            )}
          </Flex>
        </Box>

        <Flex
          gap={2}
          align="center"
          flexShrink={0}
          direction={{ base: "column", sm: "row" }}
        >
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
          <Link to={`/cases/${item.caseId}`}>
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

          {isInReview && (
            <>
              <Button
                size="2xs"
                colorPalette="green"
                fontSize="10px"
                h="22px"
                onClick={() => setApproveOpen(true)}
                loading={approveMutation.isPending}
              >
                <CheckCircle size={10} />
                Approve
              </Button>
              <WorkflowActionDialog
                open={approveOpen}
                onOpenChange={setApproveOpen}
                title="Approve step"
                description={`Approve "${item.title}"?`}
                confirmLabel="Approve"
                confirmIcon={<CheckCircle size={14} />}
                colorPalette="green"
                notesRequired={false}
                placeholder="Add notes (optional)..."
                onConfirm={handleApprove}
                isPending={approveMutation.isPending}
              />

              <Button
                size="2xs"
                variant="outline"
                borderColor="red.300"
                color="red.600"
                fontSize="10px"
                h="22px"
                onClick={() => setRejectOpen(true)}
                loading={rejectMutation.isPending}
              >
                <XCircle size={10} />
                Reject
              </Button>
              <WorkflowActionDialog
                open={rejectOpen}
                onOpenChange={setRejectOpen}
                title="Reject step"
                description={`Reject "${item.title}"? Provide feedback on what needs to change.`}
                confirmLabel="Reject"
                confirmIcon={<XCircle size={14} />}
                colorPalette="red"
                notesRequired={true}
                placeholder="Explain what needs to be fixed..."
                onConfirm={handleReject}
                isPending={rejectMutation.isPending}
              />
            </>
          )}
        </Flex>
      </Flex>

      {showTrail && trailEntries.length > 0 && (
        <Box
          mt={2}
          ml={0}
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
