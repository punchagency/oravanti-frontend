import { useClients } from "@/hooks/use-clients";
import { useCases } from "@/hooks/use-cases";
import { useResetOnOpen } from "@/hooks/use-reset-on-open";
import { useStaffs } from "@/hooks/use-staff";
import { useFeedbackDialog } from "@/hooks/useFeedbackDialog";
import { ControlSkeleton } from "@/components/ui/theme-skeleton";
import { useCreateCalendarEvent } from "./use-calendar";
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
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { CalendarDate, today as getToday } from "@internationalized/date";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  Control,
  FieldErrors,
  UseFormTrigger,
} from "react-hook-form";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  CALENDAR_FILTER_TYPES,
  EVENT_TYPE_CONFIG,
  type CalendarEventType,
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

/** Fresh defaults per open — `date` must be today, not module-load day. */
const eventDefaults = (): FormValues => ({
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
});

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

/**
 * Self-contained event dialog. By default it opens from its children
 * (wrapped in a Chakra Trigger) and owns its open state; pass `open` +
 * `onOpenChange` to control it instead (e.g. opened from a menu item,
 * per the Chakra "dialog from menu" docs pattern).
 *
 * Either way the form — and therefore its data queries — first mounts when
 * the dialog opens (`lazyMount`), so a never-opened dialog never hits the
 * API. It then stays mounted (hidden) so reopening is instant; the form
 * resets itself on each open via `useResetOnOpen`.
 */
export function QuickAddEventDialog({
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  children?: ReactNode;
  /** Pass `open` to control the dialog (e.g. opened from a menu item); omit it for a self-contained trigger. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const handleOpenChange = (next: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => handleOpenChange(details.open)}
      lazyMount
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

            <QuickAddEventForm
              open={open}
              close={() => handleOpenChange(false)}
            />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

/** Everything the event form needs lives here so nothing runs before the first open. */
function QuickAddEventForm({
  open,
  close,
}: {
  open: boolean;
  close: () => void;
}) {
  const { showSuccess } = useFeedbackDialog();
  const createEvent = useCreateCalendarEvent();

  const {
    register,
    handleSubmit,
    control,
    reset,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: eventDefaults(),
    mode: "onBlur",
  });

  // Stays mounted between opens — restore pristine defaults on each open.
  const resetForm = useCallback(() => reset(eventDefaults()), [reset]);
  useResetOnOpen(open, resetForm);

  const { data: clients = [], isLoading: clientsLoading } = useClients();

  const { data: staff = [], isLoading: staffLoading } = useStaffs();

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

  const onSubmit = (data: FormValues) => {
    createEvent.mutate({
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
    // Closing resets on next open (useResetOnOpen) — no unmount needed.
    close();
  };

  const isLoadingData = clientsLoading || staffLoading;

  return (
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

              {/* Fields render immediately; only the query-fed selects below
                  wait on data and show a skeleton until it arrives. */}
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
                        <ControlSkeleton />
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

                    <CaseSelectField control={control} />
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

                  <TimeFields control={control} errors={errors} trigger={trigger} />

                  <Field.Root>
                    <Field.Label>Location / link</Field.Label>
                    <Input
                      placeholder="e.g. Courtroom 4B or Zoom link"
                      {...register("location")}
                      {...inputStyles}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Assigned staff</Field.Label>
                    {staffLoading ? (
                      <ControlSkeleton />
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
                                <Select.ValueText placeholder="Select staff" />
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
                    <Field.Label>Description / notes</Field.Label>
                    <Textarea
                      placeholder="Optional notes or agenda items"
                      {...register("notes")}
                      {...inputStyles}
                      h="80px"
                    />
                  </Field.Root>

                  <Controller
                    name="applyDeadlineRules"
                    control={control}
                    render={({ field }) => (
                      <Flex align="center" gap="2">
                        <Checkbox.Root
                          checked={field.value}
                          onCheckedChange={(e) => field.onChange(!!e.checked)}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label fontSize="13px" color="fg.muted">
                            Apply deadline cascade rules
                          </Checkbox.Label>
                        </Checkbox.Root>
                      </Flex>
                    )}
                  />
                </VStack>

              <Flex justify="flex-end" gap="8px" mt="24px">
                <Button
                  type="button"
                  variant="outline"
                  borderColor="border"
                  color="fg.muted"
                  onClick={close}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  bg="brand.solid"
                  color="white"
                  _hover={{ bg: "brand.solid/90" }}
                  disabled={isLoadingData}
                >
                  Add event
                </Button>
              </Flex>
            </Box>
  );
}

/*
  Case options depend on the selected client, so this field subscribes to
  `clientId` itself. Keeping that subscription here — not in
  QuickAddEventForm — means typing elsewhere never re-renders this query
  tree, and the form skips the React Compiler opt-out that `watch()` causes.
*/
function CaseSelectField({
  control,
}: {
  control: Control<FormValues>;
}) {
  const clientId = useWatch({ control, name: "clientId" });

  const { data: casesResponse, isLoading } = useCases({
    clientId: clientId || undefined,
    limit: 200,
  });

  const caseCollection = useMemo(
    () =>
      createListCollection({
        items: (casesResponse?.data ?? []).map((c) => ({
          label: `${c.caseNumber} — ${c.client?.name ?? "No client"}`,
          value: c.id,
        })),
      }),
    [casesResponse],
  );

  return (
    <Field.Root>
      <Field.Label>Case</Field.Label>
      {isLoading ? (
        <ControlSkeleton />
      ) : (
        <Controller
          name="caseId"
          control={control}
          render={({ field }) => (
            <Select.Root
              collection={caseCollection}
              size="sm"
              value={field.value ? [field.value] : []}
              onValueChange={(e) => field.onChange(e.value[0] ?? "")}
              disabled={!clientId}
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
                    {caseCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        <Select.ItemText>{item.label}</Select.ItemText>
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
  );
}

/*
  Both time fields share one option list (past times are hidden for today)
  and one cross-field validation effect, so they subscribe to `date`,
  `startTime` and `endTime` together here rather than in the form parent.
*/
function TimeFields({
  control,
  errors,
  trigger,
}: {
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
  trigger: UseFormTrigger<FormValues>;
}) {
  const date = useWatch({ control, name: "date" });
  const startTime = useWatch({ control, name: "startTime" });
  const endTime = useWatch({ control, name: "endTime" });

  useEffect(() => {
    if (startTime && endTime) {
      trigger(["startTime", "endTime"]);
    }
  }, [startTime, endTime, trigger]);

  const filteredTimeOptions = useMemo(() => {
    if (date === dayjs().format("YYYY-MM-DD")) {
      const now = dayjs();
      return TIME_OPTIONS.filter((opt) => {
        const [h, m] = opt.value.split(":").map(Number);
        return h > now.hour() || (h === now.hour() && m > now.minute());
      });
    }
    return TIME_OPTIONS;
  }, [date]);

  const timeCollection = useMemo(
    () =>
      createListCollection({
        items: filteredTimeOptions,
      }),
    [filteredTimeOptions],
  );

  return (
    <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="10px">
      <Field.Root invalid={!!errors.startTime}>
        <Field.Label>
          Start time
          <Text as="span" color="red.500" ml="2px">
            *
          </Text>
        </Field.Label>
        <Controller
          name="startTime"
          control={control}
          render={({ field }) => (
            <Select.Root
              collection={timeCollection}
              size="sm"
              value={[field.value]}
              onValueChange={(e) => field.onChange(e.value[0] ?? "")}
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
                    {timeCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        <Select.ItemText>{item.label}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          )}
        />
        {errors.startTime && (
          <Field.ErrorText>{errors.startTime.message}</Field.ErrorText>
        )}
      </Field.Root>

      <Field.Root invalid={!!errors.endTime}>
        <Field.Label>
          End time
          <Text as="span" color="red.500" ml="2px">
            *
          </Text>
        </Field.Label>
        <Controller
          name="endTime"
          control={control}
          render={({ field }) => (
            <Select.Root
              collection={timeCollection}
              size="sm"
              value={[field.value]}
              onValueChange={(e) => field.onChange(e.value[0] ?? "")}
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
                    {timeCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        <Select.ItemText>{item.label}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          )}
        />
        {errors.endTime && (
          <Field.ErrorText>{errors.endTime.message}</Field.ErrorText>
        )}
      </Field.Root>
    </Grid>
  );
}
