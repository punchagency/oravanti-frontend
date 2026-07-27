import {
  Badge,
  Box,
  Button,
  chakra,
  DatePicker,
  Dialog,
  Field,
  Flex,
  Grid,
  HStack,
  Input,
  Portal,
  Select,
  Separator,
  Spinner,
  Text,
  Textarea,
  VStack,
  createListCollection,
} from "@chakra-ui/react";
import { CalendarDate } from "@internationalized/date";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCalendarEventDetail,
  useUpdateCalendarEvent,
  useDeleteCalendarEvent,
} from "./use-calendar";
import { useFeedbackDialog } from "@/hooks/useFeedbackDialog";
import {
  CALENDAR_FILTER_TYPES,
  EVENT_TYPE_CONFIG,
  type CalendarEventType,
} from "./types";
import { CalendarDays, X } from "lucide-react";
import { TIME_OPTIONS } from "./utils";

const editSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    type: z.string().min(1, "Event type is required"),
    date: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    location: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.startTime || !data.endTime) return true;
      return data.endTime > data.startTime;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    },
  );

type EditFormValues = z.input<typeof editSchema>;

const inputStyles = {
  h: "36px",
  px: "12px",
  border: "1px solid",
  borderColor: "border",
  borderRadius: "7px",
  bg: "bg",
  color: "fg",
  fontSize: "13px",
  _placeholder: { color: "fg.muted" },
  _focus: {
    borderColor: "brand.solid",
    boxShadow: "0 0 0 1px var(--brand-cta)",
  },
};

const selectTriggerStyles = {
  h: "36px",
  border: "1px solid",
  borderColor: "border",
  borderRadius: "7px",
  bg: "bg",
  _focus: {
    borderColor: "brand.solid",
    boxShadow: "0 0 0 1px var(--brand-cta)",
  },
};

interface EventDetailDialogProps {
  open: boolean;
  eventId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailDialog({
  open,
  eventId,
  onOpenChange,
}: EventDetailDialogProps) {
  const [mode, setMode] = useState<"view" | "edit" | "delete-confirm">("view");
  const { data: event, isLoading } = useCalendarEventDetail(eventId);
  const updateEvent = useUpdateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();
  const { showSuccess, showError } = useFeedbackDialog();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    mode: "onBlur",
  });

  const typeCollection = useMemo(
    () =>
      createListCollection({
        items: CALENDAR_FILTER_TYPES.map((t) => ({
          label: EVENT_TYPE_CONFIG[t].label,
          value: t,
        })),
      }),
    [],
  );

  const timeCollection = useMemo(
    () =>
      createListCollection({
        items: TIME_OPTIONS,
      }),
    [],
  );

  const enterEditMode = () => {
    if (!event) return;
    reset({
      title: event.title,
      type: event.eventType,
      date: dayjs(event.startTime).format("YYYY-MM-DD"),
      startTime: dayjs(event.startTime).format("HH:mm"),
      endTime: event.endTime ? dayjs(event.endTime).format("HH:mm") : "",
      location: event.location ?? "",
      notes: event.notes ?? "",
    });
    setMode("edit");
  };

  const handleEditSubmit = (data: EditFormValues) => {
    if (!eventId) return;
    updateEvent.mutate(
      {
        id: eventId,
        title: data.title.trim(),
        eventType: data.type as CalendarEventType,
        startTime: dayjs(`${data.date}T${data.startTime}`).toISOString(),
        endTime: data.endTime
          ? dayjs(`${data.date}T${data.endTime}`).toISOString()
          : undefined,
        location: data.location || undefined,
        notes: data.notes || undefined,
      },
      {
        onSuccess: () => {
          showSuccess({ title: "Event updated" });
          setMode("view");
        },
        onError: () => {
          showError({ title: "Failed to update event" });
        },
      },
    );
  };

  const handleDelete = () => {
    if (!eventId) return;
    deleteEvent.mutate(eventId, {
      onSuccess: () => {
        showSuccess({ title: "Event deleted" });
        onOpenChange(false);
      },
      onError: () => {
        showError({ title: "Failed to delete event" });
      },
    });
  };

  const handleMarkComplete = () => {
    if (!eventId) return;
    updateEvent.mutate(
      { id: eventId, status: "completed" },
      {
        onSuccess: () => {
          showSuccess({ title: "Event marked complete" });
          onOpenChange(false);
        },
      },
    );
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setMode("view");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => handleClose(details.open)}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1.5px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            w="full"
            maxW={mode === "edit" ? "520px" : "480px"}
            border="1px solid"
            borderColor="border"
            borderRadius="14px"
            bg="bg"
            p="0"
            boxShadow="0 24px 70px rgba(0, 0, 0, 0.26)"
          >
            <Dialog.CloseTrigger asChild>
              <chakra.button
                type="button"
                aria-label="Close event detail dialog"
                position="absolute"
                top="22px"
                right="22px"
                display="grid"
                placeItems="center"
                w="32px"
                h="32px"
                border="1px solid"
                borderColor="border"
                borderRadius="8px"
                bg="bg"
                color="fg.muted"
                zIndex={1}
              >
                <X size={16} />
              </chakra.button>
            </Dialog.CloseTrigger>

            {isLoading ? (
              <Box p="32px 24px 24px">
                <Dialog.Title
                  color="fg"
                  fontSize="17px"
                  fontWeight="600"
                  lineHeight="1.2"
                >
                  Loading...
                </Dialog.Title>
                <VStack py="10" gap="3">
                  <Spinner />
                  <Text fontSize="13px" color="fg.muted">
                    Loading event details...
                  </Text>
                </VStack>
              </Box>
            ) : mode === "edit" && event ? (
              /* ── Edit form (matches add-event pattern) ── */
              <Box
                as="form"
                p="32px 24px 24px"
                onSubmit={handleSubmit(handleEditSubmit)}
              >
                <Dialog.Title
                  color="fg"
                  fontSize="17px"
                  fontWeight="600"
                  lineHeight="1.2"
                >
                  Edit event
                </Dialog.Title>
                <Dialog.Description
                  mt="10px"
                  color="fg.muted"
                  fontSize="13px"
                  lineHeight="1.35"
                >
                  Update event details. Auto-generated deadlines will not be
                  affected.
                </Dialog.Description>

                <VStack align="stretch" gap="12px" mt="18px">
                  <Field.Root invalid={!!errors.title}>
                    <Field.Label>
                      Title
                      <Text as="span" color="red.500" ml="2px">
                        *
                      </Text>
                    </Field.Label>
                    <Input
                      {...register("title")}
                      {...inputStyles}
                    />
                    {errors.title && (
                      <Field.ErrorText>
                        {errors.title.message}
                      </Field.ErrorText>
                    )}
                  </Field.Root>

                  <Field.Root invalid={!!errors.type}>
                    <Field.Label>
                      Event type
                      <Text as="span" color="red.500" ml="2px">
                        *
                      </Text>
                    </Field.Label>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <Select.Root
                          collection={typeCollection}
                          size="sm"
                          value={[field.value]}
                          onValueChange={(e) =>
                            field.onChange(e.value[0] ?? "")
                          }
                        >
                          <Select.Control>
                            <Select.Trigger {...selectTriggerStyles}>
                              <Select.ValueText />
                            </Select.Trigger>
                            <Select.IndicatorGroup>
                              <Select.Indicator />
                            </Select.IndicatorGroup>
                          </Select.Control>
                          <Portal>
                            <Select.Positioner>
                              <Select.Content>
                                {typeCollection.items.map((item) => (
                                  <Select.Item key={item.value} item={item}>
                                    <Select.ItemText>
                                      {item.label}
                                    </Select.ItemText>
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select.Positioner>
                          </Portal>
                        </Select.Root>
                      )}
                    />
                    {errors.type && (
                      <Field.ErrorText>
                        {errors.type.message}
                      </Field.ErrorText>
                    )}
                  </Field.Root>

                  <Field.Root invalid={!!errors.date}>
                    <Field.Label>
                      Date
                      <Text as="span" color="red.500" ml="2px">
                        *
                      </Text>
                    </Field.Label>
                    <Controller
                      name="date"
                      control={control}
                      render={({ field }) => {
                        const dateValue = field.value
                          ? new CalendarDate(
                              ...dayjs(field.value)
                                .format("YYYY-MM-DD")
                                .split("-")
                                .map(Number) as [number, number, number]
                            )
                          : undefined;
                        return (
                          <DatePicker.Root
                            value={dateValue ? [dateValue] : []}
                            onValueChange={(details) => {
                              const v = details.value[0];
                              if (v) {
                                field.onChange(
                                  `${v.year}-${String(v.month).padStart(2, "0")}-${String(v.day).padStart(2, "0")}`
                                );
                              } else {
                                field.onChange("");
                              }
                            }}
                          >
                            <DatePicker.Control>
                              <DatePicker.Input
                                h="36px"
                                px="12px"
                                border="1px solid"
                                borderColor="border"
                                borderRadius="7px"
                                bg="bg"
                                color="fg"
                                fontSize="13px"
                                _focus={{
                                  borderColor: "brand.solid",
                                  boxShadow: "0 0 0 1px var(--brand-cta)",
                                }}
                              />
                              <DatePicker.IndicatorGroup>
                                <DatePicker.Trigger
                                  asChild
                                  border="none"
                                  bg="transparent"
                                  color="fg.muted"
                                  cursor="pointer"
                                >
                                  <chakra.button type="button">
                                    <CalendarDays size={16} />
                                  </chakra.button>
                                </DatePicker.Trigger>
                              </DatePicker.IndicatorGroup>
                            </DatePicker.Control>
                            <Portal>
                              <DatePicker.Positioner>
                                <DatePicker.Content>
                                  <DatePicker.View view="day">
                                    <DatePicker.Header />
                                    <DatePicker.DayTable />
                                  </DatePicker.View>
                                  <DatePicker.View view="month">
                                    <DatePicker.Header />
                                    <DatePicker.MonthTable />
                                  </DatePicker.View>
                                  <DatePicker.View view="year">
                                    <DatePicker.Header />
                                    <DatePicker.YearTable />
                                  </DatePicker.View>
                                </DatePicker.Content>
                              </DatePicker.Positioner>
                            </Portal>
                          </DatePicker.Root>
                        );
                      }}
                    />
                    {errors.date && (
                      <Field.ErrorText>
                        {errors.date.message}
                      </Field.ErrorText>
                    )}
                  </Field.Root>

                  <Grid
                    templateColumns={{
                      base: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                    }}
                    gap="10px"
                  >
                    <Field.Root>
                      <Field.Label>Start time</Field.Label>
                      <Controller
                        name="startTime"
                        control={control}
                        render={({ field }) => (
                          <Select.Root
                            collection={timeCollection}
                            size="sm"
                            value={field.value ? [field.value] : []}
                            onValueChange={(e) =>
                              field.onChange(e.value[0] ?? "")
                            }
                          >
                            <Select.Control>
                              <Select.Trigger {...selectTriggerStyles}>
                                <Select.ValueText placeholder="Select time" />
                              </Select.Trigger>
                              <Select.IndicatorGroup>
                                <Select.Indicator />
                              </Select.IndicatorGroup>
                            </Select.Control>
                            <Portal>
                              <Select.Positioner>
                                <Select.Content>
                                  {timeCollection.items.map((item) => (
                                    <Select.Item key={item.value} item={item}>
                                      <Select.ItemText>
                                        {item.label}
                                      </Select.ItemText>
                                    </Select.Item>
                                  ))}
                                </Select.Content>
                              </Select.Positioner>
                            </Portal>
                          </Select.Root>
                        )}
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>End time</Field.Label>
                      <Controller
                        name="endTime"
                        control={control}
                        render={({ field }) => (
                          <Select.Root
                            collection={timeCollection}
                            size="sm"
                            value={field.value ? [field.value] : []}
                            onValueChange={(e) =>
                              field.onChange(e.value[0] ?? "")
                            }
                          >
                            <Select.Control>
                              <Select.Trigger {...selectTriggerStyles}>
                                <Select.ValueText placeholder="Select time" />
                              </Select.Trigger>
                              <Select.IndicatorGroup>
                                <Select.Indicator />
                              </Select.IndicatorGroup>
                            </Select.Control>
                            <Portal>
                              <Select.Positioner>
                                <Select.Content>
                                  {timeCollection.items.map((item) => (
                                    <Select.Item key={item.value} item={item}>
                                      <Select.ItemText>
                                        {item.label}
                                      </Select.ItemText>
                                    </Select.Item>
                                  ))}
                                </Select.Content>
                              </Select.Positioner>
                            </Portal>
                          </Select.Root>
                        )}
                      />
                    </Field.Root>
                  </Grid>

                  <Field.Root>
                    <Field.Label>Location</Field.Label>
                    <Input
                      placeholder="Courtroom, address, or video link"
                      {...register("location")}
                      {...inputStyles}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Description</Field.Label>
                    <Textarea
                      placeholder="Optional"
                      {...register("notes")}
                      h="72px"
                      px="12px"
                      border="1px solid"
                      borderColor="border"
                      borderRadius="7px"
                      bg="bg"
                      color="fg"
                      fontSize="13px"
                      _placeholder={{ color: "fg.muted" }}
                      _focus={{
                        borderColor: "brand.solid",
                        boxShadow: "0 0 0 1px var(--brand-cta)",
                      }}
                    />
                  </Field.Root>
                </VStack>

                <Flex justify="flex-end" gap="12px" mt="18px">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    color="fg.muted"
                    onClick={() => setMode("view")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    h="36px"
                    px="20px"
                    borderRadius="7px"
                    fontWeight={600}
                    fontSize="13px"
                    bg="brand.solid"
                    color="brand.fg"
                    _hover={{ bg: "brand.emphasized" }}
                    loading={updateEvent.isPending}
                  >
                    Save changes
                  </Button>
                </Flex>
              </Box>
            ) : mode === "delete-confirm" ? (
              /* ── Delete confirmation ── */
              <Box p="32px 24px 24px">
                <Dialog.Title
                  color="fg"
                  fontSize="17px"
                  fontWeight="600"
                  lineHeight="1.2"
                >
                  Delete event
                </Dialog.Title>
                <VStack gap="4" align="stretch" py="4" mt="10px">
                  <Text fontSize="14px" color="fg">
                    Are you sure you want to delete this event? This action
                    cannot be undone.
                  </Text>
                  {event?.autoGeneratedDeadlines &&
                    event.autoGeneratedDeadlines.length > 0 && (
                      <Text fontSize="13px" color="fg.muted">
                        This will also remove{" "}
                        {event.autoGeneratedDeadlines.length} auto-generated
                        deadline(s).
                      </Text>
                    )}
                </VStack>
                <Flex justify="flex-end" gap="12px" mt="18px">
                  <Button
                    size="sm"
                    variant="ghost"
                    color="fg.muted"
                    onClick={() => setMode("view")}
                  >
                    Cancel
                  </Button>
                  <Button
                    h="36px"
                    px="20px"
                    borderRadius="7px"
                    fontWeight={600}
                    fontSize="13px"
                    bg="red.500"
                    color="white"
                    _hover={{ bg: "red.600" }}
                    onClick={handleDelete}
                    loading={deleteEvent.isPending}
                  >
                    Delete event
                  </Button>
                </Flex>
              </Box>
            ) : event ? (
              /* ── View mode ── */
              <Box p="32px 24px 24px">
                <Dialog.Title
                  color="fg"
                  fontSize="17px"
                  fontWeight="600"
                  lineHeight="1.2"
                >
                  {event.title}
                </Dialog.Title>

                <VStack gap="12px" mt="18px" align="stretch">
                  <HStack gap="8px" flexWrap="wrap">
                    <Badge
                      alignSelf="flex-start"
                      bg={EVENT_TYPE_CONFIG[event.eventType]?.bgAlpha}
                      color={EVENT_TYPE_CONFIG[event.eventType]?.color}
                      px="10px"
                      py="4px"
                      borderRadius="6px"
                      fontSize="12px"
                      fontWeight={500}
                    >
                      {EVENT_TYPE_CONFIG[event.eventType]?.label}
                    </Badge>
                    {event.status === "cancelled" && (
                      <Badge
                        alignSelf="flex-start"
                        bg="red.50"
                        color="red.600"
                        _dark={{ bg: "red.950", color: "red.300" }}
                        px="10px"
                        py="4px"
                        borderRadius="6px"
                        fontSize="12px"
                        fontWeight={500}
                      >
                        Cancelled
                      </Badge>
                    )}
                    {event.status === "completed" && (
                      <Badge
                        alignSelf="flex-start"
                        bg="green.50"
                        color="green.600"
                        _dark={{ bg: "green.950", color: "green.300" }}
                        px="10px"
                        py="4px"
                        borderRadius="6px"
                        fontSize="12px"
                        fontWeight={500}
                      >
                        Completed
                      </Badge>
                    )}
                  </HStack>

                  {event.client && (
                    <HStack justify="space-between">
                      <Text fontSize="13px" color="fg.muted">Client</Text>
                      <Text fontSize="13px" color="fg" fontWeight={500}>
                        {event.client.name}
                      </Text>
                    </HStack>
                  )}

                  {event.case && (
                    <HStack justify="space-between">
                      <Text fontSize="13px" color="fg.muted">Case ref</Text>
                      <Text fontSize="13px" color="fg" fontWeight={500}>
                        {event.case.caseNumber}
                      </Text>
                    </HStack>
                  )}

                  {event.lead && (
                    <HStack justify="space-between">
                      <Text fontSize="13px" color="fg.muted">Lead</Text>
                      <Text fontSize="13px" color="fg" fontWeight={500}>
                        {event.lead.name}
                      </Text>
                    </HStack>
                  )}

                  <Separator borderColor="border.subtle" />

                  <HStack justify="space-between">
                    <Text fontSize="13px" color="fg.muted">Date / time</Text>
                    <Text
                      fontSize="13px"
                      color={event.status === "cancelled" ? "fg.muted" : "fg"}
                      fontWeight={500}
                      textDecoration={event.status === "cancelled" ? "line-through" : "none"}
                    >
                      {dayjs(event.startTime).format("MMM D, YYYY · h:mm A")}
                      {event.endTime
                        ? ` – ${dayjs(event.endTime).format("h:mm A")}`
                        : ""}
                    </Text>
                  </HStack>

                  {event.location && (
                    <HStack justify="space-between">
                      <Text fontSize="13px" color="fg.muted">Location</Text>
                      <Text fontSize="13px" color="fg" fontWeight={500}>
                        {event.location}
                      </Text>
                    </HStack>
                  )}

                  <Separator borderColor="border.subtle" />

                  {event.assignedStaff && (
                    <HStack justify="space-between">
                      <Text fontSize="13px" color="fg.muted">
                        {event.assignedStaff.role || "Assigned"}
                      </Text>
                      <Text fontSize="13px" color="fg" fontWeight={500}>
                        {event.assignedStaff.name}
                      </Text>
                    </HStack>
                  )}

                  {event.notes && (
                    <>
                      <Separator borderColor="border.subtle" />
                      <Text fontSize="13px" color="fg.muted">Description</Text>
                      <Text fontSize="13px" color="fg">
                        {event.notes}
                      </Text>
                    </>
                  )}

                  {event.autoGeneratedDeadlines &&
                    event.autoGeneratedDeadlines.length > 0 && (
                      <>
                        <Separator borderColor="border.subtle" />
                        <Text fontSize="12px" color="fg.muted" fontWeight={600}>
                          Auto-generated deadlines
                        </Text>
                        {event.autoGeneratedDeadlines.map((d) => (
                          <HStack
                            key={d.id}
                            justify="space-between"
                            pl="8px"
                            borderLeft="2px solid"
                            borderColor={
                              EVENT_TYPE_CONFIG[d.eventType]?.color ?? "gray"
                            }
                          >
                            <Text fontSize="12px" color="fg">
                              {d.title}
                            </Text>
                            <Text
                              fontSize="11px"
                              color="fg.muted"
                              whiteSpace="nowrap"
                            >
                              {dayjs(d.startTime).format("MMM D")}
                            </Text>
                          </HStack>
                        ))}
                      </>
                    )}
                </VStack>

                {event.status === "cancelled" ? (
                  <Flex justify="flex-end" gap="12px" mt="18px">
                    {event.case && (
                      <Button
                        size="sm"
                        variant="ghost"
                        color="fg.muted"
                        onClick={() => {
                          window.location.href = `/cases/${event.case!.id}`;
                        }}
                      >
                        View case
                      </Button>
                    )}
                  </Flex>
                ) : event.status === "completed" ? (
                  <Flex justify="flex-end" gap="12px" mt="18px">
                    {event.case && (
                      <Button
                        size="sm"
                        variant="ghost"
                        color="fg.muted"
                        onClick={() => {
                          window.location.href = `/cases/${event.case!.id}`;
                        }}
                      >
                        View case
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      colorPalette="red"
                      onClick={() => setMode("delete-confirm")}
                    >
                      Delete
                    </Button>
                  </Flex>
                ) : (
                  <Flex justify="flex-end" gap="12px" mt="18px">
                    {event.case && (
                      <Button
                        size="sm"
                        variant="ghost"
                        color="fg.muted"
                        onClick={() => {
                          window.location.href = `/cases/${event.case!.id}`;
                        }}
                      >
                        View case
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      colorPalette="red"
                      onClick={() => setMode("delete-confirm")}
                    >
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      color="fg.muted"
                      onClick={enterEditMode}
                    >
                      Edit
                    </Button>
                    <Button
                      h="36px"
                      px="20px"
                      borderRadius="7px"
                      fontWeight={600}
                      fontSize="13px"
                      bg="brand.solid"
                      color="brand.fg"
                      _hover={{ bg: "brand.emphasized" }}
                      onClick={handleMarkComplete}
                      loading={updateEvent.isPending}
                    >
                      Mark complete
                    </Button>
                  </Flex>
                )}
              </Box>
            ) : (
              <Box p="32px 24px 24px">
                <Dialog.Title
                  color="fg"
                  fontSize="17px"
                  fontWeight="600"
                  lineHeight="1.2"
                >
                  Event not found
                </Dialog.Title>
              </Box>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
