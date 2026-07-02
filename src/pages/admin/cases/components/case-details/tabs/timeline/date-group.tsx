import { Box, Text, Timeline } from "@chakra-ui/react";
import type { TimelineEvent } from "../workflow/types";
import { EventRow } from "./event-row";

export function DateGroup({
  label,
  events,
}: {
  label: string;
  events: TimelineEvent[];
}) {
  if (events.length === 0) return null;

  return (
    <Box mb={4}>
      <Text
        fontSize="10px"
        fontWeight="600"
        color="fg.subtle"
        textTransform="uppercase"
        letterSpacing="0.8px"
        mb={2}
      >
        {label}
      </Text>
      <Timeline.Root
        size="sm"
        variant="plain"
        colorPalette="green"
      >
        {events.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </Timeline.Root>
    </Box>
  );
}
