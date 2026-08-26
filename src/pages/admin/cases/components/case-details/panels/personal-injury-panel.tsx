import { Checkbox, Textarea } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { DefendantType } from "@/api/case-details";
import { DateField } from "@/components/ui/date-field";
import { FormSelect } from "@/components/ui/form-select";
import {
  usePersonalInjuryDetails,
  useSavePersonalInjuryDetails,
} from "@/hooks/use-case-details";
import { DetailsPanel, PanelField } from "./panel-shell";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const schema = z.object({
  incidentDate: isoDate,
  defendantType: z.enum(["private", "government_entity"]),
  isMinorPlaintiff: z.boolean(),
  statuteOfLimitationsDate: z.union([isoDate, z.literal("")]),
  solTollingNotes: z.string(),
  mmiDate: z.union([isoDate, z.literal("")]),
});

type FormValues = z.infer<typeof schema>;

const DEFENDANT_TYPES = [
  { label: "Private", value: "private" },
  { label: "Government entity", value: "government_entity" },
];

const EMPTY: FormValues = {
  incidentDate: "",
  defendantType: "private",
  isMinorPlaintiff: false,
  statuteOfLimitationsDate: "",
  solTollingNotes: "",
  mmiDate: "",
};

/** `""` means "leave it blank", which the API expresses as null. */
const orNull = (value: string) => value || null;

/**
 * The personal-injury fields the workflow engine actually reads.
 *
 * Two of them are not ordinary data entry:
 *
 *   • **Defendant type** decides whether the pre-suit notice module exists.
 *     Setting it to a government entity creates those tasks; the hint says so,
 *     because a field that silently adds work to a matter should announce it.
 *   • **Incident date** and **MMI** are anchors — open tasks' deadlines are
 *     computed from them, so recording one moves dates already on screen.
 */
export function PersonalInjuryPanel({ caseId }: { caseId: string }) {
  const { data: details, isLoading } = usePersonalInjuryDetails(caseId);
  const save = useSavePersonalInjuryDetails(caseId);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
    mode: "onTouched",
  });

  // The row is fetched after first render, and a case with no row yet keeps the
  // empty defaults — the panel is how the row gets created.
  useEffect(() => {
    if (!details) return;
    reset({
      incidentDate: details.incidentDate,
      defendantType: details.defendantType,
      isMinorPlaintiff: details.isMinorPlaintiff,
      statuteOfLimitationsDate: details.statuteOfLimitationsDate ?? "",
      solTollingNotes: details.solTollingNotes ?? "",
      mmiDate: details.mmiDate ?? "",
    });
  }, [details, reset]);

  const onSubmit = handleSubmit((values) =>
    save.mutate(
      {
        incidentDate: values.incidentDate,
        defendantType: values.defendantType as DefendantType,
        isMinorPlaintiff: values.isMinorPlaintiff,
        statuteOfLimitationsDate: orNull(values.statuteOfLimitationsDate),
        solTollingNotes: orNull(values.solTollingNotes),
        mmiDate: orNull(values.mmiDate),
      },
      { onSuccess: () => reset(values) },
    ),
  );

  return (
    <DetailsPanel
      title="Personal injury details"
      description="The facts the workflow engine branches on and computes deadlines from."
      onSubmit={onSubmit}
      isDirty={isDirty}
      isSaving={save.isPending}
      isLoading={isLoading}
    >
      <PanelField
        label="Incident date"
        error={errors.incidentDate?.message}
        hint="Anchors the SOL and early investigation deadlines."
      >
        <Controller
          name="incidentDate"
          control={control}
          render={({ field }) => (
            <DateField
              value={field.value}
              onChange={field.onChange}
              ariaLabel="Incident date"
              invalid={Boolean(errors.incidentDate)}
            />
          )}
        />
      </PanelField>

      <PanelField
        label="Defendant type"
        hint="A government entity adds the pre-suit notice module to this case."
      >
        <Controller
          name="defendantType"
          control={control}
          render={({ field }) => (
            <FormSelect
              options={DEFENDANT_TYPES}
              value={field.value}
              onChange={field.onChange}
              ariaLabel="Defendant type"
            />
          )}
        />
      </PanelField>

      <PanelField label="Statute of limitations" error={errors.statuteOfLimitationsDate?.message}>
        <Controller
          name="statuteOfLimitationsDate"
          control={control}
          render={({ field }) => (
            <DateField
              value={field.value}
              onChange={field.onChange}
              ariaLabel="Statute of limitations date"
            />
          )}
        />
      </PanelField>

      <PanelField label="MMI date" hint="Maximum Medical Improvement. Anchors the demand-package deadlines.">
        <Controller
          name="mmiDate"
          control={control}
          render={({ field }) => (
            <DateField value={field.value} onChange={field.onChange} ariaLabel="MMI date" />
          )}
        />
      </PanelField>

      <PanelField label="Minor plaintiff">
        <Controller
          name="isMinorPlaintiff"
          control={control}
          render={({ field }) => (
            <Checkbox.Root
              checked={field.value}
              onCheckedChange={(details) => field.onChange(Boolean(details.checked))}
              size="sm"
            >
              <Checkbox.HiddenInput aria-label="Minor plaintiff" />
              <Checkbox.Control />
              <Checkbox.Label fontSize="12px">Plaintiff is a minor</Checkbox.Label>
            </Checkbox.Root>
          )}
        />
      </PanelField>

      <PanelField
        label="SOL tolling notes"
        span
        hint="Why the limitation period differs from the default — minority, discovery rule, agreed tolling."
      >
        <Controller
          name="solTollingNotes"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              aria-label="SOL tolling notes"
              minH="70px"
              fontSize="12px"
              resize="vertical"
              variant="outline"
              _focus={{ borderColor: "brand.solid" }}
            />
          )}
        />
      </PanelField>
    </DetailsPanel>
  );
}
