import {
  Box,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Clock } from "lucide-react";
import { parseAsInteger, useQueryStates } from "nuqs";
import { ThemeSkeleton } from "../../../../../../../components/ui/theme-skeleton";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useCaseEvents } from "../../../../../../../hooks/use-workflows";
import type { CaseEvent } from "../../../../../../../api/workflows";
import { SectionLabel } from "../../shared";
import { DateGroup } from "./date-group";
import { dateLabel } from "./date-utils";

interface TimelineTabProps {
  caseId?: string;
}

export function TimelineTab({ caseId }: TimelineTabProps) {
  const [{ page, limit }, setPagination] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(10),
  });

  const { data: eventsResult, isLoading } = useCaseEvents(
    caseId ?? "",
    page,
    limit,
  );

  const events = eventsResult?.data ?? [];
  const pagination = eventsResult?.pagination;

  const grouped = events.reduce<Record<string, CaseEvent[]>>(
    (acc, event) => {
      const label = dateLabel(event.createdAt, event.createdAt);
      if (!acc[label]) acc[label] = [];
      acc[label].push(event);
      return acc;
    },
    {},
  );

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
            <ThemeSkeleton
              h="12px"
              w={`${80 + i * 15}px`}
              borderRadius="4px"
              mb={3}
            />
            {Array.from({ length: 2 }, (_, j) => (
              <HStack key={j} gap={3} mb={3} pl={2}>
                <VStack gap={0} align="center">
                  <ThemeSkeleton h="12px" w="12px" borderRadius="full" />
                  <ThemeSkeleton h="30px" w="2px" borderRadius="full" />
                </VStack>
                <Box flex={1}>
                  <ThemeSkeleton
                    h="12px"
                    w={`${140 + j * 25}px`}
                    borderRadius="4px"
                    mb={1}
                  />
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

      {events.length === 0 && (
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
            Events will appear as the case progresses.
          </Text>
        </VStack>
      )}

      {dateOrder.map((label) => (
        <DateGroup key={label} label={label} events={grouped[label]} />
      ))}

      {pagination && (
        <PaginationControls
          currentPage={page}
          limit={limit}
          total={pagination.total}
          onPageChange={(p: number) => setPagination({ page: p })}
          onLimitChange={(l: number) => setPagination({ limit: l, page: 1 })}
          pageSizeOptions={[10, 20, 50]}
        />
      )}
    </>
  );
}
