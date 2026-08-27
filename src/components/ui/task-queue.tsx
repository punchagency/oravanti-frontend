import type { TaskCounts, TaskQueueItem } from "@/api/task-queue";
import type { TaskStatus } from "@/api/tasks";
import { TaskGuidance } from "@/components/ui/task-guidance";
import { TaskReviewThread } from "@/components/ui/task-review-thread";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { Badge, Box, Button, Flex, HStack, Tabs, Text } from "@chakra-ui/react";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  ExternalLink,
  // Lock, // restore with the Locked chip below
  RotateCcw,
  SkipForward,
  XCircle,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useState } from "react";
import { Link } from "react-router";

/**
 * The shared vocabulary for every cross-entity task list — the review queue and
 * My Tasks, for intake steps and case workflow steps alike.
 *
 * All four lists read the same row shape from `/tasks/{review-queue,my-tasks}`,
 * so they render through one card. Before this there were four cards on four
 * shapes and they had drifted: only one queue had a Rejected tab, only one list
 * showed the review thread, and none of them showed who a task was assigned to
 * versus who submitted it. What differs between the lists is the verbs on offer,
 * and those come in through the `actions` slot.
 */

// ─── Status ──────────────────────────────────────────────────────────────────

interface StatusMeta {
  label: string;
  bg: string;
  color: string;
  accent: string;
  icon: ComponentType<{ size?: number }>;
}

/**
 * Keyed on the status the API actually returns — never a re-cased variant — and
 * read through `statusMeta()` so a status this build predates still renders.
 */
const STATUS_META: Record<TaskStatus, StatusMeta> = {
  pending: { label: "Pending", bg: "bg.subtle", color: "fg.muted", accent: "fg.muted", icon: Circle },
  in_progress: { label: "In progress", bg: "blue.subtle", color: "blue.fg", accent: "blue.500", icon: RotateCcw },
  in_review: { label: "In review", bg: "orange.subtle", color: "orange.fg", accent: "orange.500", icon: Clock },
  completed: { label: "Completed", bg: "green.subtle", color: "green.fg", accent: "green.500", icon: CheckCircle },
  rejected: { label: "Rejected", bg: "red.subtle", color: "red.fg", accent: "red.500", icon: XCircle },
  skipped: { label: "Skipped", bg: "bg.subtle", color: "fg.subtle", accent: "fg.subtle", icon: SkipForward },
  cancelled: { label: "Cancelled", bg: "bg.subtle", color: "fg.subtle", accent: "fg.subtle", icon: XCircle },
};

function statusMeta(status: string): StatusMeta {
  return (
    STATUS_META[status as TaskStatus] ?? {
      label: status,
      bg: "bg.subtle",
      color: "fg.muted",
      accent: "fg.muted",
      icon: Circle,
    }
  );
}

// ─── Formatting ──────────────────────────────────────────────────────────────

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : null;

const formatDateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

/** Rounded to the largest unit that still reads as a number a person would say. */
function formatDuration(ms: number | null): string | null {
  if (!ms || ms <= 0) return null;
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

/** A due date is only overdue while there is still something to do about it. */
const isOverdue = (task: TaskQueueItem) =>
  Boolean(task.dueDate) &&
  new Date(task.dueDate as string).getTime() < Date.now() &&
  task.status !== "completed" &&
  task.status !== "skipped" &&
  task.status !== "cancelled";

/**
 * Whichever grouping the task came in under — intake stage or workflow phase.
 *
 * Title-cased rather than looked up: intake stages arrive snake_cased
 * (`fee_agreement`) and workflow phases arrive already written for people
 * ("Discovery"), and this reads both correctly. A lookup table would need an
 * entry for every phase any firm ever names.
 */
const phaseLabel = (task: TaskQueueItem) =>
  task.phase
    ? task.phase.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

/** Where the task's own record lives. Never both — see the `tasks` table check constraint. */
function taskEntityPath(task: TaskQueueItem): string | null {
  if (task.lead) return `/leads/${task.lead.id}`;
  if (task.case) return `/cases/${task.case.id}`;
  return null;
}

// ─── Card ────────────────────────────────────────────────────────────────────

function MetaField({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <Box minW="0">
      <Text fontSize="10px" color="fg.subtle" textTransform="uppercase" letterSpacing="0.04em">
        {label}
      </Text>
      <Text fontSize="12px" color="fg" mt="2px" lineHeight="1.4">
        {value}
      </Text>
    </Box>
  );
}

function Chip({ children, color = "fg.muted", bg = "bg.subtle" }: { children: ReactNode; color?: string; bg?: string }) {
  return (
    <Badge
      size="xs"
      borderRadius="full"
      px={2}
      py={0.5}
      bg={bg}
      color={color}
      fontWeight="500"
      fontSize="10px"
      textTransform="none"
    >
      {children}
    </Badge>
  );
}

export interface TaskQueueCardProps {
  task: TaskQueueItem;
  /** The verbs this list offers on this task — the only thing that differs between lists. */
  actions?: ReactNode;
  /**
   * Open the review thread on mount. A rejected task does this on its own: the
   * feedback is the whole reason anyone is looking at it.
   */
  defaultThreadOpen?: boolean;
}

export function TaskQueueCard({ task, actions, defaultThreadOpen }: TaskQueueCardProps) {
  const meta = statusMeta(task.status);
  const StatusIcon = meta.icon;
  const rejected = task.status === "rejected";
  // Threads fetch only once opened — a page of 40 tasks must not fire 40 requests.
  const [threadOpen, setThreadOpen] = useState(defaultThreadOpen ?? rejected);

  const overdue = isOverdue(task);
  const entityPath = taskEntityPath(task);
  const entityLabel = task.lead ? "Open lead" : "Open case";

  return (
    <Box
      border="1px solid"
      borderColor={rejected ? "red.muted" : "border.muted"}
      borderRadius="lg"
      bg="bg"
      p={4}
      _hover={{ borderColor: rejected ? "red.emphasized" : "border" }}
    >
      {/* ── Title row ── */}
      <Flex align="flex-start" gap={3} direction={{ base: "column", md: "row" }}>
        <Box flex="1" minW="0">
          <HStack gap={2} align="flex-start">
            <Box color={meta.accent} mt="2px" flexShrink={0}>
              <StatusIcon size={15} />
            </Box>
            <Box minW="0">
              <Text fontSize="14px" fontWeight="500" color="fg" lineHeight="1.35">
                {task.title}
              </Text>

              {/* Who this is for. The first thing anyone needs from a queue. */}
              <Text fontSize="12px" color="fg.muted" mt="3px">
                {task.case
                  ? [task.case.clientName, task.case.caseNumber].filter(Boolean).join(" · ")
                  : [task.lead?.name, task.lead?.email].filter(Boolean).join(" · ")}
              </Text>
            </Box>
          </HStack>

          <HStack gap={1.5} mt={2.5} flexWrap="wrap">
            <Chip bg={meta.bg} color={meta.color}>
              {meta.label}
            </Chip>
            {phaseLabel(task) ? <Chip>{phaseLabel(task)}</Chip> : null}
            {task.moduleName ? <Chip>{task.moduleName}</Chip> : null}
            {/* No step number: `orderIndex` is a sort key, not a position — case
                workflow steps carry values like 1001 to leave room between them,
                so rendering it would read as "Step 1002". */}
            {task.priority ? (
              <Chip
                bg={task.priority === "critical" || task.priority === "high" ? "red.subtle" : "bg.subtle"}
                color={task.priority === "critical" || task.priority === "high" ? "red.fg" : "fg.muted"}
              >
                {task.priority} priority
              </Chip>
            ) : null}
            {task.isRequired ? null : <Chip>Optional</Chip>}
            {/* Locked chip parked until there's a way to change a step's deadline
                from the UI. Until then the badge names a rule nothing here can
                run into, so it reads as an unexplained warning. Restore it (and
                the `Lock` import) alongside due-date editing.

            {task.isLocked ? (
              <Chip>
                <HStack gap={1} as="span">
                  <Lock size={9} />
                  <span>Locked</span>
                </HStack>
              </Chip>
            ) : null} */}
            {overdue ? (
              <Chip bg="red.subtle" color="red.fg">
                <HStack gap={1} as="span">
                  <AlertTriangle size={9} />
                  <span>Overdue</span>
                </HStack>
              </Chip>
            ) : null}
          </HStack>

          {task.description ? (
            <Text fontSize="12px" color="fg.muted" mt={2.5} lineHeight="1.5">
              {task.description}
            </Text>
          ) : null}
        </Box>

        {actions ? (
          <HStack gap={2} flexWrap="wrap" flexShrink={0} justify={{ base: "flex-start", md: "flex-end" }}>
            {entityPath ? (
              <Button asChild size="xs" variant="outline" borderColor="border" fontSize="11px" h="26px">
                <Link to={entityPath}>
                  <ExternalLink size={11} />
                  {entityLabel}
                </Link>
              </Button>
            ) : null}
            {actions}
          </HStack>
        ) : null}
      </Flex>

      {/* ── Context ── */}
      <Flex
        mt={3.5}
        pt={3}
        borderTop="1px solid"
        borderColor="border.subtle"
        gap={{ base: 3, md: 6 }}
        rowGap={3}
        flexWrap="wrap"
      >
        <MetaField
          label="Assigned to"
          value={
            task.assignedTo
              ? `${task.assignedTo.name ?? "Unnamed"}${task.assignedTo.role ? ` · ${task.assignedTo.role}` : ""}`
              : "Unassigned"
          }
        />
        <MetaField
          label="Assigned by"
          value={
            task.assignedByName
              ? `${task.assignedByName}${formatDate(task.assignedAt) ? ` · ${formatDate(task.assignedAt)}` : ""}`
              : /* No `assignedById` means the engine picked by role at stamp time. */
                task.assignedTo
                ? "Auto-assigned by role"
                : null
          }
        />
        <MetaField
          label="Submitted by"
          value={
            task.submittedBy
              ? `${task.submittedBy.name ?? "Unnamed"} · ${formatDateTime(task.updatedAt)}`
              : null
          }
        />
        <MetaField
          label={overdue ? "Was due" : "Due"}
          value={task.dueDate ? <Box as="span" color={overdue ? "red.fg" : undefined}>{formatDate(task.dueDate)}</Box> : null}
        />
        <MetaField label="Completed" value={formatDateTime(task.completedAt)} />
        <MetaField label="Time taken" value={formatDuration(task.timeTakenMs)} />
        <MetaField label="Created" value={formatDate(task.createdAt)} />
      </Flex>

      {task.notes ? (
        <Box mt={3} pl={3} borderLeft="2px solid" borderColor="border.muted">
          <Text fontSize="10px" color="fg.subtle" textTransform="uppercase" letterSpacing="0.04em">
            Notes
          </Text>
          <Text fontSize="12px" color="fg" mt="2px" whiteSpace="pre-wrap">
            {task.notes}
          </Text>
        </Box>
      ) : null}

      {/* The one line of feedback that explains the status, before anyone opens
          the full exchange below. */}
      {rejected && task.latestRejection ? (
        <Box mt={3} p={3} borderRadius="md" bg="red.subtle" borderLeft="3px solid" borderColor="red.solid">
          <Text fontSize="10px" color="red.fg" textTransform="uppercase" letterSpacing="0.04em" fontWeight="500">
            Sent back
            {task.latestRejection.actorName ? ` by ${task.latestRejection.actorName}` : ""}
            {` · ${formatDateTime(task.latestRejection.createdAt)}`}
          </Text>
          <Text fontSize="12px" color="fg" mt="3px" whiteSpace="pre-wrap">
            {task.latestRejection.note ?? "No reason recorded."}
          </Text>
        </Box>
      ) : null}

      {/* ── Disclosures ──
          Two independent ones. "How to do this" is instruction for the work;
          the thread is the conversation about it. Someone reading the guidance
          while answering a reviewer needs both open at once, so neither closes
          the other. */}
      <Box mt={3} pt={2.5} borderTop="1px solid" borderColor="border.subtle">
        <TaskGuidance
          task={task}
          trailing={
            <Button
              variant="plain"
              h="auto"
              minH="auto"
              p={0}
              fontSize="11px"
              fontWeight="400"
              color={rejected ? "red.fg" : "fg.muted"}
              _hover={{ color: "fg" }}
              onClick={() => setThreadOpen((open) => !open)}
            >
              {threadOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {threadOpen ? "Hide review history" : rejected ? "Review feedback" : "Review history"}
            </Button>
          }
        />

        {threadOpen ? (
          <Box mt={2}>
            <TaskReviewThread taskId={task.id} emptyText="Nothing submitted for review yet." />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

// ─── List chrome ─────────────────────────────────────────────────────────────

export interface TaskTileSpec {
  /** A status to count, or "total" for the sum of the tabs' statuses. */
  key: TaskStatus | "total";
  label: string;
  color: string;
  icon: ComponentType<{ size?: number }>;
}

/**
 * The summary tiles above a task list.
 *
 * `counts` covers every status regardless of what is being listed, so a tile is
 * right even for a tab the user is not on.
 */
export function TaskStatusTiles({
  tiles,
  counts,
  total,
  isLoading,
}: {
  tiles: readonly TaskTileSpec[];
  counts: TaskCounts | undefined;
  /** What "total" means for this list — the caller decides which statuses count. */
  total: number;
  isLoading?: boolean;
}) {
  return (
    <Flex wrap="wrap" gap={{ base: 3, md: 4 }} my={{ base: 4, md: 6 }}>
      {tiles.map((tile) => {
        const Icon = tile.icon;
        const count = tile.key === "total" ? total : (counts?.[tile.key] ?? 0);
        return (
          <Box
            key={tile.key}
            flex={{ base: "1 1 calc(50% - 12px)", md: "1 1 calc(25% - 12px)" }}
            minW={{ base: 0, md: "120px" }}
            bg="bg"
            border="1px solid"
            borderColor="border"
            borderRadius="lg"
            px={{ base: 3, md: 4 }}
            py={{ base: 3, md: 4 }}
          >
            <Flex align="center" gap={2.5}>
              <Box color={tile.color}>
                <Icon size={18} />
              </Box>
              {isLoading ? (
                <ThemeSkeleton h="28px" w="32px" borderRadius="md" />
              ) : (
                <Text fontWeight="bold" fontSize={{ base: "xl", md: "2xl" }} color="fg">
                  {count}
                </Text>
              )}
            </Flex>
            <Text mt={1} fontSize="13px" color="fg.subtle" whiteSpace="nowrap">
              {tile.label}
            </Text>
          </Box>
        );
      })}
    </Flex>
  );
}

export interface TaskTabSpec {
  /** "all" or a comma-separated status list — passed straight to the API. */
  value: string;
  label: string;
  /** Statuses whose counts add up to this tab's badge. Omit for no badge. */
  counted?: readonly TaskStatus[];
}

/** Tabs over a task list, each badged from `counts`. */
export function TaskStatusTabs({
  tabs,
  value,
  onChange,
  counts,
}: {
  tabs: readonly TaskTabSpec[];
  value: string;
  onChange: (value: string) => void;
  counts: TaskCounts | undefined;
}) {
  return (
    <Tabs.Root value={value} onValueChange={(e) => onChange(e.value)} size="sm" mb={6}>
      <Tabs.List>
        {tabs.map((tab) => {
          const badge = tab.counted?.reduce((sum, s) => sum + (counts?.[s] ?? 0), 0);
          return (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              px={3.5}
              py={2}
              fontSize="12px"
              color="fg.muted"
              borderBottom="1px solid"
              borderColor="transparent"
              _selected={{ color: "fg", borderColor: "brand.solid", fontWeight: "500" }}
            >
              {tab.label}
              {badge ? (
                <Box as="span" ml={1.5} fontSize="10px" color="fg.subtle">
                  {badge}
                </Box>
              ) : null}
            </Tabs.Trigger>
          );
        })}
      </Tabs.List>
    </Tabs.Root>
  );
}

/** The empty state and loading state every task list shares. */
export function TaskListPlaceholder({
  isLoading,
  emptyText,
}: {
  isLoading: boolean;
  emptyText: string;
}) {
  if (isLoading) {
    return (
      <Flex direction="column" gap={2}>
        {Array.from({ length: 4 }, (_, i) => (
          <ThemeSkeleton key={i} h="150px" borderRadius="lg" />
        ))}
      </Flex>
    );
  }
  return (
    <Box border="1px dashed" borderColor="border.muted" borderRadius="lg" p={10} textAlign="center">
      <Text fontSize="13px" color="fg.muted">
        {emptyText}
      </Text>
    </Box>
  );
}
