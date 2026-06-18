import type { InviteStaffPayload } from "@/api/organization";
import { BrandButton } from "@/components/ui/intake-ui";
import { useInviteStaff } from "@/hooks/use-invite-staff";
import { usePublicPracticeAreas } from "@/hooks/use-public-practice-areas";
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
  Text,
  VStack,
} from "@chakra-ui/react";
import type { DateValue } from "@internationalized/date";
import { CalendarDays, UserPlus, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  orgEmail: string;
  phone: string;
  role: string;
  team: string;
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

const dummyTeamOptions = createListCollection({
  items: [
    { value: "", label: "Select team" },
    { value: "Immigration Team A", label: "Immigration Team A" },
    { value: "Family & Estate Team", label: "Family & Estate Team" },
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
      team: "",
      startDate: undefined,
      maxCaseload: "7",
      practiceAreaIds: [],
    },
    mode: "onBlur",
  });

  const practiceAreasQuery = usePublicPracticeAreas();
  const practiceAreas = practiceAreasQuery.data ?? [];

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
                    sm: "repeat(3, minmax(0, 1fr))",
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

                  <Field.Root>
                    <Field.Label>Assign Team</Field.Label>
                    <Controller
                      name="team"
                      control={control}
                      render={({ field }) => (
                        <Select.Root
                          collection={dummyTeamOptions}
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
                                {dummyTeamOptions.items.map((opt) => (
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
