import type { TimeOffDTO, TimeOffPayload, TimeOffType } from "@/api/staff-availability";
import {
  useCreateTimeOff,
  useUpdateTimeOff,
} from "@/hooks/use-staff-schedule-mutations";
import {
  Box,
  chakra,
  createListCollection,
  Dialog,
  Field,
  Flex,
  Grid,
  Portal,
  Select,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseDate, type DateValue } from "@internationalized/date";
import { X } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { DateField } from "./date-field";
import { TIME_OFF_TYPE_LABELS } from "./constants";

const formSchema = z
  .object({
    type: z.string().min(1, "Type is required"),
    startDate: z.custom<DateValue | undefined>(),
    endDate: z.custom<DateValue | undefined>(),
    reason: z.string(),
  })
  .superRefine((val, ctx) => {
    if (!val.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date is required",
        path: ["startDate"],
      });
    }
    if (!val.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date is required",
        path: ["endDate"],
      });
    }
    if (
      val.startDate &&
      val.endDate &&
      val.startDate.compare(val.endDate) > 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be on or after start date",
        path: ["endDate"],
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

const typeOptions = createListCollection({
  items: Object.entries(TIME_OFF_TYPE_LABELS).map(([value, label]) => ({
    label,
    value,
  })),
});

function computeInitialValues(timeOff: TimeOffDTO | null): FormValues {
  return {
    type: timeOff?.type ?? "",
    startDate: timeOff ? parseDate(timeOff.startDate) : undefined,
    endDate: timeOff ? parseDate(timeOff.endDate) : undefined,
    reason: timeOff?.reason ?? "",
  };
}

interface TimeOffDialogProps {
  staffId: string;
  /** null = create mode */
  timeOff: TimeOffDTO | null;
  open: boolean;
  onClose: () => void;
}

export function TimeOffDialog({
  staffId,
  timeOff,
  open,
  onClose,
}: TimeOffDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: computeInitialValues(timeOff),
  });

  useEffect(() => {
    if (open) reset(computeInitialValues(timeOff));
  }, [open, timeOff, reset]);

  const createMutation = useCreateTimeOff();
  const updateMutation = useUpdateTimeOff();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (formData: FormValues) => {
    const payload: TimeOffPayload = {
      type: formData.type as TimeOffType,
      startDate: formData.startDate!.toString(),
      endDate: formData.endDate!.toString(),
      reason: formData.reason.trim() || undefined,
    };
    if (timeOff) {
      updateMutation.mutate(
        { staffId, timeOffId: timeOff.id, payload },
        { onSuccess: () => onClose() },
      );
    } else {
      createMutation.mutate(
        { staffId, payload },
        { onSuccess: () => onClose() },
      );
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      placement="center"
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1.5px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            w="full"
            maxW="440px"
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
                aria-label="Close time off dialog"
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
                {timeOff ? "Edit time off" : "Add time off"}
              </Dialog.Title>
              <Dialog.Description
                mt="10px"
                color="fg.muted"
                fontSize="13px"
                lineHeight="1.35"
              >
                Time off takes effect immediately and blocks scheduling for the
                period.
              </Dialog.Description>

              <VStack align="stretch" gap="12px" mt="18px">
                <Field.Root invalid={!!errors.type}>
                  <Field.Label>Type</Field.Label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select.Root
                        collection={typeOptions}
                        size="sm"
                        value={field.value ? [field.value] : []}
                        onValueChange={(e) => field.onChange(e.value[0] ?? "")}
                      >
                        <Select.Control>
                          <Select.Trigger
                            h="36px"
                            border="1px solid"
                            borderColor="border"
                            borderRadius="7px"
                            bg="bg"
                            _focus={{
                              borderColor: "brand.solid",
                              boxShadow: "0 0 0 1px var(--brand-cta)",
                            }}
                          >
                            <Select.ValueText placeholder="Select type" />
                          </Select.Trigger>
                          <Select.IndicatorGroup>
                            <Select.Indicator />
                          </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal>
                          <Select.Positioner>
                            <Select.Content zIndex="popover">
                              {typeOptions.items.map((opt) => (
                                <Select.Item item={opt} key={opt.value}>
                                  <Select.ItemText>{opt.label}</Select.ItemText>
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
                  <Field.Root invalid={!!errors.startDate}>
                    <Field.Label>Start date</Field.Label>
                    <Controller
                      name="startDate"
                      control={control}
                      render={({ field }) => (
                        <DateField
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    {errors.startDate && (
                      <Field.ErrorText>
                        {errors.startDate.message}
                      </Field.ErrorText>
                    )}
                  </Field.Root>

                  <Field.Root invalid={!!errors.endDate}>
                    <Field.Label>End date</Field.Label>
                    <Controller
                      name="endDate"
                      control={control}
                      render={({ field }) => (
                        <DateField
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    {errors.endDate && (
                      <Field.ErrorText>
                        {errors.endDate.message}
                      </Field.ErrorText>
                    )}
                  </Field.Root>
                </Grid>

                <Field.Root>
                  <Field.Label>Reason (optional)</Field.Label>
                  <Textarea
                    placeholder="e.g. Family vacation"
                    rows={3}
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
                    {...register("reason")}
                  />
                </Field.Root>
              </VStack>

              <Flex justify="flex-end" gap="12px" mt="18px">
                <chakra.button
                  type="submit"
                  disabled={isPending}
                  h="36px"
                  px="20px"
                  borderRadius="8px"
                  bg="brand.solid"
                  color="white"
                  fontSize="13px"
                  fontWeight="500"
                  border="none"
                  cursor="pointer"
                  opacity={isPending ? 0.6 : 1}
                  _hover={{ opacity: 0.9 }}
                >
                  {isPending
                    ? "Saving..."
                    : timeOff
                      ? "Save changes"
                      : "Add time off"}
                </chakra.button>
              </Flex>
            </Box>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
