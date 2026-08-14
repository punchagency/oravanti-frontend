import type { PracticeAreaTreeNode } from "@/api/auth";
import type { InviteStaffsPayload, TeamListDTO } from "@/api/organization";
import { BrandButton } from "@/components/ui/intake-ui";
import {
  CaseTypeSelect,
  type CaseTypeSelectHandle,
} from "@/components/ui/case-type-select";
import { useInviteStaffs } from "@/hooks/use-invite-staff";
import { usePracticeAreaList } from "@/hooks/use-practice-area-tree-data";
import { useTeamsList } from "@/hooks/use-teams-list";
import {
  Box,
  chakra,
  createListCollection,
  DatePicker,
  Dialog,
  Field,
  Flex,
  Grid,
  Input,
  Portal,
  Select,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { getLocalTimeZone, today, type DateValue } from "@internationalized/date";
import { CalendarDays, UserPlus, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { inputStyles } from "./input-styles";
import { TeamMultiSelect } from "./team-multi-select";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  orgEmail: string;
  phone: string;
  role: string;
  teamIds: string[];
  startDate: DateValue | undefined;
  maxCaseload: string;
  practiceAreas: string[];
}

const roleOptions = createListCollection({
  items: [
    { value: "", label: "Select role" },
    { value: "attorney", label: "Attorney" },
    { value: "admin", label: "Admin" },
    { value: "paralegal", label: "Paralegal" },
  ],
});

// Shared fallbacks so a pending query doesn't hand the tree/team list a new
// array identity on every render.
const NO_TREE_NODES: PracticeAreaTreeNode[] = [];
const NO_TEAMS: TeamListDTO[] = [];

export function InviteStaffButton() {
  return (
    <InviteStaffDialog>
      <BrandButton>
        <UserPlus size={15} />
        Invite staff
      </BrandButton>
    </InviteStaffDialog>
  );
}

export function InviteStaffDialog({
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

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<FormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      orgEmail: "",
      phone: "",
      role: "",
      teamIds: [],
      startDate: undefined,
      maxCaseload: "",
      practiceAreas: [],
    },
    mode: "onBlur",
  });

  // Only the practice-area names are needed here; the case types for whichever
  // areas get picked are fetched by CaseTypeSelect itself.
  const practiceAreaQuery = usePracticeAreaList();
  const practiceAreaTreeNodes =
    practiceAreaQuery.data?.practiceAreaTreeNodes ?? NO_TREE_NODES;
  const teamsQuery = useTeamsList({ limit: 200 });
  const teams = teamsQuery.data?.data ?? NO_TEAMS;

  const inviteMutation = useInviteStaffs();

  const caseTypesRef = useRef<CaseTypeSelectHandle>(null);

  const onSubmit = (formData: FormValues) => {
    const selectedIds = caseTypesRef.current?.getSelectedIds() ?? [];
    const payload: InviteStaffsPayload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      orgEmail: formData.orgEmail.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      role: formData.role,
      startDate: formData.startDate?.toString(),
      maxCaseload: Number(formData.maxCaseload) || undefined,
      caseTypeIds: selectedIds.length > 0 ? selectedIds : undefined,
      teamIds: formData.teamIds.length > 0 ? formData.teamIds : undefined,
    };

    inviteMutation.mutate(payload, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        onOpenChange(details.open);
        // CaseTypeSelect unmounts with the dialog, so its selection resets too.
        if (!details.open) reset();
      }}
      placement="center"
    >
      {children && <Dialog.Trigger asChild>{children}</Dialog.Trigger>}
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1.5px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            w="full"
            maxW="560px"
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
                aria-label="Close invite staff dialog"
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

            {/* Built inside the handler rather than during render: onSubmit
                reads the case-type selection off a ref. */}
            <Box
              as="form"
              p="32px 24px 24px"
              onSubmit={(e) => handleSubmit(onSubmit)(e)}
            >
              <Dialog.Title
                color="fg"
                fontSize="17px"
                fontWeight="600"
                lineHeight="1.2"
              >
                Invite staff
              </Dialog.Title>
              <Dialog.Description
                mt="10px"
                color="fg.muted"
                fontSize="13px"
                lineHeight="1.35"
              >
                Send an invitation to join your organization.
              </Dialog.Description>

              <VStack align="stretch" gap="12px" mt="18px">
                <Grid
                  templateColumns={{
                    base: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                  }}
                  gap="10px"
                >
                  <Field.Root invalid={!!errors.firstName}>
                    <Field.Label>
                      First name
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      placeholder="e.g. Sarah"
                      {...register("firstName", {
                        required: "First name is required",
                      })}
                      {...inputStyles}
                    />
                    {errors.firstName && (
                      <Field.ErrorText>
                        {errors.firstName.message}
                      </Field.ErrorText>
                    )}
                  </Field.Root>
                  <Field.Root invalid={!!errors.lastName}>
                    <Field.Label>
                      Last name
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      placeholder="e.g. Mensah"
                      {...register("lastName", {
                        required: "Last name is required",
                      })}
                      {...inputStyles}
                    />
                    {errors.lastName && (
                      <Field.ErrorText>
                        {errors.lastName.message}
                      </Field.ErrorText>
                    )}
                  </Field.Root>
                </Grid>

                <Field.Root invalid={!!errors.email}>
                  <Field.Label>
                    Email (invite)
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Input
                    type="email"
                    placeholder="e.g. sarah@example.com"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: EMAIL_PATTERN,
                        message: "Invalid email format",
                      },
                    })}
                    {...inputStyles}
                  />
                  {errors.email && (
                    <Field.ErrorText>{errors.email.message}</Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root invalid={!!errors.orgEmail}>
                  <Field.Label>
                    Organization email
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Input
                    type="email"
                    placeholder="e.g. sarah@firm.com"
                    {...register("orgEmail", {
                      required: "Organization email is required",
                      pattern: {
                        value: EMAIL_PATTERN,
                        message: "Invalid email format",
                      },
                    })}
                    {...inputStyles}
                  />
                  {errors.orgEmail && (
                    <Field.ErrorText>{errors.orgEmail.message}</Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root invalid={!!errors.phone}>
                  <Field.Label>
                    Phone
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 012-3456"
                    {...register("phone", {
                      required: "Phone is required",
                    })}
                    {...inputStyles}
                  />
                  {errors.phone && (
                    <Field.ErrorText>{errors.phone.message}</Field.ErrorText>
                  )}
                </Field.Root>

                <Grid
                  templateColumns={{
                    base: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                  }}
                  gap="10px"
                >
                  <Field.Root invalid={!!errors.role}>
                    <Field.Label>
                      Role
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Controller
                      name="role"
                      control={control}
                      rules={{ required: "Role is required" }}
                      render={({ field }) => (
                        <Select.Root
                          collection={roleOptions}
                          size="sm"
                          value={[field.value]}
                          onValueChange={(e) =>
                            field.onChange(e.value[0] ?? "")
                          }
                        >
                          <Select.Control>
                            <Select.Trigger
                              h="36px"
                              border="1px solid"
                              borderColor="border"
                              borderRadius="7px"
                              bg="bg"
                              _focus={{
                                borderColor: "brand.solid",
                                boxShadow: "0 0 0 1px var(--brand-cta)",
                              }}
                            >
                              <Select.ValueText />
                            </Select.Trigger>
                            <Select.IndicatorGroup>
                              <Select.Indicator />
                            </Select.IndicatorGroup>
                          </Select.Control>
                          <Portal>
                            <Select.Positioner>
                              <Select.Content>
                                {roleOptions.items.map((opt) => (
                                  <Select.Item item={opt} key={opt.value}>
                                    <Select.ItemText>
                                      {opt.label}
                                    </Select.ItemText>
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select.Positioner>
                          </Portal>
                        </Select.Root>
                      )}
                    />
                    {errors.role && (
                      <Field.ErrorText>{errors.role.message}</Field.ErrorText>
                    )}
                  </Field.Root>

                  <Field.Root invalid={!!errors.maxCaseload}>
                    <Field.Label>
                      Max caseload
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="7"
                      {...register("maxCaseload", {
                        required: "Max caseload is required",
                        min: { value: 1, message: "Minimum is 1" },
                      })}
                      {...inputStyles}
                    />
                    {errors.maxCaseload && (
                      <Field.ErrorText>
                        {errors.maxCaseload.message}
                      </Field.ErrorText>
                    )}
                  </Field.Root>
                </Grid>

                <Field.Root w="full">
                  <Field.Label>Assign Team(s)</Field.Label>
                  <Controller
                    name="teamIds"
                    control={control}
                    render={({ field }) => (
                      <TeamMultiSelect
                        teams={teams}
                        selectedIds={field.value}
                        onToggle={(id) => {
                          const next = field.value.includes(id)
                            ? field.value.filter((tid) => tid !== id)
                            : [...field.value, id];
                          field.onChange(next);
                        }}
                      />
                    )}
                  />
                </Field.Root>

                <Field.Root invalid={!!errors.startDate}>
                  <Field.Label>
                    Start date
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Controller
                    name="startDate"
                    control={control}
                    rules={{
                      required: "Start date is required",
                      // `min` greys out past days in the calendar, but the input
                      // is typeable — so the rule has to be enforced here too.
                      validate: (value) =>
                        !value ||
                        value.compare(today(getLocalTimeZone())) >= 0 ||
                        "Start date cannot be in the past",
                    }}
                    render={({ field }) => (
                      <DatePicker.Root
                        value={field.value ? [field.value] : []}
                        min={today(getLocalTimeZone())}
                        onValueChange={(e) =>
                          field.onChange(e.value[0] ?? undefined)
                        }
                      >
                        <DatePicker.Control>
                          <DatePicker.Input
                            h="36px"
                            px="12px"
                            border="1px solid"
                            borderColor="border"
                            borderRadius="7px"
                            bg="bg"
                            color="fg"
                            fontSize="13px"
                            _placeholder={{ color: "fg.muted" }}
                            _focus={{
                              borderColor: "brand.solid",
                              boxShadow: "0 0 0 1px var(--brand-cta)",
                            }}
                          />
                          <DatePicker.IndicatorGroup>
                            <DatePicker.Trigger
                              asChild
                              border="none"
                              bg="transparent"
                              color="fg.muted"
                              cursor="pointer"
                            >
                              <chakra.button type="button">
                                <CalendarDays size={16} />
                              </chakra.button>
                            </DatePicker.Trigger>
                          </DatePicker.IndicatorGroup>
                        </DatePicker.Control>
                        <Portal>
                          <DatePicker.Positioner>
                            <DatePicker.Content>
                              <DatePicker.View view="day">
                                <DatePicker.Header />
                                <DatePicker.DayTable />
                              </DatePicker.View>
                              <DatePicker.View view="month">
                                <DatePicker.Header />
                                <DatePicker.MonthTable />
                              </DatePicker.View>
                              <DatePicker.View view="year">
                                <DatePicker.Header />
                                <DatePicker.YearTable />
                              </DatePicker.View>
                            </DatePicker.Content>
                          </DatePicker.Positioner>
                        </Portal>
                      </DatePicker.Root>
                    )}
                  />
                  {errors.startDate && (
                    <Field.ErrorText>
                      {errors.startDate.message}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                <Controller
                  name="practiceAreas"
                  control={control}
                  rules={{
                    validate: (v) =>
                      (v && v.length > 0) ||
                      "Select at least one practice area",
                  }}
                  render={({ field }) => (
                    <>
                      <Field.Root invalid={!!errors.practiceAreas}>
                        <Field.Label>
                          Practice areas (staff can handle)
                          <Field.RequiredIndicator />
                        </Field.Label>
                        <SimpleGrid
                          columns={{ base: 1, sm: 2 }}
                          w="full"
                          gap="8px"
                        >
                          {practiceAreaTreeNodes.map((practiceArea) => {
                            const isSelected = field.value?.includes(
                              practiceArea.id,
                            );
                            return (
                              <Flex
                                key={practiceArea.id}
                                align="center"
                                justify="space-between"
                                gap={3}
                                px={4}
                                py={3}
                                borderRadius="md"
                                border="1px solid"
                                borderColor={
                                  isSelected ? "brand.solid" : "border.muted"
                                }
                                cursor="pointer"
                                _hover={{
                                  borderColor: "brand.solid",
                                }}
                                onClick={() => {
                                  // Deselecting only drops the practice area —
                                  // CaseTypeSelect filters its own selection
                                  // down to the areas still on screen.
                                  field.onChange(
                                    isSelected
                                      ? field.value.filter(
                                          (id) => id !== practiceArea.id,
                                        )
                                      : [...(field.value || []), practiceArea.id],
                                  );
                                }}
                                transition="all 0.15s"
                              >
                                <Text
                                  fontSize="13px"
                                  fontWeight="600"
                                  color="fg.default"
                                >
                                  {practiceArea.name}
                                </Text>
                                <Box
                                  w="4"
                                  h="4"
                                  borderRadius="sm"
                                  borderWidth="1px"
                                  borderColor={
                                    isSelected
                                      ? "brand.solid"
                                      : "border.emphasized"
                                  }
                                  bg={
                                    isSelected ? "brand.solid" : "transparent"
                                  }
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                >
                                  {isSelected && (
                                    <svg
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke={isSelected ? "black" : "none"}
                                      strokeWidth="4"
                                      width="10px"
                                      height="10px"
                                    >
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                  )}
                                </Box>
                              </Flex>
                            );
                          })}
                        </SimpleGrid>
                        {errors.practiceAreas && (
                          <Field.ErrorText>
                            {errors.practiceAreas.message as string}
                          </Field.ErrorText>
                        )}
                      </Field.Root>
                      <CaseTypeSelect
                        ref={caseTypesRef}
                        selectedPracticeAreaIds={field.value}
                        showValidation={isSubmitted}
                        onRemovePracticeArea={(id) =>
                          field.onChange(
                            field.value.filter((paId) => paId !== id),
                          )
                        }
                      />
                    </>
                  )}
                />
              </VStack>

              <Flex justify="flex-end" gap="12px" mt="18px">
                <BrandButton
                  type="submit"
                  loading={inviteMutation.isPending}
                  minW="152px"
                >
                  <UserPlus size={15} />
                  Send invitation
                </BrandButton>
              </Flex>
            </Box>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
