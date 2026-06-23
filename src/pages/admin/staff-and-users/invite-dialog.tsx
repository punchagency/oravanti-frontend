import type { InviteStaffPayload, TeamListDTO } from "@/api/organization";
import { BrandButton } from "@/components/ui/intake-ui";
import { useInviteStaff } from "@/hooks/use-invite-staff";
import { usePublicPracticeAreas } from "@/hooks/use-public-practice-areas";
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
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import type { DateValue } from "@internationalized/date";
import { CalendarDays, UserPlus, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";

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
  practiceAreaIds: string[];
}

const roleOptions = createListCollection({
  items: [
    { value: "", label: "Select role" },
    { value: "attorney", label: "Attorney" },
    { value: "admin", label: "Admin" },
    { value: "paralegal", label: "Paralegal" },
  ],
});

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

export function InviteStaffDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      firstName: "Samuel",
      lastName: "Adekoya",
      email: "samueladexx@gmail.com",
      orgEmail: "samueladexx@gmail.com",
      phone: "+2347060405558",
      role: "admin",
      teamIds: [],
      startDate: undefined,
      maxCaseload: "7",
      practiceAreaIds: [],
    },
    mode: "onBlur",
  });

  const practiceAreasQuery = usePublicPracticeAreas();
  const practiceAreas = practiceAreasQuery.data ?? [];
  const teamsQuery = useTeamsList({ limit: 200 });
  const teams = (teamsQuery.data?.data as TeamListDTO[] | undefined) ?? [];

  const inviteMutation = useInviteStaff();

  const onSubmit = (formData: FormValues) => {
    const payload: InviteStaffPayload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      orgEmail: formData.orgEmail.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      role: formData.role,
      startDate: formData.startDate?.toString(),
      maxCaseload: Number(formData.maxCaseload) || undefined,
      practiceAreaIds:
        formData.practiceAreaIds.length > 0
          ? formData.practiceAreaIds
          : undefined,
      teamIds: formData.teamIds.length > 0 ? formData.teamIds : undefined,
    };

    inviteMutation.mutate(payload, {
      onSuccess: () => {
        reset();
        setOpen(false);
      },
    });
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        setOpen(details.open);
        if (!details.open) reset();
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

            <Box as="form" p="32px 24px 24px" onSubmit={handleSubmit(onSubmit)}>
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
                    rules={{ required: "Start date is required" }}
                    render={({ field }) => (
                      <DatePicker.Root
                        value={field.value ? [field.value] : []}
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

                <Field.Root invalid={!!errors.practiceAreaIds}>
                  <Field.Label>
                    Practice areas (staff can handle)
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Controller
                    name="practiceAreaIds"
                    control={control}
                    rules={{
                      validate: (val) =>
                        val.length > 0 || "Select at least one practice area",
                    }}
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

function TeamMultiSelect({
  teams,
  selectedIds,
  onToggle,
}: {
  teams: TeamListDTO[];
  selectedIds: string[];
  onToggle: (id: string) => void;
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
                as="label"
                align="center"
                gap="8px"
                px="10px"
                py="7px"
                cursor="pointer"
                _hover={{ bg: "bg.muted" }}
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
                  onChange={() => onToggle(team.id)}
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
