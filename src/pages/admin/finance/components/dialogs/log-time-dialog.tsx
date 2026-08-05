import { FormSelect } from "@/components/ui/form-select";
import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import { useCases } from "@/hooks/use-cases";
import { useLogTime } from "@/hooks/use-finance";
import { useStaffsList } from "@/hooks/use-staff-list";
import { Checkbox, Flex, Grid, Input, Text, Textarea } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { DialogShell, FormField } from "./dialog-shell";
import { fieldStyles } from "./dialog-styles";

const schema = z.object({
  staffId: z.string().optional(),
  caseId: z.string().optional(),
  entryDate: z.string().min(1, "Pick a date"),
  hoursWorked: z.coerce
    .number()
    .positive("Enter the hours worked")
    .max(24, "A single entry cannot exceed 24 hours"),
  description: z.string().max(2000).optional(),
  billable: z.boolean(),
});

type LogTimeForm = z.input<typeof schema>;

const today = () => new Date().toISOString().slice(0, 10);

export function LogTimeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
}) {
  const logTime = useLogTime();
  const cases = useCases({ limit: 100 });
  const staff = useStaffsList({ limit: 100 });

  const defaults: LogTimeForm = useMemo(
    () => ({
      staffId: "",
      caseId: "",
      entryDate: today(),
      hoursWorked: 1,
      description: "",
      billable: true,
    }),
    [],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LogTimeForm>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open) reset(defaults);
  }, [open, defaults, reset]);

  const staffOptions = useMemo(
    () => [
      { value: "", label: "Myself" },
      ...(staff.data?.data ?? []).map((member) => ({
        value: member.id,
        label: `${member.firstName} ${member.lastName}`.trim(),
      })),
    ],
    [staff.data],
  );

  const caseOptions = useMemo(
    () => [
      { value: "", label: "No matter" },
      ...(cases.data?.data ?? []).map((c) => ({
        value: c.id,
        label: `${c.caseNumber} — ${c.client?.name ?? ""}`.trim(),
      })),
    ],
    [cases.data],
  );

  const onSubmit = useCallback(
    (values: LogTimeForm) => {
      logTime.mutate(
        {
          staffId: values.staffId || undefined,
          caseId: values.caseId || undefined,
          entryDate: values.entryDate,
          hoursWorked: Number(values.hoursWorked),
          description: values.description?.trim() || undefined,
          billable: Boolean(values.billable),
        },
        { onSuccess: () => onOpenChange({ open: false }) },
      );
    },
    [logTime, onOpenChange],
  );

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Log time"
      subtitle="Entries are priced at the rate effective on the entry's date"
      footer={
        <Flex justify="flex-end" gap="8px" w="100%">
          <OutlineButton onClick={() => onOpenChange({ open: false })}>
            Cancel
          </OutlineButton>
          <BrandButton
            loading={logTime.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            Log time
          </BrandButton>
        </Flex>
      }
    >
      <Flex direction="column" gap="14px">
        <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap="12px">
          <FormField
            label="Staff member"
            hint="Logging for someone else needs approval rights"
          >
            <Controller
              control={control}
              name="staffId"
              render={({ field }) => (
                <FormSelect
                  options={staffOptions}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Myself"
                />
              )}
            />
          </FormField>

          <FormField label="Matter">
            <Controller
              control={control}
              name="caseId"
              render={({ field }) => (
                <FormSelect
                  options={caseOptions}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Select matter"
                />
              )}
            />
          </FormField>

          <FormField label="Date" error={errors.entryDate?.message}>
            <Input type="date" {...register("entryDate")} {...fieldStyles} />
          </FormField>

          <FormField label="Hours" error={errors.hoursWorked?.message}>
            <Input
              type="number"
              step="0.25"
              {...register("hoursWorked")}
              {...fieldStyles}
            />
          </FormField>
        </Grid>

        <FormField label="Description">
          <Textarea
            {...register("description")}
            rows={3}
            {...fieldStyles}
            h="auto"
            py="8px"
          />
        </FormField>

        <Controller
          control={control}
          name="billable"
          render={({ field }) => (
            <Checkbox.Root
              checked={Boolean(field.value)}
              onCheckedChange={(d) => field.onChange(Boolean(d.checked))}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label fontSize="12px">
                Billable
                <Text as="span" color="fg.muted" ml="6px">
                  non-billable time still counts toward hours logged
                </Text>
              </Checkbox.Label>
            </Checkbox.Root>
          )}
        />
      </Flex>
    </DialogShell>
  );
}
