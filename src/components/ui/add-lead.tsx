import { sourceValues, type LeadSource } from "@/api/leads";
import { FormSelect } from "@/components/ui/form-select";
import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import { ControlSkeleton } from "@/components/ui/theme-skeleton";
import { useCreateLead } from "@/hooks/use-leads";
import { usePublicPracticeAreas } from "@/hooks/use-public-practice-areas";
import { useResetOnOpen } from "@/hooks/use-reset-on-open";
import { useFirmTimezone } from "@/hooks/useTimezone";
import { leadSources } from "@/pages/admin/leads/data";
import type { PublicPracticeArea } from "@/pages/contractor-sign-up/types";
import { listTimezones } from "@/utils/timezones";
import {
  Box,
  Dialog,
  Flex,
  Grid,
  Input,
  Text,
  Textarea,
  VStack,
  chakra,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, X } from "lucide-react";
import { useState, useCallback, useMemo, type ReactNode } from "react";
import type { Control } from "react-hook-form";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

function getCaseTypes(
  practiceAreaId: string,
  practiceAreas: PublicPracticeArea[] | undefined,
): { id: string; name: string }[] {
  if (!practiceAreaId || !practiceAreas) return [];
  const area = practiceAreas.find((a) => a.id === practiceAreaId);
  return area ? area.subcategories.flatMap((s) => s.caseTypes) : [];
}

const leadSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string(),
  // Required at creation. It is not decoration: a lead with no practice area
  // cannot be invoiced (both `raiseConsultationInvoice` and the fee-agreement
  // equivalent bail out and return null), is dropped from conversion metrics by
  // an inner join, and cannot be converted to a case at all.
  practiceAreaId: z.string().min(1, "Select a practice area"),
  // Required on the same terms. Without one the lead is hard-blocked at the
  // questionnaire stage, silently absent from the questionnaire send wizard,
  // shows zero eligible teams at case opening, and renders "Not specified" as
  // the matter type on a signed fee agreement.
  caseTypeId: z.string().min(1, "Select a case type"),
  source: z.string(),
  timezone: z.string(),
  situationSummary: z.string(),
  adversePartyName: z.string(),
  adversePartyEmail: z.union([
    z.literal(""),
    z.string().email("Enter a valid email address"),
  ]),
});

type LeadForm = z.infer<typeof leadSchema>;

const LEAD_DEFAULTS: LeadForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  practiceAreaId: "",
  caseTypeId: "",
  source: "Direct",
  timezone: "",
  situationSummary: "",
  adversePartyName: "",
  adversePartyEmail: "",
};

const TIMEZONE_OPTIONS = listTimezones().map((tz) => ({
  value: tz,
  label: tz,
}));

/**
 * Self-contained lead dialog. By default it opens from its children
 * (wrapped in a Chakra Trigger) and owns its open state; pass `open` +
 * `onOpenChange` to control it instead (e.g. opened from a menu item,
 * per the Chakra "dialog from menu" docs pattern).
 *
 * Either way the form — and therefore its data queries — first mounts when
 * the dialog opens (`lazyMount`), so a never-opened dialog never hits the
 * API. It then stays mounted (hidden) so reopening is instant; the form
 * resets itself on each open via `useResetOnOpen`.
 */
export function AddLeadDialog({
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
      <Dialog.Backdrop bg="rgba(0, 0, 0, 0.46)" />
      <Dialog.Positioner px="16px">
        <Dialog.Content
          w="full"
          maxW="2xl"
          border="1px solid"
          borderColor="border"
          borderRadius="14px"
          bg="bg"
          p="0"
          boxShadow="0 24px 70px rgba(0, 0, 0, 0.26)"
        >
          <chakra.button
            type="button"
            aria-label="Close add lead dialog"
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
            onClick={() => handleOpenChange(false)}
          >
            <X size={16} />
          </chakra.button>

          <AddLeadForm
            open={open}
            close={() => handleOpenChange(false)}
          />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

/** Everything the add-lead form needs lives here so nothing runs before the first open. */
function AddLeadForm({ open, close }: { open: boolean; close: () => void }) {
  const {
    data: practiceAreas,
    isLoading: practiceAreasLoading,
  } = usePublicPracticeAreas();
  const createLead = useCreateLead();
  const firmTimezone = useFirmTimezone();

  // Lead timezone is optional and defaults to the firm's zone.
  const formDefaults = useMemo(
    () => ({ ...LEAD_DEFAULTS, timezone: firmTimezone }),
    [firmTimezone],
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
    defaultValues: formDefaults,
    mode: "onTouched",
  });

  // Stays mounted between opens — restore pristine defaults on each open.
  const resetForm = useCallback(() => reset(formDefaults), [reset, formDefaults]);
  useResetOnOpen(open, resetForm);

  const onSubmit = handleSubmit((data) => {
    createLead.mutate(
      {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        phone: data.phone || undefined,
        practiceAreaId: data.practiceAreaId,
        caseTypeId: data.caseTypeId,
        source: (sourceValues[data.source] ?? "direct") as LeadSource,
        situationSummary: data.situationSummary || undefined,
        intakeAdversePartyName: data.adversePartyName.trim() || undefined,
        intakeAdversePartyEmail: data.adversePartyEmail.trim() || undefined,
        timezone: data.timezone || undefined,
      },
      // Closing resets on next open (useResetOnOpen) — no unmount needed.
      { onSuccess: close },
    );
  });

  return (
    <Box as="form" p="32px 24px 24px" onSubmit={onSubmit}>
            <Dialog.Title
              color="fg"
              fontSize="17px"
              fontWeight="600"
              lineHeight="1.2"
            >
              Add lead manually
            </Dialog.Title>
            <Dialog.Description
              mt="10px"
              color="fg.muted"
              fontSize="13px"
              lineHeight="1.35"
            >
              For walk-ins, phone enquiries, or referrals that came directly to
              the firm.
            </Dialog.Description>

            <VStack align="stretch" gap="12px" mt="18px">
              <Grid
                templateColumns={{
                  base: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                }}
                gap="10px"
              >
                <FormField label="First name" error={errors.firstName?.message}>
                  <Input
                    {...register("firstName")}
                    placeholder="e.g. Sandra"
                    {...fieldStyles}
                  />
                </FormField>
                <FormField label="Last name" error={errors.lastName?.message}>
                  <Input
                    {...register("lastName")}
                    placeholder="e.g. Osei"
                    {...fieldStyles}
                  />
                </FormField>
              </Grid>

              <FormField label="Email address" error={errors.email?.message}>
                <Input
                  type="email"
                  {...register("email")}
                  placeholder="e.g. sandra@example.com"
                  {...fieldStyles}
                />
              </FormField>

              <FormField label="Phone number">
                <Input
                  type="tel"
                  {...register("phone")}
                  placeholder="e.g. +1 (555) 012-3456"
                  {...fieldStyles}
                />
              </FormField>

              <FormField
                label="Practice area"
                error={errors.practiceAreaId?.message}
              >
                {practiceAreasLoading ? (
                  <ControlSkeleton h="36px" />
                ) : (
                  <Controller
                    control={control}
                    name="practiceAreaId"
                    render={({ field }) => (
                      <FormSelect
                        ariaLabel="Practice area"
                        placeholder="Select practice area"
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value);
                          // Clearing is load-bearing: a case type belongs to
                          // exactly one practice area, so keeping the old
                          // selection would leave a required field holding a
                          // value that is not on offer any more.
                          //
                          // `shouldValidate` because the field now has a rule —
                          // without it, wiping a valid selection leaves a stale
                          // "valid" state until blur or submit.
                          setValue("caseTypeId", "", { shouldValidate: true });
                        }}
                        options={(practiceAreas ?? []).map((area) => ({
                          value: area.id,
                          label: area.name,
                        }))}
                      />
                    )}
                  />
                )}
              </FormField>

              <CaseTypeField
                control={control}
                practiceAreas={practiceAreas}
                loading={practiceAreasLoading}
              />

              <FormField label="Source">
                <Controller
                  control={control}
                  name="source"
                  render={({ field }) => (
                    <FormSelect
                      ariaLabel="Source"
                      value={field.value}
                      onChange={field.onChange}
                      options={leadSources.map((s) => ({ value: s, label: s }))}
                    />
                  )}
                />
              </FormField>

              <FormField label="Timezone (optional — defaults to firm timezone)">
                <Controller
                  control={control}
                  name="timezone"
                  render={({ field }) => (
                    <FormSelect
                      ariaLabel="Lead timezone"
                      value={field.value}
                      onChange={field.onChange}
                      options={TIMEZONE_OPTIONS}
                    />
                  )}
                />
              </FormField>

              <FormField label="Situation summary">
                <Textarea
                  {...register("situationSummary")}
                  minH="70px"
                  resize="vertical"
                  placeholder="Brief description of client's situation..."
                  {...fieldStyles}
                />
              </FormField>

              <Box pt="4px">
                <Text
                  fontSize="11px"
                  fontWeight="600"
                  color="fg.muted"
                  mb="4px"
                >
                  Known opposing party (optional)
                </Text>
                <Text
                  fontSize="12px"
                  color="fg.muted"
                  mb="10px"
                  lineHeight="1.4"
                >
                  Recording the opposing party now lets the conflict check flag
                  issues before the intake proceeds.
                </Text>
                <Grid templateColumns={{ base: "1fr" }} gap="10px">
                  <FormField label="Opposing party name">
                    <Input
                      type="text"
                      {...register("adversePartyName")}
                      placeholder="e.g. Acme Corp"
                      {...fieldStyles}
                    />
                  </FormField>
                  <FormField
                    label="Opposing party email"
                    error={errors.adversePartyEmail?.message}
                  >
                    <Input
                      type="email"
                      {...register("adversePartyEmail")}
                      placeholder="e.g. legal@acme.com"
                      {...fieldStyles}
                    />
                  </FormField>
                </Grid>
              </Box>
            </VStack>

            <Flex justify="space-between" gap="12px" mt="18px">
              <OutlineButton type="button" onClick={close}>
                Cancel
              </OutlineButton>
              <BrandButton
                type="submit"
                minW="152px"
                loading={createLead.isPending}
              >
                <UserPlus size={15} />
                Add lead
              </BrandButton>
            </Flex>
          </Box>
  );
}

/*
  The only field that depends on `practiceAreaId`. Subscribing here — not in
  AddLeadForm — keeps choosing a practice area from re-rendering the rest of
  the form, and avoids the React Compiler opt-out that `watch()` triggers.
*/
function CaseTypeField({
  control,
  practiceAreas,
  loading,
}: {
  control: Control<LeadForm>;
  practiceAreas: PublicPracticeArea[] | undefined;
  loading: boolean;
}) {
  const practiceAreaId = useWatch({ control, name: "practiceAreaId" });
  const caseTypeOptions = getCaseTypes(practiceAreaId, practiceAreas);

  /*
    The error comes from the Controller's own `fieldState` rather than from an
    `errors` prop: this component is deliberately isolated from AddLeadForm's
    render (see above), and threading `errors` in would re-subscribe it to the
    whole form state, undoing that.
  */
  return (
    <Controller
      control={control}
      name="caseTypeId"
      render={({ field, fieldState }) => (
        <FormField label="Case type" error={fieldState.error?.message}>
          {loading ? (
            <ControlSkeleton h="36px" />
          ) : (
            <FormSelect
              ariaLabel="Case type"
              placeholder={
                practiceAreaId
                  ? "Select case type"
                  : "Select practice area first"
              }
              disabled={!practiceAreaId}
              value={field.value}
              onChange={field.onChange}
              options={caseTypeOptions.map((ct) => ({
                value: ct.id,
                label: ct.name,
              }))}
            />
          )}
        </FormField>
      )}
    />
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <Text
        as="label"
        display="block"
        mb="5px"
        color="fg"
        fontSize="11px"
        fontWeight="500"
      >
        {label}
      </Text>
      {children}
      {error ? (
        <Text mt="4px" color="#c0392b" fontSize="11px">
          {error}
        </Text>
      ) : null}
    </Box>
  );
}

const fieldStyles = {
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
