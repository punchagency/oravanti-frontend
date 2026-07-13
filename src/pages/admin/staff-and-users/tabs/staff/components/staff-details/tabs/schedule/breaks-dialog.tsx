import type { AvailabilityBreakDTO, BreakPayload } from "@/api/staff-availability";
import { useSetBreaks } from "@/hooks/use-staff-schedule-mutations";
import {
  Box,
  chakra,
  createListCollection,
  Dialog,
  Flex,
  Input,
  Portal,
  Select,
  Text,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { inputStyles } from "../../../edit-staff/input-styles";
import { DAY_NAMES, toFormTime } from "./constants";

const breakShape = z
  .object({
    dayOfWeek: z.string().min(1, "Day is required"),
    startTime: z.string().min(1, "Required"),
    endTime: z.string().min(1, "Required"),
    label: z.string(),
  })
  .refine((b) => b.startTime < b.endTime, {
    message: "Start must be before end",
    path: ["endTime"],
  });

const formSchema = z.object({
  breaks: z.array(breakShape).superRefine((breaks, ctx) => {
    const sorted = breaks
      .map((b, index) => ({ ...b, index }))
      .sort(
        (a, b) =>
          a.dayOfWeek.localeCompare(b.dayOfWeek) ||
          a.startTime.localeCompare(b.startTime),
      );
    for (let i = 1; i < sorted.length; i++) {
      if (
        sorted[i].dayOfWeek === sorted[i - 1].dayOfWeek &&
        sorted[i].startTime < sorted[i - 1].endTime
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Breaks on the same day must not overlap",
          path: [sorted[i].index, "startTime"],
        });
      }
    }
  }),
});

type FormValues = z.infer<typeof formSchema>;

const dayOptions = createListCollection({
  items: DAY_NAMES.map((name, index) => ({
    label: name,
    value: String(index),
  })),
});

function computeInitialValues(breaks: AvailabilityBreakDTO[]): FormValues {
  return {
    breaks: breaks.map((b) => ({
      dayOfWeek: String(b.dayOfWeek),
      startTime: toFormTime(b.startTime),
      endTime: toFormTime(b.endTime),
      label: b.label ?? "",
    })),
  };
}

interface BreaksDialogProps {
  staffId: string;
  breaks: AvailabilityBreakDTO[];
  open: boolean;
  onClose: () => void;
}

export function BreaksDialog({
  staffId,
  breaks,
  open,
  onClose,
}: BreaksDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: computeInitialValues(breaks),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "breaks",
  });

  useEffect(() => {
    if (open) reset(computeInitialValues(breaks));
  }, [open, breaks, reset]);

  const mutation = useSetBreaks();

  const onSubmit = (formData: FormValues) => {
    const payload: BreakPayload[] = formData.breaks.map((b) => ({
      dayOfWeek: Number(b.dayOfWeek),
      startTime: b.startTime,
      endTime: b.endTime,
      label: b.label.trim() || undefined,
    }));
    mutation.mutate(
      { staffId, breaks: payload },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      placement="center"
      scrollBehavior="inside"
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1.5px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            ref={contentRef}
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
                aria-label="Close breaks dialog"
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
                Edit breaks
              </Dialog.Title>
              <Dialog.Description
                mt="10px"
                color="fg.muted"
                fontSize="13px"
                lineHeight="1.35"
              >
                Recurring breaks (e.g. lunch) are excluded from bookable hours.
              </Dialog.Description>

              <Box mt="14px" maxH="55vh" overflowY="auto">
                {fields.length === 0 ? (
                  <Text color="fg.muted" fontSize="12px" py={2}>
                    No breaks set.
                  </Text>
                ) : (
                  <Flex direction="column" gap={3}>
                    {fields.map((field, index) => {
                      const rowErrors = errors.breaks?.[index];
                      const rowError =
                        rowErrors?.dayOfWeek?.message ??
                        rowErrors?.startTime?.message ??
                        rowErrors?.endTime?.message;
                      return (
                        <Box
                          key={field.id}
                          border="1px solid"
                          borderColor="border.muted"
                          borderRadius="8px"
                          p={3}
                        >
                          <Flex align="center" gap={2} mb={2}>
                            <Controller
                              name={`breaks.${index}.dayOfWeek`}
                              control={control}
                              render={({ field: dayField }) => (
                                <Select.Root
                                  collection={dayOptions}
                                  size="sm"
                                  flex="1"
                                  value={dayField.value ? [dayField.value] : []}
                                  onValueChange={(e) =>
                                    dayField.onChange(e.value[0] ?? "")
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
                                        boxShadow:
                                          "0 0 0 1px var(--brand-cta)",
                                      }}
                                    >
                                      <Select.ValueText placeholder="Day" />
                                    </Select.Trigger>
                                    <Select.IndicatorGroup>
                                      <Select.Indicator />
                                    </Select.IndicatorGroup>
                                  </Select.Control>
                                  <Portal container={contentRef}>
                                    <Select.Positioner>
                                      <Select.Content zIndex="popover">
                                        {dayOptions.items.map((opt) => (
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
                            <chakra.button
                              type="button"
                              aria-label="Remove break"
                              display="grid"
                              placeItems="center"
                              w="28px"
                              h="28px"
                              flexShrink={0}
                              color="fg.muted"
                              bg="transparent"
                              border="none"
                              cursor="pointer"
                              _hover={{ color: "red.solid" }}
                              onClick={() => remove(index)}
                            >
                              <Trash2 size={14} />
                            </chakra.button>
                          </Flex>
                          <Flex align="center" gap={2}>
                            <Input
                              type="time"
                              flex="1"
                              {...register(`breaks.${index}.startTime`)}
                              {...inputStyles}
                            />
                            <Text color="fg.muted" fontSize="12px">
                              –
                            </Text>
                            <Input
                              type="time"
                              flex="1"
                              {...register(`breaks.${index}.endTime`)}
                              {...inputStyles}
                            />
                            <Input
                              placeholder="Label (optional)"
                              flex="1.4"
                              {...register(`breaks.${index}.label`)}
                              {...inputStyles}
                            />
                          </Flex>
                          {rowError && (
                            <Text color="red.solid" fontSize="11px" mt={1}>
                              {rowError}
                            </Text>
                          )}
                        </Box>
                      );
                    })}
                  </Flex>
                )}

                <chakra.button
                  type="button"
                  display="inline-flex"
                  alignItems="center"
                  gap={1}
                  mt={3}
                  color="brand.solid"
                  fontSize="12px"
                  fontWeight="500"
                  cursor="pointer"
                  bg="transparent"
                  border="none"
                  onClick={() =>
                    append({
                      dayOfWeek: "1",
                      startTime: "12:00",
                      endTime: "13:00",
                      label: "",
                    })
                  }
                >
                  <Plus size={14} />
                  Add break
                </chakra.button>
              </Box>

              <Flex justify="flex-end" gap="12px" mt="18px">
                <chakra.button
                  type="submit"
                  disabled={mutation.isPending}
                  h="36px"
                  px="20px"
                  borderRadius="8px"
                  bg="brand.solid"
                  color="white"
                  fontSize="13px"
                  fontWeight="500"
                  border="none"
                  cursor="pointer"
                  opacity={mutation.isPending ? 0.6 : 1}
                  _hover={{ opacity: 0.9 }}
                >
                  {mutation.isPending ? "Saving..." : "Save breaks"}
                </chakra.button>
              </Flex>
            </Box>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
