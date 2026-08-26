import { Box, Button, Dialog, Input, Portal, Text, Textarea, VStack } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarCheck } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import type { CaseMilestone } from "@/api/case-details";
import { DateField } from "@/components/ui/date-field";
import { FormSelect } from "@/components/ui/form-select";
import { useRecordCaseMilestone } from "@/hooks/use-case-details";

/**
 * Records what the agency did — one dialog for all six milestones, not six forms.
 *
 * They all take the same three things (a date, the notice it was read off, and a
 * note), so six bespoke forms would be six places to fix the same bug. The
 * milestone is a field in the form rather than a prop, which also makes this
 * reachable from anywhere without deciding in advance which one is being
 * recorded.
 *
 * Recording one is the single most consequential write on an AOS matter: sixteen
 * of the template's steps anchor on these six dates, and every one of them shows
 * as "due once recorded" until the date exists. The hint under the picker says
 * so, because otherwise this reads like an ordinary data-entry field.
 *
 * Re-recording an existing milestone corrects it in place and is audited as a
 * correction, which is why nothing here prevents picking one that is already set.
 */

/**
 * The six values the backend's `case_milestone` enum carries, with the label a
 * paralegal would use. Keyed on the exact API strings — never a re-cased variant.
 */
const MILESTONES: { value: CaseMilestone; label: string }[] = [
  { value: "receipt", label: "Receipt notice (I-797C)" },
  { value: "biometrics_appointment", label: "Biometrics appointment" },
  { value: "interview_scheduled", label: "Interview scheduled" },
  { value: "decision", label: "Decision" },
  { value: "card_valid_to", label: "EAD/AP card expiry" },
  { value: "green_card_expiration", label: "Green card expiry" },
];

const schema = z.object({
  milestone: z.string().min(1),
  /*
    Required, and the only required field. Everything the milestone sets in
    motion — sixteen template steps, two calendar entries — hangs off this date,
    so an empty one would record a milestone that anchors nothing.
  */
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "A date is required"),
  noticeNumber: z.string().trim().max(40),
  note: z.string().trim().max(2000),
});

type FormValues = z.infer<typeof schema>;

/** The two that also land on a calendar, so the dialog can say so. */
const APPOINTMENTS = new Set<CaseMilestone>(["biometrics_appointment", "interview_scheduled"]);

export function RecordMilestoneDialog({
  caseId,
  defaultMilestone = "receipt",
  triggerLabel = "Record milestone",
}: {
  caseId: string;
  defaultMilestone?: CaseMilestone;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const record = useRecordCaseMilestone(caseId);

  const EMPTY: FormValues = {
    milestone: defaultMilestone,
    occurredOn: "",
    noticeNumber: "",
    note: "",
  };

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
    mode: "onTouched",
  });

  // Watched rather than read from `getValues`, because the calendar hint below
  // has to re-render when the picker changes.
  const milestone = useWatch({ control, name: "milestone" }) as CaseMilestone;

  const onSubmit = handleSubmit((values) =>
    record.mutate(
      {
        milestone: values.milestone as CaseMilestone,
        occurredOn: values.occurredOn,
        noticeNumber: values.noticeNumber.trim() || null,
        note: values.note.trim() || null,
      },
      { onSuccess: () => setOpen(false) },
    ),
  );

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        setOpen(details.open);
        if (!details.open) reset(EMPTY);
      }}
      size="sm"
    >
      <Dialog.Trigger asChild>
        <Button size="xs" variant="outline" borderColor="border" h="26px" fontSize="11px">
          <CalendarCheck size={11} />
          {triggerLabel}
        </Button>
      </Dialog.Trigger>

      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            w="full"
            maxW="440px"
            border="1px solid"
            borderColor="border"
            borderRadius="lg"
            bg="bg"
          >
            <Dialog.Header>
              <Dialog.Title fontSize="14px" fontWeight="600">
                Record a milestone
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={3} align="stretch">
                <Text fontSize="12px" color="fg.muted">
                  The date USCIS put on the notice. Recording it schedules every task that
                  waits on it.
                </Text>

                <Box>
                  <Text
                    fontSize="10px"
                    fontWeight="500"
                    color="fg.subtle"
                    textTransform="uppercase"
                    mb={1}
                  >
                    Milestone
                  </Text>
                  <Controller
                    name="milestone"
                    control={control}
                    render={({ field }) => (
                      <FormSelect
                        options={MILESTONES}
                        value={field.value}
                        onChange={field.onChange}
                        ariaLabel="Milestone"
                      />
                    )}
                  />
                  {APPOINTMENTS.has(milestone) && (
                    <Text fontSize="10px" color="fg.subtle" mt={1}>
                      Also added to the calendar. Re-recording moves the existing entry rather
                      than adding a second one.
                    </Text>
                  )}
                </Box>

                <Box>
                  <Text
                    fontSize="10px"
                    fontWeight="500"
                    color="fg.subtle"
                    textTransform="uppercase"
                    mb={1}
                  >
                    Date
                  </Text>
                  <Controller
                    name="occurredOn"
                    control={control}
                    render={({ field }) => (
                      <DateField
                        value={field.value}
                        onChange={field.onChange}
                        ariaLabel="Date the milestone occurred"
                      />
                    )}
                  />
                  {errors.occurredOn && (
                    <Text fontSize="10px" color="fg.error" mt={1}>
                      {errors.occurredOn.message}
                    </Text>
                  )}
                </Box>

                <Box>
                  <Text
                    fontSize="10px"
                    fontWeight="500"
                    color="fg.subtle"
                    textTransform="uppercase"
                    mb={1}
                  >
                    Notice number
                  </Text>
                  <Input
                    size="sm"
                    fontSize="12px"
                    placeholder="e.g. MSC2190123456"
                    aria-label="Notice number"
                    {...register("noticeNumber")}
                  />
                  <Text fontSize="10px" color="fg.subtle" mt={1}>
                    The I-797C or other notice this date was read off.
                  </Text>
                </Box>

                <Box>
                  <Text
                    fontSize="10px"
                    fontWeight="500"
                    color="fg.subtle"
                    textTransform="uppercase"
                    mb={1}
                  >
                    Note
                  </Text>
                  <Textarea
                    size="sm"
                    fontSize="12px"
                    rows={2}
                    placeholder="Optional — e.g. rescheduled from 3 March"
                    aria-label="Note"
                    {...register("note")}
                  />
                </Box>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer gap={2}>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" borderColor="border" size="sm" fontSize="12px" h="32px">
                  Cancel
                </Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette="brand"
                size="sm"
                fontSize="12px"
                h="32px"
                loading={record.isPending}
                onClick={onSubmit}
              >
                Record
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
