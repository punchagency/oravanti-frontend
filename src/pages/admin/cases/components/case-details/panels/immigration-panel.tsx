import { Checkbox, Input } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import type {
  FilingTrack,
  NaturalizationTrack,
  PetitionerStatus,
  RelationshipCategory,
} from "@/api/case-details";
import { DateField } from "@/components/ui/date-field";
import { FormSelect } from "@/components/ui/form-select";
import {
  useImmigrationDetails,
  useSaveImmigrationDetails,
} from "@/hooks/use-case-details";
import { DetailsPanel, PanelField } from "./panel-shell";
import { MandamusCandidacyCard } from "./mandamus-candidacy-card";
import { CaseChecksCard } from "./case-checks-card";
import { FilingFeesCard } from "./filing-fees-card";
import { MilestoneTimeline } from "./milestone-timeline";
import { FilingPackageCard } from "./filing-package-card";
import { useWorkflowTemplate } from "@/hooks/use-workflows";
import { visibilityFor } from "./case-type-fields";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const optionalDate = z.union([isoDate, z.literal("")]);

/** Whole dollars, as typed. Converted to cents on save — money is never a float. */
const optionalMoney = z.union([z.string().regex(/^\d{1,9}$/, "Whole dollars only"), z.literal("")]);
const optionalCount = z.union([z.string().regex(/^\d{1,2}$/, "A number"), z.literal("")]);

const schema = z.object({
  // § 1.1 eligibility. The two inputs, then the derived track and its latch.
  petitionerStatus: z.string(),
  relationshipCategory: z.string(),
  filingTrack: z.string(),
  filingTrackIsManual: z.boolean(),
  countryOfChargeability: z.string(),

  naturalizationTrack: z.string(),
  lprDate: optionalDate,
  eligibilityDate: optionalDate,
  priorityDate: optionalDate,
  priorityDateIsCurrent: z.boolean(),
  priorityDateIsManual: z.boolean(),
  isConditionalResidence: z.boolean(),
  rfeIssuedDate: optionalDate,
  rfeDeadline: optionalDate,

  // § 1.5 pitfall inputs. Each feeds a named check on the Checks card.
  beneficiaryStatusExpirationDate: optionalDate,
  employmentStartDate: optionalDate,
  hasWorkAuthorization: z.boolean(),
  sponsorIncomeDollars: optionalMoney,
  sponsorHouseholdSize: optionalCount,
  // Two letters, because the poverty-guideline table is keyed by the code. A
  // one-letter entry is caught here rather than coming back as a 400.
  sponsorState: z.union([z.string().regex(/^[A-Za-z]{2}$/, "Two-letter code"), z.literal("")]),
  sponsorIsActiveDutyMilitary: z.boolean(),
  i693SignedDate: optionalDate,
});

type FormValues = z.infer<typeof schema>;

const FILING_TRACKS = [
  { label: "Not set", value: "" },
  { label: "Concurrent", value: "concurrent" },
  { label: "Sequential", value: "sequential" },
];

const NATURALIZATION_TRACKS = [
  { label: "Not set", value: "" },
  { label: "General (5 years)", value: "general" },
  { label: "Marriage to USC (3 years)", value: "marriage_to_usc" },
  { label: "Military", value: "military" },
];

const PETITIONER_STATUSES = [
  { label: "Not set", value: "" },
  { label: "U.S. citizen", value: "usc" },
  { label: "Lawful permanent resident", value: "lpr" },
];

const RELATIONSHIP_CATEGORIES = [
  { label: "Not set", value: "" },
  { label: "Spouse", value: "spouse" },
  { label: "Parent", value: "parent" },
  { label: "Child under 21", value: "child_under_21" },
  { label: "Unmarried son/daughter 21+", value: "unmarried_child_over_21" },
  { label: "Married son/daughter", value: "married_child" },
  { label: "Sibling", value: "sibling" },
];

/**
 * The four countries with their own Visa Bulletin columns, plus the fallback.
 *
 * Not a full country list on purpose: this field exists solely to pick a
 * bulletin column, and every other country reads the worldwide one. Offering
 * 195 options would imply a precision the bulletin does not have.
 */
const CHARGEABILITY_AREAS = [
  { label: "Not set", value: "" },
  { label: "Worldwide (all other countries)", value: "worldwide" },
  { label: "China (mainland born)", value: "CN" },
  { label: "India", value: "IN" },
  { label: "Mexico", value: "MX" },
  { label: "Philippines", value: "PH" },
];

const EMPTY: FormValues = {
  petitionerStatus: "",
  relationshipCategory: "",
  filingTrack: "",
  filingTrackIsManual: false,
  countryOfChargeability: "",
  naturalizationTrack: "",
  lprDate: "",
  eligibilityDate: "",
  priorityDate: "",
  priorityDateIsCurrent: false,
  priorityDateIsManual: false,
  isConditionalResidence: false,
  rfeIssuedDate: "",
  rfeDeadline: "",
  beneficiaryStatusExpirationDate: "",
  employmentStartDate: "",
  hasWorkAuthorization: false,
  sponsorIncomeDollars: "",
  sponsorHouseholdSize: "",
  sponsorState: "",
  sponsorIsActiveDutyMilitary: false,
  i693SignedDate: "",
};

/** The label for a derived preference category, for the read-only hint. */
const PREFERENCE_LABEL: Record<string, string> = {
  ir: "IR — immediate relative",
  f1: "F1 — unmarried son/daughter of a USC",
  f2a: "F2A — spouse or minor child of an LPR",
  f2b: "F2B — unmarried son/daughter of an LPR",
  f3: "F3 — married son/daughter of a USC",
  f4: "F4 — sibling of a USC",
};

const orNull = (value: string) => value || null;

/**
 * The immigration fields *this case type's* workflow reads, plus the read-only
 * cards below it.
 *
 * ─── Which fields appear ────────────────────────────────────────────────────
 *
 * Not all of them, and which ones is not this component's decision. An N-400
 * and an I-485 are both Immigration and read the same extension table, but
 * share almost no facts: a naturalization matter has no petitioner, no
 * preference category, no priority date and no I-864 sponsor, and an adjustment
 * matter has no naturalization track. Rendering the union of both put fields on
 * matters they mean nothing on, and put the pre-filing checks and an
 * I-130/I-485 fee quote on case types that never file either form.
 *
 * So the panel asks `case-type-fields.ts` what this case's own workflow
 * template actually consults, and renders those groups. See that file for why
 * the template is the source of truth rather than a case-type list. A case type
 * with no template yet shows the RFE pair — true of any USCIS filing — and
 * nothing more.
 *
 * Which forms the matter files is not asked here at all. That is a package, not
 * a field, and it lives on the filing package card below.
 *
 * Hiding a group never clears what is stored behind it.
 *
 * ─── What the fields do ─────────────────────────────────────────────────────
 *
 * Several here do more than store a value, and each says so in its hint:
 *
 *   • **Petitioner + relationship** — the two § 1.1 facts. Together they compute
 *     the filing track and the preference category, which is why the track
 *     itself is disabled until someone deliberately takes it over.
 *   • **Filing track** — `concurrent` opens the I-485 package immediately; a
 *     sequential matter waits for its priority date.
 *   • **Priority date current** — the other half of that gate, and the field the
 *     monthly Visa Bulletin job writes unless its override is set.
 *   • **Conditional residence** — a two-year card activates the I-751 module.
 *   • **The RFE pair** — logging both dates schedules the response reminders at
 *     50/75/90% of whatever window the notice itself states. This is the one
 *     deadline the template can't know in advance, which is why it is captured
 *     here rather than being a template step.
 *
 * The § 1.5 inputs at the bottom feed the Checks card and nothing else. Each is
 * read by exactly one named rule; a field no rule reads does not belong here.
 *
 * ─── The two override latches ───────────────────────────────────────────────
 *
 * `filingTrackIsManual` and `priorityDateIsManual` use the same shape: the
 * computer writes the value only while the latch is off, and the UI shows which
 * of the two is currently in charge. Clearing a latch hands the field back and
 * it recomputes on the next save. That is what makes exposing an override safe
 * — the engine still reads a single field, and "who decided this" stays
 * answerable.
 */
export function ImmigrationPanel({
  caseId,
  caseTypeId,
}: {
  caseId: string;
  caseTypeId: string | null | undefined;
}) {
  const { data: details, isLoading } = useImmigrationDetails(caseId);
  const save = useSaveImmigrationDetails(caseId);

  // What this case type's workflow actually reads decides what is on the panel.
  // A case type with no template resolves to `untemplated` — the query 404s
  // rather than failing, which is why it is not retried.
  const { data: template, isLoading: templateLoading } = useWorkflowTemplate(caseTypeId);
  const show = visibilityFor(template);

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

  useEffect(() => {
    if (!details) return;
    reset({
      petitionerStatus: details.petitionerStatus ?? "",
      relationshipCategory: details.relationshipCategory ?? "",
      filingTrack: details.filingTrack ?? "",
      filingTrackIsManual: details.filingTrackIsManual,
      countryOfChargeability: details.countryOfChargeability ?? "",
      naturalizationTrack: details.naturalizationTrack ?? "",
      lprDate: details.lprDate ?? "",
      eligibilityDate: details.eligibilityDate ?? "",
      priorityDate: details.priorityDate ?? "",
      priorityDateIsCurrent: details.priorityDateIsCurrent,
      priorityDateIsManual: details.priorityDateIsManual,
      isConditionalResidence: details.isConditionalResidence,
      rfeIssuedDate: details.rfeIssuedDate ?? "",
      rfeDeadline: details.rfeDeadline ?? "",
      beneficiaryStatusExpirationDate: details.beneficiaryStatusExpirationDate ?? "",
      employmentStartDate: details.employmentStartDate ?? "",
      hasWorkAuthorization: details.hasWorkAuthorization,
      // Cents on the wire, dollars in the field.
      sponsorIncomeDollars:
        details.sponsorIncomeCents === null ? "" : String(Math.round(details.sponsorIncomeCents / 100)),
      sponsorHouseholdSize:
        details.sponsorHouseholdSize === null ? "" : String(details.sponsorHouseholdSize),
      sponsorState: details.sponsorState ?? "",
      sponsorIsActiveDutyMilitary: details.sponsorIsActiveDutyMilitary,
      i693SignedDate: details.i693SignedDate ?? "",
    });
  }, [details, reset]);

  // `useWatch` rather than `watch()` — the latter returns a fresh function each
  // render, which opts the whole component out of React Compiler memoization.
  const rfeIssued = useWatch({ control, name: "rfeIssuedDate" });
  const filingTrackIsManual = useWatch({ control, name: "filingTrackIsManual" });

  // Read off the saved row rather than recomputed here: the derivation is the
  // backend's, and a second copy of the § 1.1 table in this file is exactly the
  // kind of duplication that goes quietly out of step with the first.
  const derivedCategory = details?.preferenceCategory
    ? (PREFERENCE_LABEL[details.preferenceCategory] ?? details.preferenceCategory)
    : null;

  const onSubmit = handleSubmit((values) =>
    save.mutate(
      {
        petitionerStatus: (orNull(values.petitionerStatus) as PetitionerStatus | null) ?? null,
        relationshipCategory:
          (orNull(values.relationshipCategory) as RelationshipCategory | null) ?? null,
        filingTrack: (orNull(values.filingTrack) as FilingTrack | null) ?? null,
        filingTrackIsManual: values.filingTrackIsManual,
        countryOfChargeability: orNull(values.countryOfChargeability),
        naturalizationTrack:
          (orNull(values.naturalizationTrack) as NaturalizationTrack | null) ?? null,
        lprDate: orNull(values.lprDate),
        eligibilityDate: orNull(values.eligibilityDate),
        priorityDate: orNull(values.priorityDate),
        priorityDateIsCurrent: values.priorityDateIsCurrent,
        priorityDateIsManual: values.priorityDateIsManual,
        isConditionalResidence: values.isConditionalResidence,
        rfeIssuedDate: orNull(values.rfeIssuedDate),
        rfeDeadline: orNull(values.rfeDeadline),
        beneficiaryStatusExpirationDate: orNull(values.beneficiaryStatusExpirationDate),
        employmentStartDate: orNull(values.employmentStartDate),
        hasWorkAuthorization: values.hasWorkAuthorization,
        sponsorIncomeCents: values.sponsorIncomeDollars
          ? Number(values.sponsorIncomeDollars) * 100
          : null,
        sponsorHouseholdSize: values.sponsorHouseholdSize
          ? Number(values.sponsorHouseholdSize)
          : null,
        sponsorState: orNull(values.sponsorState.trim().toUpperCase()),
        sponsorIsActiveDutyMilitary: values.sponsorIsActiveDutyMilitary,
        i693SignedDate: orNull(values.i693SignedDate),
      },
      { onSuccess: () => reset(values) },
    ),
  );

  return (
    <>
      <DetailsPanel
        title="Immigration details"
        description={
          show.untemplated
            ? "This case type has no workflow yet, so only the facts common to any USCIS filing are shown."
            : "The facts this case type's workflow branches on and computes deadlines from."
        }
        onSubmit={onSubmit}
        isDirty={isDirty}
        isSaving={save.isPending}
        isLoading={isLoading || templateLoading}
      >
        {/*
          No filing-type field. A matter files a package, not a form, and
          asking for one answer to that question produced a wrong one — see
          the filing package card below, which holds every form the matter
          files with its own status, edition, fee and receipt number.
        */}
        {show.adjustment && (
          <AdjustmentFields
            control={control}
            derivedCategory={derivedCategory}
            filingTrackIsManual={filingTrackIsManual}
          />
        )}

        {show.naturalization && <NaturalizationFields control={control} />}

        {/* An RFE can land on any filing, so these are never gated. */}
        <RfeFields control={control} rfeIssued={rfeIssued} />

        {show.adjustment && <PreFilingCheckFields control={control} errors={errors} />}

        {show.conditionalResidence && <ConditionalResidenceField control={control} />}
      </DetailsPanel>

      {/*
        Checks first: one of them can stop a filing, and it should be read before
        anything below it. Each renders nothing when it has nothing to say, so a
        case with no data shows the panel alone.

        The checks and the fee quote are both about the I-485 package
        specifically — the rules are the AOS pre-filing rules and the quote is
        for I-130/I-485/I-765/I-131 — so neither belongs on a matter whose
        workflow never assembles that package.
      */}
      {show.adjustment && <CaseChecksCard caseId={caseId} />}
      {show.milestones && <MilestoneTimeline caseId={caseId} />}
      {show.adjustment && <FilingFeesCard caseId={caseId} />}
      {/*
        The package, one row per form. Replaces the receipt-number map: a
        receipt number is one fact about a form, not the only one worth
        tracking, and it had no business living somewhere different from the
        form's status, edition and fee.
      */}
      <FilingPackageCard caseId={caseId} />
      {/*
        Mandamus candidacy is about a USCIS filing that has stalled, so it
        belongs on a delayed I-485 or N-400 — but never on a mandamus matter
        itself, which is already the remedy. Beyond that it self-gates: it
        renders only once there is a median to compare against.
      */}
      {!show.mandamus && <MandamusCandidacyCard caseId={caseId} />}
    </>
  );
}


/* ─── Field groups ──────────────────────────────────────────────────────────
 *
 * Each group is the set of facts one kind of workflow reads, and each renders a
 * bare fragment so its fields stay direct children of the panel's grid.
 *
 * Split out so `ImmigrationPanel` reads as the list of decisions it now makes —
 * which groups this case type's workflow calls for — rather than as four
 * hundred lines of fields with conditionals threaded through them.
 */

/**
 * Eligibility, chargeability and the priority date.
 *
 * All adjustment vocabulary. The petitioner and relationship compute the track
 * and preference category; the priority date and its "current" flag are the
 * other half of the gate that opens the I-485 package on a sequential matter.
 */
function AdjustmentFields({
  control,
  derivedCategory,
  filingTrackIsManual,
}: {
  control: Control<FormValues>;
  derivedCategory: string | null;
  filingTrackIsManual: boolean;
}) {
  return (
    <>
      <PanelField
        label="Petitioner"
        hint="With the relationship below, decides the filing track and preference category."
      >
        <Controller
          name="petitionerStatus"
          control={control}
          render={({ field }) => (
            <FormSelect
              options={PETITIONER_STATUSES}
              value={field.value}
              onChange={field.onChange}
              ariaLabel="Petitioner status"
            />
          )}
        />
      </PanelField>

      <PanelField
        label="Relationship to beneficiary"
        hint={
          derivedCategory
            ? `Category: ${derivedCategory}`
            : "An LPR cannot petition a parent, a sibling, or a married son or daughter."
        }
      >
        <Controller
          name="relationshipCategory"
          control={control}
          render={({ field }) => (
            <FormSelect
              options={RELATIONSHIP_CATEGORIES}
              value={field.value}
              onChange={field.onChange}
              ariaLabel="Relationship category"
            />
          )}
        />
      </PanelField>

      <PanelField
        label="Filing track"
        hint={
          filingTrackIsManual
            ? "Set by hand. Untick below to compute it from the petitioner and relationship again."
            : "Computed from the petitioner and relationship. Concurrent opens the I-485 package immediately."
        }
      >
        <Controller
          name="filingTrack"
          control={control}
          render={({ field }) => (
            <FormSelect
              options={FILING_TRACKS}
              value={field.value}
              onChange={field.onChange}
              ariaLabel="Filing track"
              disabled={!filingTrackIsManual}
            />
          )}
        />
      </PanelField>

      <PanelField
        label="Override the filing track"
        span
        hint="Untick to hand the field back to the computer, which recomputes it from the two facts above."
      >
        <Controller
          name="filingTrackIsManual"
          control={control}
          render={({ field }) => (
            <Checkbox.Root
              checked={field.value}
              onCheckedChange={(details) => field.onChange(Boolean(details.checked))}
              size="sm"
            >
              <Checkbox.HiddenInput aria-label="Override the filing track" />
              <Checkbox.Control />
              <Checkbox.Label fontSize="12px">Set the filing track by hand</Checkbox.Label>
            </Checkbox.Root>
          )}
        />
      </PanelField>

      <PanelField
        label="Chargeability"
        hint="China, India, Mexico and the Philippines have their own Visa Bulletin columns and can run years behind worldwide."
      >
        <Controller
          name="countryOfChargeability"
          control={control}
          render={({ field }) => (
            <FormSelect
              options={CHARGEABILITY_AREAS}
              value={field.value}
              onChange={field.onChange}
              ariaLabel="Country of chargeability"
            />
          )}
        />
      </PanelField>

      <PanelField label="Priority date">
        <Controller
          name="priorityDate"
          control={control}
          render={({ field }) => (
            <DateField value={field.value} onChange={field.onChange} ariaLabel="Priority date" />
          )}
        />
      </PanelField>

      <PanelField
        label="Priority date current"
        span
        hint="A sequential filing cannot lodge the I-485 until a visa number is available. Ticking this opens the I-485 / I-765 / I-131 / I-864 / I-693 package. A concurrent filing never waits on it."
      >
        <Controller
          name="priorityDateIsCurrent"
          control={control}
          render={({ field }) => (
            <Checkbox.Root
              checked={field.value}
              onCheckedChange={(details) => field.onChange(Boolean(details.checked))}
              size="sm"
            >
              <Checkbox.HiddenInput aria-label="Priority date current" />
              <Checkbox.Control />
              <Checkbox.Label fontSize="12px">
                A visa number is available — the I-485 can be filed
              </Checkbox.Label>
            </Checkbox.Root>
          )}
        />
      </PanelField>

      <PanelField
        label="Override the priority date check"
        span
        hint="While ticked, the monthly Visa Bulletin job leaves this matter alone. Untick to hand it back."
      >
        <Controller
          name="priorityDateIsManual"
          control={control}
          render={({ field }) => (
            <Checkbox.Root
              checked={field.value}
              onCheckedChange={(details) => field.onChange(Boolean(details.checked))}
              size="sm"
            >
              <Checkbox.HiddenInput aria-label="Override the priority date check" />
              <Checkbox.Control />
              <Checkbox.Label fontSize="12px">Set it by hand</Checkbox.Label>
            </Checkbox.Root>
          )}
        />
      </PanelField>
    </>
  );
}

/**
 * The naturalization track and the two dates it counts from.
 *
 * Nothing here has any meaning on an adjustment matter, which is the half of
 * the mixing this split exists to stop.
 */
function NaturalizationFields({ control }: { control: Control<FormValues> }) {
  return (
    <>
      <PanelField label="Naturalization track">
        <Controller
          name="naturalizationTrack"
          control={control}
          render={({ field }) => (
            <FormSelect
              options={NATURALIZATION_TRACKS}
              value={field.value}
              onChange={field.onChange}
              ariaLabel="Naturalization track"
            />
          )}
        />
      </PanelField>

      <PanelField label="LPR date">
        <Controller
          name="lprDate"
          control={control}
          render={({ field }) => (
            <DateField value={field.value} onChange={field.onChange} ariaLabel="LPR date" />
          )}
        />
      </PanelField>

      <PanelField
        label="Eligibility date"
        hint="The earliest the N-400 may be filed — 90 days before it, under the early-filing rule."
      >
        <Controller
          name="eligibilityDate"
          control={control}
          render={({ field }) => (
            <DateField
              value={field.value}
              onChange={field.onChange}
              ariaLabel="Eligibility date"
            />
          )}
        />
      </PanelField>
    </>
  );
}

/**
 * The RFE pair, shown on every immigration matter.
 *
 * USCIS can issue a request for evidence against any filing, and logging both
 * dates is what schedules the response reminders across the window the notice
 * itself states. There is no case type this does not apply to.
 */
function RfeFields({
  control,
  rfeIssued,
}: {
  control: Control<FormValues>;
  rfeIssued: string;
}) {
  return (
    <>
      <PanelField label="RFE issued">
        <Controller
          name="rfeIssuedDate"
          control={control}
          render={({ field }) => (
            <DateField value={field.value} onChange={field.onChange} ariaLabel="RFE issued date" />
          )}
        />
      </PanelField>

      <PanelField
        label="RFE deadline"
        hint="With both dates set, response reminders are scheduled across the window the notice states."
      >
        <Controller
          name="rfeDeadline"
          control={control}
          render={({ field }) => (
            <DateField
              value={field.value}
              onChange={field.onChange}
              // The backend refuses a deadline on or before the issue date;
              // the picker declines to offer one.
              min={rfeIssued || undefined}
              ariaLabel="RFE deadline"
            />
          )}
        />
      </PanelField>

    </>
  );
}

/**
 * The § 1.5 inputs, each read by exactly one named pre-filing check.
 *
 * They belong with the adjustment package rather than with immigration
 * generally: the sponsor figures are the I-864 affidavit, the signature date is
 * the I-693 medical, and both are filed with the I-485. A workflow that never
 * assembles that package has no rule that reads any of them.
 */
function PreFilingCheckFields({
  control,
  errors,
}: {
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
}) {
  return (
    <>
      <PanelField
        label="Status expires"
        hint="On a sequential matter, a status that lapses before filing raises a check."
      >
        <Controller
          name="beneficiaryStatusExpirationDate"
          control={control}
          render={({ field }) => (
            <DateField
              value={field.value}
              onChange={field.onChange}
              ariaLabel="Beneficiary status expiration date"
            />
          )}
        />
      </PanelField>

      <PanelField
        label="Employment started"
        hint="Filing the I-765 does not authorise work. Raises a check unless an EAD covers this date."
      >
        <Controller
          name="employmentStartDate"
          control={control}
          render={({ field }) => (
            <DateField
              value={field.value}
              onChange={field.onChange}
              ariaLabel="Employment start date"
            />
          )}
        />
      </PanelField>

      <PanelField label="Work authorisation" span>
        <Controller
          name="hasWorkAuthorization"
          control={control}
          render={({ field }) => (
            <Checkbox.Root
              checked={field.value}
              onCheckedChange={(details) => field.onChange(Boolean(details.checked))}
              size="sm"
            >
              <Checkbox.HiddenInput aria-label="Independently work authorised" />
              <Checkbox.Control />
              <Checkbox.Label fontSize="12px">
                Independently work-authorised — H-1B, L-2, or an EAD on another basis
              </Checkbox.Label>
            </Checkbox.Root>
          )}
        />
      </PanelField>

      <PanelField
        label="Sponsor income"
        error={errors.sponsorIncomeDollars?.message}
        hint="Whole dollars. Checked against 125% of the poverty guidelines for the household size."
      >
        <Controller
          name="sponsorIncomeDollars"
          control={control}
          render={({ field }) => (
            <Input
              size="sm"
              fontSize="12px"
              inputMode="numeric"
              value={field.value}
              onChange={field.onChange}
              placeholder="e.g. 42000"
              aria-label="Sponsor annual income in dollars"
            />
          )}
        />
      </PanelField>

      <PanelField label="Household size" error={errors.sponsorHouseholdSize?.message}>
        <Controller
          name="sponsorHouseholdSize"
          control={control}
          render={({ field }) => (
            <Input
              size="sm"
              fontSize="12px"
              inputMode="numeric"
              value={field.value}
              onChange={field.onChange}
              placeholder="e.g. 3"
              aria-label="Sponsor household size"
            />
          )}
        />
      </PanelField>

      <PanelField
        label="Sponsor state"
        hint="Alaska and Hawaii have their own, higher poverty tables."
      >
        <Controller
          name="sponsorState"
          control={control}
          render={({ field }) => (
            <Input
              size="sm"
              fontSize="12px"
              maxLength={2}
              value={field.value}
              onChange={field.onChange}
              placeholder="e.g. CA"
              aria-label="Sponsor state"
            />
          )}
        />
      </PanelField>

      <PanelField
        label="I-693 signed"
        hint="The civil surgeon's signature date. Not a clock — the I-693 lasts as long as the application it was filed with."
      >
        <Controller
          name="i693SignedDate"
          control={control}
          render={({ field }) => (
            <DateField
              value={field.value}
              onChange={field.onChange}
              ariaLabel="I-693 signature date"
            />
          )}
        />
      </PanelField>

      <PanelField label="Military sponsor" span>
        <Controller
          name="sponsorIsActiveDutyMilitary"
          control={control}
          render={({ field }) => (
            <Checkbox.Root
              checked={field.value}
              onCheckedChange={(details) => field.onChange(Boolean(details.checked))}
              size="sm"
            >
              <Checkbox.HiddenInput aria-label="Active-duty military sponsor" />
              <Checkbox.Control />
              <Checkbox.Label fontSize="12px">
                Active duty, sponsoring a spouse or child — the threshold drops to 100%
              </Checkbox.Label>
            </Checkbox.Root>
          )}
        />
      </PanelField>
    </>
  );
}

/** The two-year card flag, which is what activates the I-751 module. */
function ConditionalResidenceField({ control }: { control: Control<FormValues> }) {
  return (
    <PanelField label="Conditional residence" span>
      <Controller
        name="isConditionalResidence"
        control={control}
        render={({ field }) => (
          <Checkbox.Root
            checked={field.value}
            onCheckedChange={(details) => field.onChange(Boolean(details.checked))}
            size="sm"
          >
            <Checkbox.HiddenInput aria-label="Conditional residence" />
            <Checkbox.Control />
            <Checkbox.Label fontSize="12px">
              Two-year card — adds the I-751 removal-of-conditions module
            </Checkbox.Label>
          </Checkbox.Root>
        )}
      />
    </PanelField>
  );
}
