import type { AvailabilityWindowDTO, WindowPayload } from "@/api/staff-availability";
import { useSetWeeklyAvailability } from "@/hooks/use-staff-schedule-mutations";
import {
  Box,
  chakra,
  Dialog,
  Flex,
  Input,
  Portal,
  Text,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, X } from "lucide-react";
import { useForm, useFieldArray, type Control } from "react-hook-form";
import { z } from "zod";
import { inputStyles } from "../../../edit-staff/input-styles";
import { DAY_NAMES, toFormTime } from "./constants";

const windowShape = z
  .object({
    startTime: z.string().min(1, "Required"),
    endTime: z.string().min(1, "Required"),
  })
  .refine((w) => w.startTime < w.endTime, {
    message: "Start must be before end",
    path: ["endTime"],
  });

const formSchema = z.object({
  days: z
    .array(
      z.object({
        windows: z.array(windowShape).superRefine((windows, ctx) => {
          const sorted = windows
            .map((w, index) => ({ ...w, index }))
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          for (let i = 1; i < sorted.length; i++) {
            if (sorted[i].startTime < sorted[i - 1].endTime) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Ranges must not overlap",
                path: [sorted[i].index, "startTime"],
              });
            }
          }
        }),
      }),
    )
    .length(7),
});

type FormValues = z.infer<typeof formSchema>;

function computeInitialValues(windows: AvailabilityWindowDTO[]): FormValues {
  const days: FormValues["days"] = DAY_NAMES.map(() => ({ windows: [] }));
  for (const w of windows) {
    days[w.dayOfWeek]?.windows.push({
      startTime: toFormTime(w.startTime),
      endTime: toFormTime(w.endTime),
    });
  }
  return { days };
}

function DayRows({
  control,
  dayIndex,
  errors,
  register,
}: {
  control: Control<FormValues>;
  dayIndex: number;
  errors: ReturnType<typeof useForm<FormValues>>["formState"]["errors"];
  register: ReturnType<typeof useForm<FormValues>>["register"];
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `days.${dayIndex}.windows`,
  });

  const dayErrors = errors.days?.[dayIndex]?.windows;

  return (
    <Box borderBottom="1px solid" borderColor="border.muted" py={2}>
      <Flex align="center" justify="space-between" mb={fields.length > 0 ? 2 : 0}>
        <Text color="fg" fontSize="12px" fontWeight="600">
          {DAY_NAMES[dayIndex]}
        </Text>
        <chakra.button
          type="button"
          display="inline-flex"
          alignItems="center"
          gap={1}
          color="brand.solid"
          fontSize="11px"
          fontWeight="500"
          cursor="pointer"
          bg="transparent"
          border="none"
          onClick={() => append({ startTime: "09:00", endTime: "17:00" })}
        >
          <Plus size={12} />
          Add hours
        </chakra.button>
      </Flex>

      {fields.length === 0 ? (
        <Text color="fg.muted" fontSize="11px">
          Unavailable
        </Text>
      ) : (
        <Flex direction="column" gap={2}>
          {fields.map((field, index) => {
            const rowError =
              dayErrors?.[index]?.startTime?.message ??
              dayErrors?.[index]?.endTime?.message;
            return (
              <Box key={field.id}>
                <Flex align="center" gap={2}>
                  <Input
                    type="time"
                    flex="1"
                    {...register(`days.${dayIndex}.windows.${index}.startTime`)}
                    {...inputStyles}
                  />
                  <Text color="fg.muted" fontSize="12px">
                    –
                  </Text>
                  <Input
                    type="time"
                    flex="1"
                    {...register(`days.${dayIndex}.windows.${index}.endTime`)}
                    {...inputStyles}
                  />
                  <chakra.button
                    type="button"
                    aria-label="Remove hours"
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
    </Box>
  );
}

interface WorkingHoursDialogProps {
  staffId: string;
  windows: AvailabilityWindowDTO[];
  open: boolean;
  onClose: () => void;
}

export function WorkingHoursDialog({
  staffId,
  windows,
  open,
  onClose,
}: WorkingHoursDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: computeInitialValues(windows),
  });

  const mutation = useSetWeeklyAvailability();

  const onSubmit = (formData: FormValues) => {
    const payload: WindowPayload[] = formData.days.flatMap((day, dayOfWeek) =>
      day.windows.map((w) => ({
        dayOfWeek,
        startTime: w.startTime,
        endTime: w.endTime,
      })),
    );
    mutation.mutate(
      { staffId, windows: payload },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) {
          reset(computeInitialValues(windows));
          onClose();
        }
      }}
      placement="center"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1.5px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            w="full"
            maxW="480px"
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
                aria-label="Close working hours dialog"
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
                Edit working hours
              </Dialog.Title>
              <Dialog.Description
                mt="10px"
                color="fg.muted"
                fontSize="13px"
                lineHeight="1.35"
              >
                Set the weekly working hours. Days without hours are treated as
                unavailable.
              </Dialog.Description>

              <Box mt="14px" maxH="55vh" overflowY="auto">
                {DAY_NAMES.map((_, dayIndex) => (
                  <DayRows
                    key={dayIndex}
                    control={control}
                    dayIndex={dayIndex}
                    errors={errors}
                    register={register}
                  />
                ))}
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
                  {mutation.isPending ? "Saving..." : "Save hours"}
                </chakra.button>
              </Flex>
            </Box>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
