import { type TeamListDTO, type UpdateStaffPayload } from "@/api/organization";
import { usePublicPracticeAreas } from "@/hooks/use-public-practice-areas";
import { useTeamsList } from "@/hooks/use-teams-list";
import { useUpdateStaff } from "@/hooks/use-update-staff";
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
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDate, type DateValue } from "@internationalized/date";
import { CalendarDays, Pencil, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { StaffMember } from "../../../data";

const formSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  role: z.string().min(1, "Role is required"),
  phone: z.string(),
  jobTitle: z.string(),
  personalEmail: z.string().email("Invalid email format"),
  orgEmail: z.string().email("Invalid email format").or(z.literal("")),
  startDate: z.custom<DateValue | undefined>(),
  maxCaseload: z.string(),
  practiceAreaIds: z.array(z.string()),
  teamIds: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

interface EditStaffDialogProps {
  staff: StaffMember;
  children: ReactNode;
}

const roleOptions = createListCollection({
  items: [
    { label: "Admin", value: "admin" },
    { label: "Attorney", value: "attorney" },
    { label: "Paralegal", value: "paralegal" },
  ],
});

function computeInitialValues(staff: StaffMember): FormValues {
  let startDate: DateValue | undefined;
  if (staff.startDate) {
    try {
      const date = new Date(staff.startDate);
      if (!isNaN(date.getTime())) {
        startDate = new CalendarDate(
          date.getFullYear(),
          date.getMonth() + 1,
          date.getDate(),
        );
      }
    } catch {}
  }

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
    practiceAreaIds: staff.practiceAreas.map((pa) => pa.id),
    teamIds: staff.teams.map((t) => t.id),
  };
}

export function EditStaffDialog({ staff, children }: EditStaffDialogProps) {
  const [open, setOpen] = useState(false);

  const practiceAreasQuery = usePublicPracticeAreas();
  const practiceAreas = practiceAreasQuery.data ?? [];
  const teamsQuery = useTeamsList({ limit: 200 });
  const teams = (teamsQuery.data?.data as TeamListDTO[] | undefined) ?? [];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: computeInitialValues(staff),
    mode: "onBlur",
  });

  const updateMutation = useUpdateStaff();

  const onSubmit = (formData: FormValues) => {
    const payload: UpdateStaffPayload = {
      firstName: formData.firstName.trim() || undefined,
      lastName: formData.lastName.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      jobTitle: formData.jobTitle.trim() || undefined,
      email: formData.personalEmail.trim() || undefined,
      orgEmail: formData.orgEmail.trim() || undefined,
      startDate: formData.startDate?.toString(),
      maxCaseload: Number(formData.maxCaseload) || undefined,
      practiceAreaIds:
        formData.practiceAreaIds.length > 0
          ? formData.practiceAreaIds
          : undefined,
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
        if (!details.open) reset(computeInitialValues(staff));
      }}
      placement="center"
    >
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
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

            <Box as="form" p="32px 24px 24px" onSubmit={handleSubmit(onSubmit)}>
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

                <Field.Root invalid={!!errors.practiceAreaIds}>
                  <Field.Label>Practice areas</Field.Label>
                  <Controller
                    name="practiceAreaIds"
                    control={control}
                    render={({ field }) => (
                      <>
                        <Flex wrap="wrap" gap={2}>
                          {practiceAreas.map((pa) => {
                            const isSelected = field.value.includes(pa.id);
                            return (
                              <chakra.label
                                key={pa.id}
                                display="inline-flex"
                                alignItems="center"
                                gap={2}
                                px={3}
                                py={1.5}
                                borderRadius="full"
                                border="1px solid"
                                borderColor={
                                  isSelected ? "brand.solid" : "border"
                                }
                                cursor="pointer"
                                transition="all 0.15s"
                                _hover={{ borderColor: "brand.solid" }}
                              >
                                <chakra.input
                                  type="checkbox"
                                  hidden
                                  checked={isSelected}
                                  onChange={() => {
                                    const next = isSelected
                                      ? field.value.filter((id) => id !== pa.id)
                                      : [...field.value, pa.id];
                                    field.onChange(next);
                                  }}
                                />
                                <Box
                                  w="14px"
                                  h="14px"
                                  borderRadius="sm"
                                  border="1.5px solid"
                                  borderColor={
                                    isSelected ? "brand.solid" : "border"
                                  }
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  flexShrink={0}
                                >
                                  {isSelected && (
                                    <Text
                                      color="brand.solid"
                                      fontSize="10px"
                                      fontWeight="bold"
                                      lineHeight="1"
                                    >
                                      ✓
                                    </Text>
                                  )}
                                </Box>
                                <Text
                                  fontSize="13px"
                                  color="fg"
                                  userSelect="none"
                                >
                                  {pa.name}
                                </Text>
                              </chakra.label>
                            );
                          })}
                        </Flex>
                        {errors.practiceAreaIds && (
                          <Field.ErrorText>
                            {errors.practiceAreaIds.message}
                          </Field.ErrorText>
                        )}
                      </>
                    )}
                  />
                </Field.Root>
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

function TeamMultiSelect({
  teams,
  selectedIds,
  onToggle,
  disabled,
}: {
  teams: TeamListDTO[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");

  const filteredTeams = useMemo(
    () =>
      teams.filter(
        (t) => !search || t.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [teams, search],
  );

  const sortedTeams = useMemo(() => {
    const selected = filteredTeams.filter((t) => selectedIds.includes(t.id));
    const unselected = filteredTeams.filter((t) => !selectedIds.includes(t.id));
    return [...selected, ...unselected];
  }, [filteredTeams, selectedIds]);

  return (
    <Box w="full">
      <Box position="relative">
        <Input
          placeholder="Search teams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
          disabled={disabled}
          opacity={disabled ? 0.5 : 1}
          cursor={disabled ? "not-allowed" : "text"}
        />
      </Box>

      <Box
        maxH="200px"
        overflowY="auto"
        mt={1}
        border="1px solid"
        borderColor="border"
        borderRadius="7px"
        bg="bg"
      >
        {sortedTeams.length > 0 ? (
          <Stack gap="0">
            {sortedTeams.map((team) => (
              <Flex
                key={team.id}
                as={disabled ? "div" : "label"}
                align="center"
                gap="8px"
                px="10px"
                py="7px"
                cursor={disabled ? "default" : "pointer"}
                _hover={disabled ? undefined : { bg: "bg.muted" }}
                borderBottom="1px solid"
                borderColor="border"
                _last={{ borderBottom: "none" }}
                transition="background 0.1s"
                bg={selectedIds.includes(team.id) ? "bg.subtle" : undefined}
              >
                <chakra.input
                  type="checkbox"
                  hidden
                  checked={selectedIds.includes(team.id)}
                  onChange={() => {
                    if (disabled) return;
                    onToggle(team.id);
                  }}
                />
                <Box
                  w="16px"
                  h="16px"
                  borderRadius="sm"
                  border="1.5px solid"
                  borderColor={
                    selectedIds.includes(team.id) ? "brand.solid" : "border"
                  }
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                  bg={
                    selectedIds.includes(team.id)
                      ? "brand.solid"
                      : "transparent"
                  }
                  transition="all 0.1s"
                >
                  {selectedIds.includes(team.id) && (
                    <Text
                      color="white"
                      fontSize="11px"
                      fontWeight="bold"
                      lineHeight="1"
                    >
                      ✓
                    </Text>
                  )}
                </Box>
                <Box flex={1}>
                  <Text fontSize="13px" fontWeight="500" color="fg">
                    {team.name}
                  </Text>
                  {team.leadName && (
                    <Text fontSize="11px" color="fg.muted">
                      Lead: {team.leadName}
                    </Text>
                  )}
                </Box>
                <Text fontSize="11px" color="fg.subtle" whiteSpace="nowrap">
                  {team.memberCount} members
                </Text>
              </Flex>
            ))}
          </Stack>
        ) : (
          <Text p="10px" fontSize="12px" color="fg.muted" textAlign="center">
            {search ? `No teams matching "${search}"` : "No teams available"}
          </Text>
        )}
      </Box>
    </Box>
  );
}

const inputStyles = {
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
