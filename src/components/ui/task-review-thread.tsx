import type { TaskReviewEvent } from "@/api/task-review";
import { useTaskReviewThread } from "@/hooks/use-task-review";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import {
  Check,
  CircleDot,
  MessageSquare,
  RotateCcw,
  SendHorizontal,
  UserPlus,
  X,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

/**
 * Icon and colour per action, keyed on the **registry action itself**.
 *
 * It used to be keyed on a re-cased variant (`"submitted"`), which matched
 * nothing the API returns — every row in every thread rendered as "Submitted for
 * review" in blue, whatever had actually happened. Keys are the action strings
 * now, and the label comes from the API rather than being restated here.
 */
const ACTION_META: Record<
  string,
  { color: string; icon: ComponentType<{ size?: number }> }
> = {
  "task.submitted": { color: "blue.500", icon: SendHorizontal },
  "task.approved": { color: "green.500", icon: Check },
  "task.rejected": { color: "red.500", icon: X },
  "task.reopened": { color: "orange.500", icon: RotateCcw },
  "task.assigned": { color: "fg.muted", icon: UserPlus },
};

/** A row written by a newer deployment still renders — with its own label and a neutral mark. */
const UNKNOWN_ACTION = { color: "fg.muted", icon: CircleDot };

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TaskReviewEventRow({ event }: { event: TaskReviewEvent }) {
  const meta = ACTION_META[event.action] ?? UNKNOWN_ACTION;
  const Icon = meta.icon;

  return (
    <HStack align="flex-start" gap={2.5}>
      <Box color={meta.color} mt="2px" flexShrink={0}>
        <Icon size={14} />
      </Box>
      <Box flex={1} minW={0}>
        <HStack gap={1.5} flexWrap="wrap">
          <Text fontSize="12px" fontWeight="500" color="fg">
            {/* The registry's own label — never a phrase rebuilt from `action`. */}
            {event.label}
          </Text>
          {event.actorName ? (
            <Text fontSize="11px" color="fg.muted">
              by {event.actorName}
            </Text>
          ) : null}
          <Text fontSize="11px" color="fg.subtle">
            · {formatWhen(event.createdAt)}
          </Text>
        </HStack>
        {event.note ? (
          <Box
            mt={1}
            px={2.5}
            py={1.5}
            borderRadius="6px"
            bg="bg.subtle"
          >
            <Text fontSize="12px" color="fg.muted" whiteSpace="pre-wrap">
              {event.note}
            </Text>
          </Box>
        ) : null}
      </Box>
    </HStack>
  );
}

/**
 * The full note history for one task, oldest first.
 *
 * Rendered identically for intake tasks and case workflow steps — the two loops
 * are the same shape, and a reader moving between them should not have to learn
 * two layouts.
 */
export function TaskReviewThread({
  taskId,
  enabled = true,
  emptyText = "No review activity yet.",
  fallback,
}: {
  taskId: string;
  enabled?: boolean;
  emptyText?: string;
  /**
   * Shown instead of the empty state when the thread has no events. Case steps
   * predating the shared thread still have their notes in the older step action
   * log, and that history should not disappear from the screen.
   */
  fallback?: ReactNode;
}) {
  const { data: events, isLoading } = useTaskReviewThread(taskId, enabled);

  if (isLoading) {
    return (
      <Stack gap={3} py={1}>
        {Array.from({ length: 2 }, (_, i) => (
          <HStack key={i} align="flex-start" gap={2.5}>
            <ThemeSkeleton h="14px" w="14px" borderRadius="full" />
            <Box flex={1}>
              <ThemeSkeleton h="11px" w="45%" borderRadius="4px" mb={1.5} />
              <ThemeSkeleton h="30px" w="100%" borderRadius="6px" />
            </Box>
          </HStack>
        ))}
      </Stack>
    );
  }

  if (!events || events.length === 0) {
    if (fallback) return <>{fallback}</>;
    return (
      <HStack gap={2} py={2} color="fg.muted">
        <MessageSquare size={14} />
        <Text fontSize="12px">{emptyText}</Text>
      </HStack>
    );
  }

  return (
    <Stack gap={3} py={1}>
      {events.map((event) => (
        <TaskReviewEventRow key={event.id} event={event} />
      ))}
    </Stack>
  );
}
