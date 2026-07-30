import { useClients } from "@/hooks/use-clients";
import { useCases } from "@/hooks/use-cases";
import { useStaff } from "@/hooks/use-staff";
import { useFeedbackDialog } from "@/hooks/useFeedbackDialog";
import { dayjs } from "@/utils/date";
import {
  Box,
  Button,
  chakra,
  Checkbox,
  createListCollection,
  DatePicker,
  Dialog,
  Field,
  Flex,
  Grid,
  Input,
  Portal,
  Select,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDate, today as getToday } from "@internationalized/date";
import { CalendarDays, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useCalendarData } from "./calendar-data-context";
import {
  CALENDAR_FILTER_TYPES,
  EVENT_TYPE_CONFIG,
  type CalendarEventType,
  type CreateCalendarEventRequest,
} from "./types";
import { TIME_OPTIONS } from "./utils";

const formSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    type: z.string().min(1, "Event type is required"),
    clientId: z.string().optional(),
    caseId: z.string().optional(),
    date: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    location: z.string().optional(),
    assignedStaffId: z.string().optional(),
    notes: z.string().optional(),
    applyDeadlineRules: z.boolean().optional(),
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

type FormValues = z.input<typeof formSchema>;

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

interface AddEventDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAdd: (event: CreateCalendarEventRequest) => void;
  children?: ReactNode;
}

export function AddEventDialog({ open: controlledOpen, onOpenChange: controlledOnOpenChange, onAdd, children }: AddEventDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const onOpenChange = controlledOnOpenChange ?? setInternalOpen;
  const { slotData, setSlotData } = useCalendarData();
  const { showSuccess } = useFeedbackDialog();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "client_meeting",
      clientId: "",
      caseId: "",
      date: dayjs().format("YYYY-MM-DD"),
      startTime: "09:00",
      endTime: "10:00",
      location: "",
      assignedStaffId: "",
      notes: "",
      applyDeadlineRules: true,
    },
    mode: "onBlur",
  });

  const watchedClientId = watch("clientId");
  const watchedDate = watch("date");

  useEffect(() => {
    if (slotData) {
      reset({
        title: "",
        type: "client_meeting",
        clientId: "",
        caseId: "",
        date: dayjs(slotData.start).format("YYYY-MM-DD"),
        startTime: dayjs(slotData.start).format("HH:mm"),
        endTime: dayjs(slotData.end).format("HH:mm"),
        location: "",
        assignedStaffId: "",
        notes: "",
        applyDeadlineRules: true,
      });
      onOpenChange(true);
      setSlotData(null);
    }
  }, [slotData, reset, setSlotData, onOpenChange]);

  const { data: clients = [], isLoading: clientsLoading } = useClients();

  const { data: casesResponse, isLoading: casesLoading } = useCases({
    clientId: watchedClientId || undefined,
    limit: 200,
  });
  const casesData = casesResponse?.data ?? [];

  const { data: staff = [], isLoading: staffLoading } = useStaff();

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

  const clientCollection = useMemo(
    () =>
      createListCollection({
        items: clients.map((c) => ({
          label: c.displayName,
          value: c.id,
        })),
      }),
    [clients],
  );

  const caseCollection = useMemo(
    () =>
      createListCollection({
        items: casesData.map((c) => ({
          label: `${c.caseNumber} — ${c.client?.name ?? "No client"}`,
          value: c.id,
        })),
      }),
    [casesData],
  );

  const staffCollection = useMemo(
    () =>
      createListCollection({
        items: staff.map((s) => ({
          label: `${s.firstName} ${s.lastName} (${s.role.replace(/_/g, " ")})`,
          value: s.id,
        })),
      }),
    [staff],
  );

  const filteredTimeOptions = useMemo(() => {
    if (watchedDate === dayjs().format("YYYY-MM-DD")) {
      const now = dayjs();
      return TIME_OPTIONS.filter((opt) => {
        const [h, m] = opt.value.split(":").map(Number);
        return h > now.hour() || (h === now.hour() && m > now.minute());
      });
    }
    return TIME_OPTIONS;
  }, [watchedDate]);

  const timeCollection = useMemo(
    () =>
      createListCollection({
        items: filteredTimeOptions,
      }),
    [filteredTimeOptions],
  );

  const onSubmit = (data: FormValues) => {
    onAdd({
      title: data.title.trim(),
      eventType: data.type as CalendarEventType,
      startTime: dayjs(`${data.date}T${data.startTime}`).toISOString(),
      endTime: dayjs(`${data.date}T${data.endTime}`).toISOString(),
      clientId: data.clientId || undefined,
      caseId: data.caseId || undefined,
      assignedStaffId: data.assignedStaffId || undefined,
      location: data.location || undefined,
      notes: data.notes || undefined,
    });
    showSuccess({ title: "Event created" });
    reset();
    onOpenChange(false);
  };

  const isLoadingData = clientsLoading || staffLoading;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        onOpenChange(details.open);
        if (!details.open) {
          reset();
        }
      }}
      placement="center"
    >
      {children && <Dialog.Trigger asChild>{children}</Dialog.Trigger>}

      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1.5px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            w="full"
            maxW="520px"
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
                aria-label="Close add event dialog"
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

            <Box as="form" p="32px 24px 24px" onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Title
                color="fg"
                fontSize="17px"
                fontWeight="600"
                lineHeight="1.2"
              >
                Add calendar event
              </Dialog.Title>
              <Dialog.Description
                mt="10px"
                color="fg.muted"
                fontSize="13px"
                lineHeight="1.35"
              >
                Create a new hearing, interview, deadline, or meeting.
              </Dialog.Description>

              {isLoadingData ? (
                <VStack py="10" gap="3">
                  <Spinner />
                  <Text fontSize="13px" color="fg.subtle">
                    Loading form data...
                  </Text>
                </VStack>
              ) : (
                <VStack align="stretch" gap="12px" mt="18px">
                  <Field.Root invalid={!!errors.title}>
                    <Field.Label>
                      Title
                      <Text as="span" color="red.500" ml="2px">
                        *
                      </Text>
                    </Field.Label>
                    <Input
                      placeholder="e.g. Master calendar hearing"
                      {...register("title")}
                      {...inputStyles}
                    />
                    {errors.title && (
                      <Field.ErrorText>{errors.title.message}</Field.ErrorText>
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
                      <Field.ErrorText>{errors.type.message}</Field.ErrorText>
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
                      <Field.Label>Client</Field.Label>
                      {clientsLoading ? (
                        <Spinner size="sm" color="fg.muted" />
                      ) : (
                        <Controller
                          name="clientId"
                          control={control}
                          render={({ field }) => (
                            <Select.Root
                              collection={clientCollection}
                              size="sm"
                              value={field.value ? [field.value] : []}
                              onValueChange={(e) => {
                                field.onChange(e.value[0] ?? "");
                                reset((prev) => ({ ...prev, caseId: "" }));
                              }}
                            >
                              <Select.Control>
                                <Select.Trigger {...selectTriggerStyles}>
                                  <Select.ValueText placeholder="Select client" />
                                </Select.Trigger>
                                <Select.IndicatorGroup>
                                  <Select.Indicator />
                                </Select.IndicatorGroup>
                              </Select.Control>
                              <Portal>
                                <Select.Positioner>
                                  <Select.Content>
                                    {clientCollection.items.map((item) => (
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
                      )}
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Case</Field.Label>
                      {casesLoading ? (
                        <Spinner size="sm" color="fg.muted" />
                      ) : (
                        <Controller
                          name="caseId"
                          control={control}
                          render={({ field }) => (
                            <Select.Root
                              collection={caseCollection}
                              size="sm"
                              value={field.value ? [field.value] : []}
                              onValueChange={(e) =>
                                field.onChange(e.value[0] ?? "")
                              }
                            >
                              <Select.Control>
                                <Select.Trigger {...selectTriggerStyles}>
                                  <Select.ValueText placeholder="Select case" />
                                </Select.Trigger>
                                <Select.IndicatorGroup>
                                  <Select.Indicator />
                                </Select.IndicatorGroup>
                              </Select.Control>
                              <Portal>
                                <Select.Positioner>
                                  <Select.Content>
                                    {caseCollection.items.length === 0 ? (
                                      <Text
                                        p="2"
                                        fontSize="13px"
                                        color="fg.muted"
                                      >
                                        {watchedClientId
                                          ? "No cases for this client"
                                          : "Select a client first"}
                                      </Text>
                                    ) : (
                                      caseCollection.items.map((item) => (
                                        <Select.Item
                                          key={item.value}
                                          item={item}
                                        >
                                          <Select.ItemText>
                                            {item.label}
                                          </Select.ItemText>
                                        </Select.Item>
                                      ))
                                    )}
                                  </Select.Content>
                                </Select.Positioner>
                              </Portal>
                            </Select.Root>
                          )}
                        />
                      )}
                    </Field.Root>
                  </Grid>

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
                              ...(dayjs(field.value)
                                .format("YYYY-MM-DD")
                                .split("-")
                                .map(Number) as [number, number, number]),
                            )
                          : undefined;
                        return (
                          <DatePicker.Root
                            value={dateValue ? [dateValue] : []}
                            isDateUnavailable={(date) => date.compare(getToday(dayjs.tz.guess())) < 0}
                            onValueChange={(details) => {
                              const v = details.value[0];
                              if (v) {
                                field.onChange(
                                  `${v.year}-${String(v.month).padStart(2, "0")}-${String(v.day).padStart(2, "0")}`,
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
                      <Field.ErrorText>{errors.date.message}</Field.ErrorText>
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
                    <Field.Label>Location / link</Field.Label>
                    <Input
                      placeholder="Courtroom, address, or video link"
                      {...register("location")}
                      {...inputStyles}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Assigned staff</Field.Label>
                    {staffLoading ? (
                      <Spinner size="sm" color="fg.muted" />
                    ) : (
                      <Controller
                        name="assignedStaffId"
                        control={control}
                        render={({ field }) => (
                          <Select.Root
                            collection={staffCollection}
                            size="sm"
                            value={field.value ? [field.value] : []}
                            onValueChange={(e) =>
                              field.onChange(e.value[0] ?? "")
                            }
                          >
                            <Select.Control>
                              <Select.Trigger {...selectTriggerStyles}>
                                <Select.ValueText placeholder="Select staff member" />
                              </Select.Trigger>
                              <Select.IndicatorGroup>
                                <Select.Indicator />
                              </Select.IndicatorGroup>
                            </Select.Control>
                            <Portal>
                              <Select.Positioner>
                                <Select.Content>
                                  {staffCollection.items.map((item) => (
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
                    )}
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

                  <Field.Root>
                    <Controller
                      name="applyDeadlineRules"
                      control={control}
                      render={({ field }) => (
                        <Checkbox.Root
                          checked={field.value}
                          onCheckedChange={(e) => field.onChange(!!e.checked)}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label fontSize="13px" color="fg">
                            Apply deadline cascade rules
                          </Checkbox.Label>
                        </Checkbox.Root>
                      )}
                    />
                    <Text fontSize="12px" color="fg.muted" mt="4px" ml="24px">
                      Deadline rules will be automatically applied based on the
                      hearing type.
                    </Text>
                  </Field.Root>
                </VStack>
              )}

              {!isLoadingData && (
                <Flex justify="flex-end" gap="12px" mt="18px">
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
                  >
                    Add event
                  </Button>
                </Flex>
              )}
            </Box>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
