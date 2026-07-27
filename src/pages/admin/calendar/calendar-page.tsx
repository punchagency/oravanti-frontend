import { Box, Button, Flex, HStack, Text } from "@chakra-ui/react";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback } from "react";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar.css";

import { AddEventDialog } from "./add-event-dialog";
import { useCalendarData } from "./calendar-data-context";
import { MonthDateHeader, WeekDayHeader } from "./calendar-date-header";
import { CalendarEventRenderer } from "./calendar-event";
import { CalendarHeader } from "./calendar-header";
import { CalendarLegend } from "./calendar-legend";
import { EventDetailDialog } from "./event-detail-dialog";
import type { CalendarViewType } from "./types";
import { getTitle } from "./utils";

dayjs.extend(isToday);

const localizer = dayjsLocalizer(dayjs);

export function CalendarPage() {
  const {
    view,
    setView,
    currentDate,
    setCurrentDate,
    handlePrev,
    handleNext,
    handleToday,
    displayedEvents,
    handleAddSubmit,
    setSlotData,
    selectedEventId,
    openDetail,
    closeDetail,
    filter,
  } = useCalendarData();

  const handleSlotSelect = useCallback(
    (slotInfo: { start: Date; end: Date }) => {
      setSlotData(slotInfo);
    },
    [setSlotData],
  );

  const eventPropGetter = useCallback(
    () => ({
      style: {
        backgroundColor: "transparent",
        border: "none",
        padding: 0,
      },
    }),
    [],
  );

  return (
    <Box bg="bg" minH="100vh">
      {/* ── Page header (cases/leads pattern) ── */}
      <CalendarHeader
        filter={filter}
        actions={<AddEventDialog onAdd={handleAddSubmit} />}
      />

      {/* ── View controls + navigation bar ── */}
      <Flex
        align="center"
        justify="space-between"
        flexWrap="wrap"
        gap={{ base: "8px", md: "0" }}
        py={{ base: "8px", md: "12px" }}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <HStack gap="6px" flexWrap="wrap">
          <HStack
            p="3px"
            borderRadius="8px"
            bg="bg.muted"
            border="1px solid"
            borderColor="border.subtle"
          >
            {(["month", "week", "day"] as const).map((v) => (
              <Button
                key={v}
                size="xs"
                px={{ base: "10px", md: "14px" }}
                py="6px"
                borderRadius="6px"
                fontWeight={view === v ? 600 : 500}
                fontSize="12px"
                bg={view === v ? "brand.solid" : "transparent"}
                color={view === v ? "brand.fg" : "fg.muted"}
                _hover={view === v ? {} : { bg: "bg.subtle", color: "fg" }}
                onClick={() => setView(v)}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Button>
            ))}
          </HStack>

          <HStack gap="4px">
            <Button
              size="xs"
              px="10px"
              py="6px"
              borderRadius="6px"
              fontWeight={500}
              fontSize="12px"
              bg="bg.muted"
              color="fg"
              _hover={{ bg: "bg.subtle" }}
              onClick={handlePrev}
            >
              <ChevronLeft size={12} />
            </Button>
            <Button
              size="xs"
              px="10px"
              py="6px"
              borderRadius="6px"
              fontWeight={500}
              fontSize="12px"
              bg="bg.muted"
              color="fg"
              _hover={{ bg: "bg.subtle" }}
              onClick={handleNext}
            >
              <ChevronRight size={12} />
            </Button>
          </HStack>

          <Button
            size="xs"
            px="14px"
            py="6px"
            borderRadius="6px"
            fontWeight={500}
            fontSize="12px"
            bg="bg.muted"
            color="fg"
            _hover={{ bg: "bg.subtle" }}
            onClick={handleToday}
          >
            Today
          </Button>
        </HStack>

        <Text
          fontSize={{ base: "13px", md: "14px" }}
          fontWeight={600}
          color="fg"
          textAlign="center"
        >
          {getTitle(view, currentDate)}
        </Text>
      </Flex>

      {/* ── Legend ── */}
      <CalendarLegend />

      {/* ── Calendar content ── */}
      <Box h={{ base: "calc(100vh - 280px)", md: "calc(100vh - 240px)" }} overflow="hidden">
        <Calendar
          localizer={localizer}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          events={displayedEvents as any[]}
          view={view}
          views={["month", "week", "day"]}
          date={currentDate}
          onNavigate={(date: Date) => setCurrentDate(date)}
          onView={(v: string) => setView(v as CalendarViewType)}
          components={{
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            event: (props: any) => (
              <CalendarEventRenderer
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                event={props.event as any}
                view={view}
              />
            ),
            month: {
              dateHeader: (props) => <MonthDateHeader date={props.date} />,
            },
            week: {
              header: (props) => (
                <WeekDayHeader date={props.date} label={props.label} />
              ),
            },
            day: {
              header: (props) => (
                <WeekDayHeader date={props.date} label={props.label} />
              ),
            },
          }}
          selectable
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onSelectEvent={(event: any) => {
            openDetail(event.id);
          }}
          onSelectSlot={handleSlotSelect}
          min={new Date(2000, 0, 1, 1, 0)}
          max={new Date(2000, 0, 1, 23, 59)}
          step={60}
          timeslots={1}
          eventPropGetter={eventPropGetter}
          style={{ height: "100%" }}
        />
      </Box>

      <EventDetailDialog
        open={!!selectedEventId}
        eventId={selectedEventId}
        onOpenChange={(isOpen) => {
          if (!isOpen) closeDetail();
        }}
      />
    </Box>
  );
}
