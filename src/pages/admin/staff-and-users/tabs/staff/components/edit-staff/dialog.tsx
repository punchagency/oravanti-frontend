import type { PracticeAreaTreeNode } from "@/api/auth";
import type { TeamListDTO, UpdateStaffMemberPayload } from "@/api/organization";
import {
  CaseTypeSelect,
  type CaseTypeSelectHandle,
} from "@/components/ui/case-type-select";
import { usePracticeAreaList } from "@/hooks/use-practice-area-tree-data";
import { useRoleOptions } from "@/hooks/use-roles";
import { useTeamsList } from "@/hooks/use-teams-list";
import { useUpdateStaffMember } from "@/hooks/use-update-staff-member";
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
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDate,
  getLocalTimeZone,
  today,
  type DateValue,
} from "@internationalized/date";
import { CalendarDays, Pencil, X } from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { StaffMember } from "../../../../data";
import { inputStyles } from "./input-styles";
import { TeamMultiSelect } from "@/pages/admin/staff-and-users/components/team-multi-select";

// Built per staff member because the earliest allowed start date depends on
// whichever date they already have on record.
const buildFormSchema = (minStartDate: DateValue) =>
  z.object({
    firstName: z.string(),
    lastName: z.string(),
    role: z.string().min(1, "Role is required"),
    phone: z.string(),
    jobTitle: z.string(),
    personalEmail: z.string().email("Invalid email format"),
    orgEmail: z.string().email("Invalid email format").or(z.literal("")),
    startDate: z
      .custom<DateValue | undefined>()
      .refine(
        (value) => !value || value.compare(minStartDate) >= 0,
        "Start date cannot be in the past",
      ),
    maxCaseload: z.string(),
    teamIds: z.array(z.string()),
    practiceAreas: z
      .array(z.string())
      .min(1, "Select at least one practice area"),
  });

type FormValues = z.infer<ReturnType<typeof buildFormSchema>>;

interface EditStaffDialogProps {
  staff: StaffMember;
  children: ReactNode;
}

// Shared fallbacks so a pending query doesn't hand the tree/team list a new
// array identity on every render.
const NO_TREE_NODES: PracticeAreaTreeNode[] = [];
const NO_TEAMS: TeamListDTO[] = [];

function parseStartDate(value: string | null | undefined): DateValue | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (isNaN(date.getTime())) return undefined;
  return new CalendarDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
}

function computeInitialValues(staff: StaffMember): FormValues {
  const startDate = parseStartDate(staff.startDate);

  return {
    firstName: staff.firstName ?? "",
    lastName: staff.lastName ?? "",
    role: staff.role ?? "",
    phone: staff.phone ?? "",
    jobTitle: staff.jobTitle ?? "",
    personalEmail: staff.email ?? "",
    orgEmail: staff.orgEmail ?? "",
    startDate,
    maxCaseload: String(staff.caseloadMax ?? 7),
    teamIds: staff.teams.map((t) => t.id),
    practiceAreas: staff.practiceAreas.map((pa) => pa.id),
  };
}

export function EditStaffDialog({ staff, children }: EditStaffDialogProps) {
  const [open, setOpen] = useState(false);
  // Popups (select/date picker) must portal into the dialog content — a bare
  // Portal to body stacks them behind the modal when it's nested in the drawer.
  const contentRef = useRef<HTMLDivElement>(null);

  // Only the practice-area names are needed here; the case types for whichever
  // areas are assigned get fetched by CaseTypeSelect itself.
  const practiceAreaQuery = usePracticeAreaList();
  const practiceAreaTreeNodes =
    practiceAreaQuery.data?.practiceAreaTreeNodes ?? NO_TREE_NODES;
  const teamsQuery = useTeamsList({ limit: 200 });
  const teams = teamsQuery.data?.data ?? NO_TEAMS;

  const rolesQuery = useRoleOptions();
  const roleOptions = createListCollection({
    items: (rolesQuery.data ?? []).map((role) => ({
      label: role.label,
      value: role.name,
    })),
  });

  const caseTypesRef = useRef<CaseTypeSelectHandle>(null);
  const initialCaseTypeIds = useMemo(
    () => (staff.caseTypes ?? []).map((ct) => ct.id),
    [staff.caseTypes],
  );

  // New start dates can't be in the past, but an existing hire may genuinely
  // have started before today — clamp the floor to their stored date so editing
  // an unrelated field doesn't invalidate it.
  const startDateMin = useMemo(() => {
    const todayValue = today(getLocalTimeZone());
    const existing = parseStartDate(staff.startDate);
    return existing && existing.compare(todayValue) < 0 ? existing : todayValue;
  }, [staff.startDate]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<FormValues>({
    resolver: zodResolver(buildFormSchema(startDateMin)),
    defaultValues: computeInitialValues(staff),
    mode: "onBlur",
  });

  const updateMutation = useUpdateStaffMember();

  const onSubmit = (formData: FormValues) => {
    const selectedIds = caseTypesRef.current?.getSelectedIds() ?? [];
    const payload: UpdateStaffMemberPayload = {
      firstName: formData.firstName.trim() || undefined,
      lastName: formData.lastName.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      jobTitle: formData.jobTitle.trim() || undefined,
      email: formData.personalEmail.trim() || undefined,
      orgEmail: formData.orgEmail.trim() || undefined,
      startDate: formData.startDate?.toString(),
      maxCaseload: Number(formData.maxCaseload) || undefined,
      caseTypeIds: selectedIds.length > 0 ? selectedIds : undefined,
      teamIds: formData.teamIds.length > 0 ? formData.teamIds : undefined,
    };

    const roleChanged = formData.role !== (staff.role ?? "");
    updateMutation.mutate(
      {
        staffId: staff.id,
        data: payload,
        newRole: roleChanged ? formData.role : undefined,
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        setOpen(details.open);
        // CaseTypeSelect unmounts with the dialog, so it re-seeds from
        // `initialCaseTypeIds` the next time it opens.
        if (!details.open) reset(computeInitialValues(staff));
      }}
      placement="center"
    >
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1.5px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            ref={contentRef}
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
                aria-label="Close edit staff dialog"
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
                Edit staff details
              </Dialog.Title>
              <Dialog.Description
                mt="10px"
                color="fg.muted"
                fontSize="13px"
                lineHeight="1.35"
              >
                Updating details for{" "}
                <Text as="span" fontWeight="600" color="fg">
                  {staff.name}
                </Text>
                .
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
                    <Field.Label>First name</Field.Label>
                    <Input
                      placeholder="e.g. Sarah"
                      {...register("firstName")}
                      {...inputStyles}
                    />
                    {errors.firstName && (
                      <Field.ErrorText>
                        {errors.firstName.message}
                      </Field.ErrorText>
                    )}
                  </Field.Root>

                  <Field.Root invalid={!!errors.lastName}>
                    <Field.Label>Last name</Field.Label>
                    <Input
                      placeholder="e.g. Johnson"
                      {...register("lastName")}
                      {...inputStyles}
                    />
                    {errors.lastName && (
                      <Field.ErrorText>
                        {errors.lastName.message}
                      </Field.ErrorText>
                    )}
                  </Field.Root>
                </Grid>

                <Grid
                  templateColumns={{
                    base: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                  }}
                  gap="10px"
                >
                  <Field.Root invalid={!!errors.jobTitle}>
                    <Field.Label>Job title</Field.Label>
                    <Input
                      placeholder="e.g. Senior Attorney"
                      {...register("jobTitle")}
                      {...inputStyles}
                    />
                    {errors.jobTitle && (
                      <Field.ErrorText>
                        {errors.jobTitle.message}
                      </Field.ErrorText>
                    )}
                  </Field.Root>

                  <Field.Root invalid={!!errors.role}>
                    <Field.Label>
                      Role
                      {!staff.memberId && (
                        <Text
                          as="span"
                          color="fg.subtle"
                          fontSize="11px"
                          fontWeight="400"
                          ml={1}
                        >
                          (not editable until invitation is accepted)
                        </Text>
                      )}
                    </Field.Label>
                    <Controller
                      name="role"
                      control={control}
                      render={({ field }) => (
                        <Select.Root
                          collection={roleOptions}
                          size="sm"
                          value={[field.value]}
                          onValueChange={(e) => {
                            if (!staff.memberId) return;
                            field.onChange(e.value[0] ?? "");
                          }}
                          disabled={!staff.memberId}
                        >
                          <Select.Control>
                            <Select.Trigger
                              h="36px"
                              border="1px solid"
                              borderColor="border"
                              borderRadius="7px"
                              bg="bg"
                              opacity={staff.memberId ? 1 : 0.5}
                              cursor={
                                staff.memberId ? "pointer" : "not-allowed"
                              }
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
                          <Portal container={contentRef}>
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
                </Grid>

                <Field.Root invalid={!!errors.personalEmail}>
                  <Field.Label>
                    Personal email
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Input
                    type="email"
                    placeholder="e.g. sarah@gmail.com"
                    {...register("personalEmail")}
                    {...inputStyles}
                  />
                  {errors.personalEmail && (
                    <Field.ErrorText>
                      {errors.personalEmail.message}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root invalid={!!errors.orgEmail}>
                  <Field.Label>Organization email</Field.Label>
                  <Input
                    type="email"
                    placeholder="e.g. sarah@firm.com"
                    {...register("orgEmail")}
                    {...inputStyles}
                  />
                  {errors.orgEmail && (
                    <Field.ErrorText>{errors.orgEmail.message}</Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root invalid={!!errors.phone}>
                  <Field.Label>Phone</Field.Label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 012-3456"
                    {...register("phone")}
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
                  <Field.Root invalid={!!errors.maxCaseload}>
                    <Field.Label>Max caseload</Field.Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="7"
                      {...register("maxCaseload", {
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

                  <Field.Root invalid={!!errors.startDate}>
                    <Field.Label>
                      Start date
                      {staff.status === "active" && (
                        <Text
                          as="span"
                          color="fg.subtle"
                          fontSize="11px"
                          fontWeight="400"
                          ml={1}
                        >
                          (locked for active staff)
                        </Text>
                      )}
                    </Field.Label>
                    <Controller
                      name="startDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker.Root
                          value={field.value ? [field.value] : []}
                          min={startDateMin}
                          onValueChange={(e) => {
                            if (staff.status === "active") return;
                            field.onChange(e.value[0] ?? undefined);
                          }}
                          disabled={staff.status === "active"}
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
                              disabled={staff.status === "active"}
                              opacity={staff.status === "active" ? 0.5 : 1}
                              cursor={
                                staff.status === "active"
                                  ? "not-allowed"
                                  : "text"
                              }
                            />
                            <DatePicker.IndicatorGroup>
                              <DatePicker.Trigger
                                asChild
                                border="none"
                                bg="transparent"
                                color={
                                  staff.status === "active"
                                    ? "fg.subtle"
                                    : "fg.muted"
                                }
                                cursor={
                                  staff.status === "active"
                                    ? "not-allowed"
                                    : "pointer"
                                }
                                disabled={staff.status === "active"}
                              >
                                <chakra.button type="button">
                                  <CalendarDays size={16} />
                                </chakra.button>
                              </DatePicker.Trigger>
                            </DatePicker.IndicatorGroup>
                          </DatePicker.Control>
                          {staff.status !== "active" && (
                            <Portal container={contentRef}>
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
                          )}
                        </DatePicker.Root>
                      )}
                    />
                    {errors.startDate && (
                      <Field.ErrorText>
                        {errors.startDate.message}
                      </Field.ErrorText>
                    )}
                  </Field.Root>
                </Grid>

                <Field.Root w="full">
                  <Field.Label>
                    Assign Team(s)
                    {staff.status === "active" && (
                      <Text
                        as="span"
                        color="fg.subtle"
                        fontSize="11px"
                        fontWeight="400"
                        ml={1}
                      >
                        (use team profile for assignment after acceptance)
                      </Text>
                    )}
                  </Field.Label>
                  <Controller
                    name="teamIds"
                    control={control}
                    render={({ field }) => (
                      <TeamMultiSelect
                        teams={teams}
                        selectedIds={field.value}
                        onToggle={(id) => {
                          if (staff.status === "active") return;
                          const next = field.value.includes(id)
                            ? field.value.filter((tid) => tid !== id)
                            : [...field.value, id];
                          field.onChange(next);
                        }}
                        disabled={staff.status === "active"}
                      />
                    )}
                  />
                </Field.Root>

                <Controller
                  name="practiceAreas"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Field.Root>
                        <Field.Label>Practice areas</Field.Label>
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
                                      : [
                                          ...(field.value || []),
                                          practiceArea.id,
                                        ],
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
                      </Field.Root>
                      <CaseTypeSelect
                        ref={caseTypesRef}
                        selectedPracticeAreaIds={field.value}
                        defaultSelectedIds={initialCaseTypeIds}
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
                <chakra.button
                  type="submit"
                  disabled={updateMutation.isPending}
                  h="36px"
                  px="20px"
                  borderRadius="8px"
                  bg="brand.solid"
                  color="white"
                  fontSize="13px"
                  fontWeight="500"
                  border="none"
                  cursor="pointer"
                  display="inline-flex"
                  alignItems="center"
                  gap={1.5}
                  opacity={updateMutation.isPending ? 0.6 : 1}
                  _hover={{ opacity: 0.9 }}
                >
                  <Pencil size={14} />
                  {updateMutation.isPending ? "Saving..." : "Save changes"}
                </chakra.button>
              </Flex>
            </Box>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
