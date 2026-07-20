import {
  Box,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ThemeSkeleton } from "../../../../../staff-and-users/components/theme-skeleton";
import { Clock } from "lucide-react";
import { parseAsInteger, useQueryStates } from "nuqs";
import { SectionLabel } from "../../shared";
import { useLeadTimeline } from "@/hooks/use-lead-workflows";
import type { LeadTimelineEvent } from "@/api/lead-workflows";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { dateLabel } from "./date-utils";
import { DateGroup } from "./date-group";

interface LeadTimelineTabProps {
  leadId?: string;
  isActive?: boolean;
}

export function LeadTimelineTab({ leadId, isActive = true }: LeadTimelineTabProps) {
  const [{ page, limit }, setPagination] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(10),
    },
  );

  const { data, isLoading } = useLeadTimeline(leadId ?? "", isActive, page, limit);

  const timelineEvents = data?.data ?? [];
  const pagination = data?.pagination ?? { total: 0, totalPages: 0, page: 1, limit: 10 };

  const grouped = timelineEvents.reduce<
    Record<string, LeadTimelineEvent[]>
  >((acc, event) => {
    const label = dateLabel(event.createdAt, event.createdAt);
    if (!acc[label]) acc[label] = [];
    acc[label].push(event);
    return acc;
  }, {});

  const dateOrder = Object.keys(grouped).sort((a, b) => {
    if (a === "Today") return -1;
    if (b === "Today") return 1;
    if (a === "Yesterday") return -1;
    if (b === "Yesterday") return 1;
    return new Date(b).getTime() - new Date(a).getTime();
  });

  if (isLoading) {
    return (
      <VStack align="stretch" gap={4} py={4}>
        {Array.from({ length: 3 }, (_, i) => (
          <Box key={i}>
            <ThemeSkeleton h="12px" w={`${80 + i * 15}px`} borderRadius="4px" mb={3} />
            {Array.from({ length: 2 }, (_, j) => (
              <HStack key={j} gap={3} mb={3} pl={2}>
                <VStack gap={0} align="center">
                  <ThemeSkeleton h="12px" w="12px" borderRadius="full" />
                  <ThemeSkeleton h="30px" w="2px" borderRadius="full" />
                </VStack>
                <Box flex={1}>
                  <ThemeSkeleton h="12px" w={`${140 + j * 25}px`} borderRadius="4px" mb={1} />
                  <ThemeSkeleton h="10px" w="60px" borderRadius="4px" />
                </Box>
              </HStack>
            ))}
          </Box>
        ))}
      </VStack>
    );
  }

  return (
    <>
      <SectionLabel>Timeline</SectionLabel>

      {timelineEvents.length === 0 && (
        <VStack
          align="center"
          py={6}
          gap={2}
          border="1px dashed"
          borderColor="border.muted"
          borderRadius="lg"
          mb={4}
        >
          <Box color="fg.subtle">
            <Clock size={24} />
          </Box>
          <Text fontSize="12px" fontWeight="500" color="fg.muted">
            No events yet
          </Text>
          <Text fontSize="12px" color="fg.subtle">
            Events will appear as the lead progresses through the pipeline.
          </Text>
        </VStack>
      )}

      {dateOrder.map((label) => (
        <DateGroup key={label} label={label} events={grouped[label]} />
      ))}

      {pagination.total > limit && (
        <PaginationControls
          total={pagination.total}
          currentPage={pagination.page}
          limit={pagination.limit}
          onPageChange={(p) => setPagination({ page: p })}
          onLimitChange={(l) => setPagination({ page: 1, limit: l })}
        />
      )}
    </>
  );
}
