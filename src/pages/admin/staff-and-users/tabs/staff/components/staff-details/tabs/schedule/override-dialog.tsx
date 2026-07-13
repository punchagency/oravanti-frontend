import type {
  AvailabilityOverrideDTO,
  OverridePayload,
  OverrideType,
} from "@/api/staff-availability";
import {
  useCreateOverride,
  useUpdateOverride,
} from "@/hooks/use-staff-schedule-mutations";
import {
  Box,
  chakra,
  createListCollection,
  Dialog,
  Field,
  Flex,
  Grid,
  Input,
  Portal,
  Select,
  Text,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseDate, type DateValue } from "@internationalized/date";
import { X } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { inputStyles } from "../../../edit-staff/input-styles";
import { toFormTime } from "./constants";
import { DateField } from "./date-field";

const formSchema = z
  .object({
    date: z.custom<DateValue | undefined>(),
    type: z.enum(["closed", "custom_hours"]),
    startTime: z.string(),
    endTime: z.string(),
    reason: z.string(),
  })
  .superRefine((val, ctx) => {
    if (!val.date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Date is required",
        path: ["date"],
      });
    }
    if (val.type !== "custom_hours") return;
    if (!val.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start time is required for custom hours",
        path: ["startTime"],
      });
    }
    if (!val.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time is required for custom hours",
        path: ["endTime"],
      });
    }
    if (val.startTime && val.endTime && val.startTime >= val.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start must be before end",
        path: ["endTime"],
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

const typeOptions = createListCollection({
  items: [
    { label: "Closed all day", value: "closed" },
    { label: "Custom hours", value: "custom_hours" },
  ],
});

function computeInitialValues(
  override: AvailabilityOverrideDTO | null,
): FormValues {
  return {
    date: override ? parseDate(override.date) : undefined,
    type: override?.type ?? "closed",
    startTime: override?.startTime ? toFormTime(override.startTime) : "",
    endTime: override?.endTime ? toFormTime(override.endTime) : "",
    reason: override?.reason ?? "",
  };
}

interface OverrideDialogProps {
  staffId: string;
  /** null = create mode */
  override: AvailabilityOverrideDTO | null;
  open: boolean;
  onClose: () => void;
}

export function OverrideDialog({
  staffId,
  override,
  open,
  onClose,
}: OverrideDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: computeInitialValues(override),
  });

  useEffect(() => {
    if (open) reset(computeInitialValues(override));
  }, [open, override, reset]);

  const overrideType = watch("type");

  const createMutation = useCreateOverride();
  const updateMutation = useUpdateOverride();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (formData: FormValues) => {
    const payload: OverridePayload = {
      date: formData.date!.toString(),
      type: formData.type as OverrideType,
      startTime:
        formData.type === "custom_hours" ? formData.startTime : undefined,
      endTime: formData.type === "custom_hours" ? formData.endTime : undefined,
      reason: formData.reason.trim() || undefined,
    };
    if (override) {
      updateMutation.mutate(
        { staffId, overrideId: override.id, payload },
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
                aria-label="Close override dialog"
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
                {override ? "Edit date override" : "Add date override"}
              </Dialog.Title>
              <Dialog.Description
                mt="10px"
                color="fg.muted"
                fontSize="13px"
                lineHeight="1.35"
              >
                Overrides replace the regular working hours on a specific date.
              </Dialog.Description>

              <VStack align="stretch" gap="12px" mt="18px">
                <Grid
                  templateColumns={{
                    base: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                  }}
                  gap="10px"
                >
                  <Field.Root invalid={!!errors.date}>
                    <Field.Label>Date</Field.Label>
                    <Controller
                      name="date"
                      control={control}
                      render={({ field }) => (
                        <DateField
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    {errors.date && (
                      <Field.ErrorText>{errors.date.message}</Field.ErrorText>
                    )}
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Type</Field.Label>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <Select.Root
                          collection={typeOptions}
                          size="sm"
                          value={[field.value]}
                          onValueChange={(e) =>
                            field.onChange(e.value[0] ?? "closed")
                          }
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
                              <Select.ValueText />
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
                                    <Select.ItemText>
                                      {opt.label}
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

                {overrideType === "custom_hours" && (
                  <Flex align="center" gap={2}>
                    <Field.Root invalid={!!errors.startTime} flex="1">
                      <Field.Label>Start time</Field.Label>
                      <Input
                        type="time"
                        {...register("startTime")}
                        {...inputStyles}
                      />
                      {errors.startTime && (
                        <Field.ErrorText>
                          {errors.startTime.message}
                        </Field.ErrorText>
                      )}
                    </Field.Root>
                    <Text color="fg.muted" fontSize="12px" mt={5}>
                      –
                    </Text>
                    <Field.Root invalid={!!errors.endTime} flex="1">
                      <Field.Label>End time</Field.Label>
                      <Input
                        type="time"
                        {...register("endTime")}
                        {...inputStyles}
                      />
                      {errors.endTime && (
                        <Field.ErrorText>
                          {errors.endTime.message}
                        </Field.ErrorText>
                      )}
                    </Field.Root>
                  </Flex>
                )}

                <Field.Root>
                  <Field.Label>Reason (optional)</Field.Label>
                  <Input
                    placeholder="e.g. Court appearance"
                    {...register("reason")}
                    {...inputStyles}
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
                    : override
                      ? "Save changes"
                      : "Add override"}
                </chakra.button>
              </Flex>
            </Box>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
