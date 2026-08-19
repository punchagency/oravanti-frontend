import type { AuditEvent } from "@/api/audit";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { colorForCategory, iconForAction, labelForCategory } from "@/lib/audit";
import { Badge, Box, Button, HStack, Text, VStack } from "@chakra-ui/react";

/**
 * One audit feed, rendered from the action registry.
 *
 * Holds no vocabulary of its own. The row's words come from the API — `label`
 * from the registry entry, `summary` written when the event happened — and the
 * icon is resolved by domain. A new action therefore renders correctly here the
 * day it ships, with no change to this file. That is the property the two
 * hand-maintained emoji-and-label maps in the lead and case tabs did not have,
 * and the reason they were the first thing the audit consolidation deleted.
 *
 * Deliberately dumb about *which* events to show: the caller picks the query
 * (an entity's timeline, one actor's history, the firm-wide trail) and hands
 * the pages in. Cursor pagination is the caller's too, because the "load more"
 * affordance belongs to whatever layout the feed sits in.
 */

export interface ActivityFeedProps {
  events: AuditEvent[];
  isLoading?: boolean;
  /** Shown when there are no events and nothing is loading. */
  emptyMessage?: string;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  /**
   * Hide the category badge where it says nothing — a feed already filtered to
   * one category repeats the same word on every row.
   */
  showCategory?: boolean;
}

/** Absolute date and time. An audit row is read to establish when, exactly. */
const formatWhen = (iso: string): string => {
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

function ActivityRow({
  event,
  showCategory,
}: {
  event: AuditEvent;
  showCategory: boolean;
}) {
  return (
    <HStack align="flex-start" gap={3} py={2.5}>
      <Text fontSize="14px" lineHeight="1.4" aria-hidden="true">
        {iconForAction(event.action)}
      </Text>

      <VStack align="stretch" gap={0.5} flex="1" minW={0}>
        <HStack gap={2} wrap="wrap">
          <Text fontSize="12px" fontWeight="500" color="fg">
            {event.label}
          </Text>
          {showCategory && (
            <Badge
              size="xs"
              colorPalette={colorForCategory(event.category)}
              variant="subtle"
            >
              {labelForCategory(event.category)}
            </Badge>
          )}
        </HStack>

        {/*
          The summary, not a sentence rebuilt from `action` plus today's
          copy. It was written when the event happened and describes it in the
          vocabulary in force then; regenerating it would silently re-describe
          history. Skipped only when it would just repeat the label.
        */}
        {event.summary && event.summary !== event.label && (
          <Text fontSize="12px" color="fg.muted">
            {event.summary}
          </Text>
        )}

        <Text fontSize="11px" color="fg.subtle">
          {formatWhen(event.occurredAt)}
          {event.actorName ? ` · ${event.actorName}` : ""}
        </Text>
      </VStack>
    </HStack>
  );
}

export function ActivityFeed({
  events,
  isLoading = false,
  emptyMessage = "No activity recorded yet.",
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  showCategory = true,
}: ActivityFeedProps) {
  if (isLoading) {
    return (
      <VStack align="stretch" gap={2}>
        {[0, 1, 2, 3].map((i) => (
          <ThemeSkeleton key={i} height="44px" />
        ))}
      </VStack>
    );
  }

  if (events.length === 0) {
    return (
      <Box py={8} textAlign="center">
        <Text fontSize="12px" color="fg.muted">
          {emptyMessage}
        </Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap={0} separator={<Box borderColor="border" />}>
      {events.map((event) => (
        <ActivityRow
          key={event.id}
          event={event}
          showCategory={showCategory}
        />
      ))}

      {hasNextPage && (
        <Box pt={3} textAlign="center">
          <Button
            size="xs"
            variant="outline"
            onClick={onLoadMore}
            loading={isFetchingNextPage}
          >
            Load more
          </Button>
        </Box>
      )}
    </VStack>
  );
}
