import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import { leadSources } from "@/pages/admin/intake/data";
import { sourceValues, type LeadSource } from "@/api/leads";
import { useCreateLead } from "@/hooks/use-leads";
import { usePublicPracticeAreas } from "@/hooks/use-public-practice-areas";
import type { PublicPracticeArea } from "@/pages/contractor-sign-up/types";
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
import { UserPlus, X } from "lucide-react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  situationSummary: "",
  adversePartyName: "",
  adversePartyEmail: "",
};

export function AddLeadDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: practiceAreas } = usePublicPracticeAreas();
  const createLead = useCreateLead();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
    defaultValues: LEAD_DEFAULTS,
    mode: "onTouched",
  });

  const practiceAreaId = watch("practiceAreaId");
  const caseTypeOptions = getCaseTypes(practiceAreaId, practiceAreas);
  const practiceAreaField = register("practiceAreaId");

  function handleClose() {
    onOpenChange(false);
    reset(LEAD_DEFAULTS);
  }

  const onSubmit = handleSubmit((data) => {
    const name = [data.firstName.trim(), data.lastName.trim()]
      .filter(Boolean)
      .join(" ");
    createLead.mutate(
      {
        name,
        email: data.email.trim(),
        phone: data.phone || undefined,
        practiceAreaId: data.practiceAreaId || undefined,
        caseTypeId: data.caseTypeId || undefined,
        source: (sourceValues[data.source] ?? "direct") as LeadSource,
        situationSummary: data.situationSummary || undefined,
        intakeAdversePartyName: data.adversePartyName.trim() || undefined,
        intakeAdversePartyEmail: data.adversePartyEmail.trim() || undefined,
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
      <Dialog.Backdrop bg="rgba(0, 0, 0, 0.46)" />
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
                <chakra.select
                  {...practiceAreaField}
                  onChange={(event) => {
                    practiceAreaField.onChange(event);
                    setValue("caseTypeId", "");
                  }}
                  {...selectStyles}
                >
                  <option value="">Select practice area</option>
                  {(practiceAreas ?? []).map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </chakra.select>
              </FormField>

              <FormField label="Case type">
                <chakra.select
                  {...register("caseTypeId")}
                  {...selectStyles}
                  disabled={!practiceAreaId}
                  opacity={practiceAreaId ? 1 : 0.62}
                  cursor={practiceAreaId ? "pointer" : "not-allowed"}
                >
                  <option value="">
                    {practiceAreaId
                      ? "Select case type"
                      : "Select practice area first"}
                  </option>
                  {caseTypeOptions.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name}
                    </option>
                  ))}
                </chakra.select>
              </FormField>

              <FormField label="Source">
                <chakra.select {...register("source")} {...selectStyles}>
                  {leadSources.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </chakra.select>
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
                <Text fontSize="11px" fontWeight="600" color="fg.muted" mb="4px">
                  Known opposing party (optional)
                </Text>
                <Text fontSize="12px" color="fg.muted" mb="10px" lineHeight="1.4">
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
                Add to lead inbox
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

const selectStyles = {
  w: "full",
  h: "36px",
  px: "12px",
  border: "1px solid",
  borderColor: "border",
  borderRadius: "7px",
  bg: "bg",
  color: "fg",
  fontSize: "13px",
  cursor: "pointer",
  _focus: {
    borderColor: "brand.solid",
    boxShadow: "0 0 0 1px var(--brand-cta)",
  },
};
