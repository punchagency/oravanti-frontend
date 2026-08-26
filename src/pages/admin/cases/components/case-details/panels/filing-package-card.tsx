import { Badge, Box, Button, Grid, HStack, Input, Progress, Text, VStack } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { CaseForm, CaseFormPatch, CaseFormStatus } from "@/api/case-details";
import { DateField } from "@/components/ui/date-field";
import { FormSelect } from "@/components/ui/form-select";
import {
  useCaseForms,
  useInitializeCaseForms,
  useUpdateCaseForm,
} from "@/hooks/use-case-details";
import { PanelField } from "./panel-shell";

/**
 * The matter's filing package, one row per form.
 *
 * A concurrent adjustment filing is four core forms plus two supporting
 * documents, and until this existed the case carried a single `filingType` and
 * a receipt-number map — so the board could say the package was filed but not
 * whether the I-765 was. That is the form where it matters most: it is
 * routinely approved months before the I-485 it rides with.
 *
 * Replaces the old receipt-number block outright rather than sitting beside it.
 * Two homes for a receipt number is exactly the ambiguity this removes.
 *
 * ─── One form per row, one Save per form ────────────────────────────────────
 *
 * Each row is its own `react-hook-form`, uncontrolled, saved by its own button.
 * Fields used to write on blur, which meant tabbing across a row fired four
 * requests and four cache invalidations — every other row re-rendered mid-edit.
 * Batching also lets the row be read as a unit: recording a filing date, its
 * receipt number and its fee is one act, and it lands as one audit entry rather
 * than three.
 *
 * Only dirty fields are sent. That matters for more than payload size — the
 * server promotes a form to `receipted` when a receipt number arrives *without*
 * an accompanying status, so posting an unchanged status alongside would
 * quietly suppress the rule.
 */

const STATUS_OPTIONS: { value: CaseFormStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_preparation", label: "In preparation" },
  { value: "ready_to_file", label: "Ready to file" },
  { value: "filed", label: "Filed" },
  { value: "receipted", label: "Receipted" },
  { value: "rfe", label: "RFE" },
  { value: "approved", label: "Approved" },
  { value: "denied", label: "Denied" },
  { value: "withdrawn", label: "Withdrawn" },
];

/**
 * Colour carries the same three meanings everywhere: green is done, red needs
 * attention, orange is waiting on the government, grey is still with the firm.
 */
const STATUS_PALETTE: Record<CaseFormStatus, string> = {
  not_started: "gray",
  in_preparation: "gray",
  ready_to_file: "blue",
  filed: "orange",
  receipted: "orange",
  rfe: "red",
  approved: "green",
  denied: "red",
  withdrawn: "gray",
};

const STATUS_LABEL = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label]),
) as Record<CaseFormStatus, string>;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const money = (cents: number | null) =>
  cents === null ? "" : String(Math.round(cents / 100));

export function FilingPackageCard({ caseId }: { caseId: string }) {
  const { data, isLoading } = useCaseForms(caseId);
  const initialize = useInitializeCaseForms(caseId);

  if (isLoading) return null;

  const forms = data?.forms ?? [];
  const progress = data?.progress;

  // Nothing set up yet. Offered rather than created automatically: which forms
  // a matter files is a decision, and pre-creating six rows on every case would
  // put an I-864 on matters that have no sponsor.
  if (forms.length === 0) {
    return (
      <Box mt={4}>
        <Header />
        <Text fontSize="11px" color="fg.subtle" mb={2}>
          No forms tracked yet. Setting up the package adds the four core forms and the
          two supporting documents, each with its own status, receipt number and fee.
        </Text>
        <Button
          size="xs"
          h="26px"
          fontSize="11px"
          colorPalette="brand"
          loading={initialize.isPending}
          onClick={() => initialize.mutate(undefined)}
        >
          Set up the filing package
        </Button>
      </Box>
    );
  }

  return (
    <Box mt={4}>
      <Header />

      {progress && progress.total > 0 && (
        <Box mb={3}>
          <HStack justify="space-between" mb={1}>
            <Text fontSize="11px" color="fg.subtle">
              {progress.approved} of {progress.total} approved
              {progress.filed > progress.approved &&
                ` · ${progress.filed - progress.approved} awaiting a decision`}
            </Text>
            <Text fontSize="11px" color="fg.subtle" fontWeight="600">
              {progress.percentage}%
            </Text>
          </HStack>
          <Progress.Root value={progress.percentage} size="xs" colorPalette="brand">
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
          {progress.outstanding.length > 0 && (
            <Text fontSize="10px" color="fg.subtle" mt={1}>
              Still to file: {progress.outstanding.join(", ")}
            </Text>
          )}
        </Box>
      )}

      <VStack align="stretch" gap={2}>
        {forms.map((form) => (
          <FormRow key={form.id} caseId={caseId} form={form} />
        ))}
      </VStack>
    </Box>
  );
}

function Header() {
  return (
    <Text
      color="fg.subtle"
      fontSize="11px"
      fontWeight="500"
      letterSpacing="0.55px"
      textTransform="uppercase"
      mb={2}
    >
      Filing package
    </Text>
  );
}

const rowSchema = z.object({
  status: z.string().min(1),
  filedDate: z.union([isoDate, z.literal("")]),
  editionDate: z.union([isoDate, z.literal("")]),
  receiptNumber: z.string().trim().max(40),
  /** Whole dollars, as typed. Converted to cents on save — money is never a float. */
  feeDollars: z.union([z.string().regex(/^\d{1,9}$/, "Whole dollars only"), z.literal("")]),
});

type RowValues = z.infer<typeof rowSchema>;

const rowValues = (form: CaseForm): RowValues => ({
  status: form.status,
  filedDate: form.filedDate ?? "",
  editionDate: form.editionDate ?? "",
  receiptNumber: form.receiptNumber ?? "",
  feeDollars: money(form.feeCents),
});

function FormRow({ caseId, form }: { caseId: string; form: CaseForm }) {
  const update = useUpdateCaseForm(caseId);

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors, dirtyFields, isDirty },
  } = useForm<RowValues>({
    resolver: zodResolver(rowSchema),
    defaultValues: rowValues(form),
    mode: "onTouched",
  });

  // The server rewrites the row it returns — a receipt number promotes the
  // status — so the form is re-seeded from what came back rather than from what
  // was typed, and the fields stop reading dirty.
  useEffect(() => {
    reset(rowValues(form));
  }, [form, reset]);

  const onSubmit = handleSubmit((values) => {
    const patch: CaseFormPatch = {};
    if (dirtyFields.status) patch.status = values.status as CaseFormStatus;
    if (dirtyFields.filedDate) patch.filedDate = values.filedDate || null;
    if (dirtyFields.editionDate) patch.editionDate = values.editionDate || null;
    if (dirtyFields.receiptNumber) patch.receiptNumber = values.receiptNumber.trim() || null;
    if (dirtyFields.feeDollars) {
      patch.feeCents = values.feeDollars ? Number(values.feeDollars) * 100 : null;
    }

    if (Object.keys(patch).length === 0) return;
    update.mutate({ formCode: form.formCode, patch });
  });

  const supporting = form.role === "supporting";

  return (
    <Box border="1px solid" borderColor="border.muted" borderRadius="6px" px={2.5} py={2}>
      <HStack justify="space-between" mb={2}>
        <HStack gap={2}>
          <Text fontSize="12px" fontWeight="600" color="fg">
            {form.formCode}
          </Text>
          {supporting && (
            <Badge size="xs" variant="outline" colorPalette="gray" fontSize="9px">
              supporting
            </Badge>
          )}
        </HStack>
        <Badge size="xs" colorPalette={STATUS_PALETTE[form.status]} fontSize="9px">
          {STATUS_LABEL[form.status]}
        </Badge>
      </HStack>

      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={2}>
        <PanelField label="Status">
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <FormSelect
                options={STATUS_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                ariaLabel={`${form.formCode} status`}
              />
            )}
          />
        </PanelField>

        <PanelField label="Filed">
          <Controller
            name="filedDate"
            control={control}
            render={({ field }) => (
              <DateField
                value={field.value}
                onChange={field.onChange}
                ariaLabel={`${form.formCode} filed date`}
              />
            )}
          />
        </PanelField>

        {/*
          A supporting document gets no receipt-number field at all rather than a
          disabled one: USCIS issues an I-797C per core form and none for the
          I-864 or I-693, so an empty box would read as missing data.
        */}
        {!supporting && (
          <PanelField
            label="Receipt number"
            hint="Recording one marks the form receipted."
            error={errors.receiptNumber?.message}
          >
            <Input
              size="sm"
              fontSize="12px"
              placeholder="e.g. MSC2190123456"
              aria-label={`${form.formCode} receipt number`}
              {...register("receiptNumber")}
            />
          </PanelField>
        )}

        <PanelField label="Edition" hint="The date printed at the foot of the form.">
          <Controller
            name="editionDate"
            control={control}
            render={({ field }) => (
              <DateField
                value={field.value}
                onChange={field.onChange}
                ariaLabel={`${form.formCode} edition date`}
              />
            )}
          />
        </PanelField>

        <PanelField
          label="Fee paid"
          hint="Whole dollars, as actually paid."
          error={errors.feeDollars?.message}
        >
          <Input
            size="sm"
            fontSize="12px"
            inputMode="numeric"
            placeholder="e.g. 1440"
            aria-label={`${form.formCode} fee paid`}
            {...register("feeDollars")}
          />
        </PanelField>
      </Grid>

      <HStack justify="flex-end" mt={2}>
        <Button
          size="xs"
          h="26px"
          fontSize="11px"
          colorPalette="brand"
          disabled={!isDirty}
          loading={update.isPending}
          onClick={onSubmit}
        >
          Save {form.formCode}
        </Button>
      </HStack>
    </Box>
  );
}
