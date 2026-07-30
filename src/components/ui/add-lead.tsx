import { sourceValues, type LeadSource } from "@/api/leads";
import { FormSelect } from "@/components/ui/form-select";
import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import { useCreateLead } from "@/hooks/use-leads";
import { usePublicPracticeAreas } from "@/hooks/use-public-practice-areas";
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
import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
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
  practiceAreaId: z.string(),
  caseTypeId: z.string(),
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

export function AddLeadDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
} = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const onOpenChange = controlledOnOpenChange ?? setInternalOpen;
  const { data: practiceAreas } = usePublicPracticeAreas();
  const createLead = useCreateLead();
  const firmTimezone = useFirmTimezone();

  // Lead timezone is optional and defaults to the firm's zone.
  const formDefaults = { ...LEAD_DEFAULTS, timezone: firmTimezone };

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
    defaultValues: formDefaults,
    mode: "onTouched",
  });

  const practiceAreaId = watch("practiceAreaId");
  const caseTypeOptions = getCaseTypes(practiceAreaId, practiceAreas);

  function handleClose() {
    onOpenChange(false);
    reset(formDefaults);
  }

  const onSubmit = handleSubmit((data) => {
    createLead.mutate(
      {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        phone: data.phone || undefined,
        practiceAreaId: data.practiceAreaId || undefined,
        caseTypeId: data.caseTypeId || undefined,
        source: (sourceValues[data.source] ?? "direct") as LeadSource,
        situationSummary: data.situationSummary || undefined,
        intakeAdversePartyName: data.adversePartyName.trim() || undefined,
        intakeAdversePartyEmail: data.adversePartyEmail.trim() || undefined,
        timezone: data.timezone || undefined,
      },
      { onSuccess: () => handleClose() },
    );
  });

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) handleClose();
        else onOpenChange(true);
      }}
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
            onClick={handleClose}
          >
            <X size={16} />
          </chakra.button>

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

              <FormField label="Practice area interest">
                <Controller
                  control={control}
                  name="practiceAreaId"
                  render={({ field }) => (
                    <FormSelect
                      ariaLabel="Practice area interest"
                      placeholder="Select practice area"
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        setValue("caseTypeId", "");
                      }}
                      options={(practiceAreas ?? []).map((area) => ({
                        value: area.id,
                        label: area.name,
                      }))}
                    />
                  )}
                />
              </FormField>

              <FormField label="Case type">
                <Controller
                  control={control}
                  name="caseTypeId"
                  render={({ field }) => (
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
                />
              </FormField>

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
              <OutlineButton type="button" onClick={handleClose}>
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
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
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
