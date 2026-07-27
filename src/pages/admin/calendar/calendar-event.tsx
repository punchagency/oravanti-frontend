import { Box, Text } from "@chakra-ui/react";
import dayjs from "dayjs";
import type { CalendarEvent, CalendarViewType } from "./types";
import { EVENT_TYPE_CONFIG } from "./types";

interface MonthEventProps {
  event: CalendarEvent;
}

export function MonthEvent({ event }: MonthEventProps) {
  const config = EVENT_TYPE_CONFIG[event.type];

  return (
    <Box
      borderLeft="3px solid"
      borderColor={config.color}
      bg={`${config.color}18`}
      borderRadius="4px"
      px="6px"
      py="1px"
      fontSize="11px"
      color="fg"
      overflow="hidden"
      textOverflow="ellipsis"
      whiteSpace="nowrap"
      lineHeight="18px"
    >
      {event.title}
    </Box>
  );
}

interface TimeEventProps {
  event: CalendarEvent;
}

export function TimeEvent({ event }: TimeEventProps) {
  const config = EVENT_TYPE_CONFIG[event.type];

  return (
    <Box
      bg={`${config.color}18`}
      borderLeft="3px solid"
      borderColor={config.color}
      borderRadius="4px"
      px="8px"
      py="4px"
      fontSize="12px"
      color="fg"
      h="100%"
    >
      <Text
        fontWeight={500}
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        fontSize="inherit"
        color="inherit"
      >
        {event.title}
      </Text>
      <Text fontSize="10px" color="fg.muted">
        {dayjs(event.start).format("h:mm A")} –{" "}
        {dayjs(event.end).format("h:mm A")}
      </Text>
    </Box>
  );
}

interface CalendarEventRendererProps {
  event: CalendarEvent;
  view: CalendarViewType;
}

export function CalendarEventRenderer({
  event,
  view,
}: CalendarEventRendererProps) {
  if (view === "month") return <MonthEvent event={event} />;
  return <TimeEvent event={event} />;
}
