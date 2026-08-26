import {
  Box,
  Dialog,
  Grid,
  HStack,
  Input,
  Portal,
  Text,
  Textarea,
  chakra,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useEffect, useMemo, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  sourceLabels,
  type LeadDetail,
  type LeadSource,
  type UpdateLeadInput,
} from "@/api/leads";
import { FormSelect, type FormSelectOption } from "@/components/ui/form-select";
import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import { useEditLead } from "@/hooks/use-leads";
import { usePublicPracticeAreas } from "@/hooks/use-public-practice-areas";
import type { PublicPracticeArea } from "@/pages/contractor-sign-up/types";

/**
 * Edit a lead's details. Only fields the server actually persists are offered —
 * the previous updateLead contract advertised `name`, which is not a column, so
 * a rename silently did nothing.
 *
 * Every change is recorded in the lead's activity trail with its before and
 * after value, so an edit is accountable rather than invisible.
 */

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
} as const;

function getCaseTypes(
  practiceAreaId: string,
  practiceAreas: PublicPracticeArea[] | undefined,
): { id: string; name: string }[] {
  if (!practiceAreaId || !practiceAreas) return [];
  const area = practiceAreas.find((a) => a.id === practiceAreaId);
  return area ? area.subcategories.flatMap((s) => s.caseTypes) : [];
}

const editSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string(),
  source: z.string(),
  // Required here for the same reasons Add Lead requires them: a lead missing
  // either is blocked at the questionnaire stage and again at case opening.
  // This dialog was left optional when Add Lead was tightened, so a lead could
  // be created correctly and then edited into a state the create form forbids.
  practiceAreaId: z.string().min(1, "Select a practice area"),
  caseTypeId: z.string().min(1, "Select a matter type"),
  situationSummary: z.string(),
});

type EditForm = z.infer<typeof editSchema>;

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
      {error && (
        <Text m="4px 0 0" color="#c0392b" fontSize="11px">
          {error}
        </Text>
      )}
    </Box>
  );
}

export function EditLeadDialog({
  lead,
  open,
  onOpenChange,
}: {
  lead: LeadDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const editLead = useEditLead();
  const { data: practiceAreas } = usePublicPracticeAreas();

  // The lead's name arrives concatenated; the server stores the two halves.
  const [firstName = "", ...rest] = (lead.name ?? "").split(" ");

  const defaults = useMemo<EditForm>(
    () => ({
      firstName,
      lastName: rest.join(" "),
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      source: lead.source,
      practiceAreaId: lead.practiceAreaId ?? "",
      caseTypeId: lead.caseTypeId ?? "",
      situationSummary: lead.situationSummary ?? "",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lead],
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: defaults,
  });

  // Reset on open rather than unmounting the dialog on close — unmounting
  // Dialog.Root on the open state breaks Chakra's focus trap.
  useEffect(() => {
    if (open) reset(defaults);
  }, [open, defaults, reset]);

  // useWatch rather than watch(): watch() returns a fresh function each render,
  // which the React Compiler cannot memoize.
  const practiceAreaId = useWatch({ control, name: "practiceAreaId" });
  const caseTypeOptions = useMemo(
    () => getCaseTypes(practiceAreaId, practiceAreas),
    [practiceAreaId, practiceAreas],
  );

  const practiceAreaOptions = useMemo<FormSelectOption[]>(
    () =>
      (practiceAreas ?? []).map((area) => ({
        label: area.name,
        value: area.id,
      })),
    [practiceAreas],
  );

  const caseTypeSelectOptions = useMemo<FormSelectOption[]>(
    () => caseTypeOptions.map((ct) => ({ label: ct.name, value: ct.id })),
    [caseTypeOptions],
  );

  const sourceOptions = useMemo<FormSelectOption[]>(
    () =>
      (Object.entries(sourceLabels) as [LeadSource, string][]).map(
        ([value, label]) => ({ label, value }),
      ),
    [],
  );

  function onSubmit(data: EditForm) {
    const payload: UpdateLeadInput = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || undefined,
      source: data.source as LeadSource,
      situationSummary: data.situationSummary || undefined,
      practiceAreaId: data.practiceAreaId,
      caseTypeId: data.caseTypeId,
    };

    editLead.mutate(
      { id: lead.id, data: payload },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      size="lg"
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="12px" bg="bg">
            <Dialog.Header
              px="20px"
              py="16px"
              borderBottom="1px solid"
              borderColor="border"
            >
              <HStack justify="space-between" w="100%">
                <Dialog.Title fontSize="16px" fontWeight="600">
                  Edit lead
                </Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <chakra.button
                    type="button"
                    display="grid"
                    placeItems="center"
                    w="30px"
                    h="30px"
                    borderRadius="50%"
                    color="fg.muted"
                    cursor="pointer"
                    _hover={{ bg: "bg.subtle" }}
                  >
                    <X size={15} />
                  </chakra.button>
                </Dialog.CloseTrigger>
              </HStack>
            </Dialog.Header>

            <Dialog.Body px="20px" py="18px">
              <Grid templateColumns="repeat(2, 1fr)" gap="14px">
                <FormField label="First name" error={errors.firstName?.message}>
                  <Input {...register("firstName")} {...fieldStyles} />
                </FormField>

                <FormField label="Last name" error={errors.lastName?.message}>
                  <Input {...register("lastName")} {...fieldStyles} />
                </FormField>

                <FormField label="Email" error={errors.email?.message}>
                  <Input {...register("email")} {...fieldStyles} />
                </FormField>

                <FormField label="Phone">
                  <Input {...register("phone")} {...fieldStyles} />
                </FormField>

                <FormField
                  label="Practice area"
                  error={errors.practiceAreaId?.message}
                >
                  <Controller
                    control={control}
                    name="practiceAreaId"
                    render={({ field }) => (
                      <FormSelect
                        options={practiceAreaOptions}
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value);
                          // The case types are scoped to the practice area, so
                          // a stale one would no longer be valid.
                          //
                          // `shouldValidate` because the field now carries a
                          // rule — without it, wiping a valid selection leaves
                          // a stale "valid" state until blur or submit.
                          setValue("caseTypeId", "", { shouldValidate: true });
                        }}
                        placeholder="Select practice area"
                        ariaLabel="Practice area"
                      />
                    )}
                  />
                </FormField>

                <FormField
                  label="Matter type"
                  error={errors.caseTypeId?.message}
                >
                  <Controller
                    control={control}
                    name="caseTypeId"
                    render={({ field }) => (
                      <FormSelect
                        options={caseTypeSelectOptions}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!practiceAreaId}
                        placeholder={
                          practiceAreaId
                            ? "Select matter type"
                            : "Select a practice area first"
                        }
                        ariaLabel="Matter type"
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
                        options={sourceOptions}
                        value={field.value}
                        onChange={field.onChange}
                        ariaLabel="Source"
                      />
                    )}
                  />
                </FormField>
              </Grid>

              <Box mt="14px">
                <FormField label="Brief summary">
                  <Textarea
                    {...register("situationSummary")}
                    rows={4}
                    resize="vertical"
                    placeholder="Summarise the client's situation."
                    {...fieldStyles}
                    h="auto"
                    py="10px"
                  />
                </FormField>
              </Box>

              <Text m="14px 0 0" color="fg.subtle" fontSize="11px">
                Changes are recorded in this lead's activity trail.
              </Text>
            </Dialog.Body>

            <Dialog.Footer
              px="20px"
              py="14px"
              borderTop="1px solid"
              borderColor="border"
            >
              <HStack justify="flex-end" gap="8px" w="100%">
                <OutlineButton onClick={() => onOpenChange(false)}>
                  Cancel
                </OutlineButton>
                <BrandButton
                  loading={editLead.isPending}
                  onClick={handleSubmit(onSubmit)}
                >
                  Save changes
                </BrandButton>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
