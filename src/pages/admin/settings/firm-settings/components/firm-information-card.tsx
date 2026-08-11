import { useFirmProfile, useUpdateFirmProfile } from "@/hooks/use-firm-settings";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { FormSelect } from "@/components/ui/form-select";
import useUnsavedChangesPrompt from "@/hooks/useUnsavedChangesPrompt";
import { US_STATES, getCitiesForState } from "@/data/us-states-cities";
import {
  Box,
  Button,
  Flex,
  Grid,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { dayjs, formatDateTime } from "@/utils/date";
import { listTimezones } from "@/utils/timezones";
import type { FirmProfile } from "@/api/firm-settings";

const TIMEZONES = listTimezones();

const PRACTICE_TYPES = [
  "Full-service law firm",
  "Boutique firm",
  "Solo practice",
  "Legal aid organization",
  "Government agency",
  "Corporate legal department",
];

const STATE_OPTIONS = US_STATES.map((s) => ({ label: s.name, value: s.name }));
const TIMEZONE_OPTIONS = TIMEZONES.map((tz) => ({ label: tz, value: tz }));
const PRACTICE_TYPE_OPTIONS = PRACTICE_TYPES.map((pt) => ({
  label: pt,
  value: pt,
}));

const firmProfileSchema = z.object({
  firmLegalName: z.string().trim().min(1, "Legal name is required"),
  displayName: z.string(),
  tagline: z.string(),
  phone: z.string(),
  email: z
    .string()
    .refine(
      (v) => v === "" || /^\S+@\S+\.\S+$/.test(v),
      "Enter a valid email address",
    ),
  website: z.string(),
  streetAddress: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  timezone: z.string(),
  country: z.string(),
  barNumber: z.string(),
  jurisdiction: z.string(),
  practiceType: z.string(),
  foundedYear: z
    .string()
    .refine(
      (v) =>
        v === "" ||
        (/^\d{4}$/.test(v) && Number(v) >= 1800 && Number(v) <= 2099),
      "Enter a year between 1800–2099",
    ),
});

type FirmProfileForm = z.infer<typeof firmProfileSchema>;

const EMPTY_FORM: FirmProfileForm = {
  firmLegalName: "",
  displayName: "",
  tagline: "",
  phone: "",
  email: "",
  website: "",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  timezone: "UTC",
  country: "United States",
  barNumber: "",
  jurisdiction: "",
  practiceType: "",
  foundedYear: "",
};

function toForm(profile: FirmProfile): FirmProfileForm {
  return {
    firmLegalName: profile.firmLegalName ?? "",
    displayName: profile.displayName ?? "",
    tagline: profile.tagline ?? "",
    phone: profile.phone ?? "",
    email: profile.email ?? "",
    website: profile.website ?? "",
    streetAddress: profile.streetAddress ?? "",
    city: profile.city ?? "",
    state: profile.state ?? "",
    zipCode: profile.zipCode ?? "",
    timezone: profile.timezone ?? "UTC",
    country: profile.country ?? "United States",
    barNumber: profile.barNumber ?? "",
    jurisdiction: profile.jurisdiction ?? "",
    practiceType: profile.practiceType ?? "",
    foundedYear: profile.foundedYear != null ? String(profile.foundedYear) : "",
  };
}

function formatLastSaved(updatedAt: string | null) {
  if (!updatedAt || !dayjs(updatedAt).isValid()) return "Never";
  return formatDateTime(updatedAt);
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Text fontSize="12px" color="red.400" mt="1">
      {message}
    </Text>
  );
}

export function FirmInformationCard() {
  const { data: profile, isLoading } = useFirmProfile();
  const updateProfile = useUpdateFirmProfile();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FirmProfileForm>({
    resolver: zodResolver(firmProfileSchema),
    defaultValues: EMPTY_FORM,
  });

  const selectedState = watch("state");

  const stateCode = useMemo(() => {
    const match = US_STATES.find((s) => s.name === selectedState);
    return match?.code ?? "";
  }, [selectedState]);

  const cityOptions = useMemo(() => {
    return getCitiesForState(stateCode).map((c) => ({ label: c, value: c }));
  }, [stateCode]);

  useEffect(() => {
    if (profile) reset(toForm(profile));
  }, [profile, reset]);

  useUnsavedChangesPrompt({ when: isDirty });

  const onSubmit: SubmitHandler<FirmProfileForm> = (data) => {
    updateProfile.mutate(
      {
        firmLegalName: data.firmLegalName,
        displayName: data.displayName,
        tagline: data.tagline || null,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        streetAddress: data.streetAddress || null,
        city: data.city || null,
        state: data.state || null,
        zipCode: data.zipCode || null,
        timezone: data.timezone,
        country: data.country,
        barNumber: data.barNumber || null,
        jurisdiction: data.jurisdiction || null,
        practiceType: data.practiceType || null,
        foundedYear: data.foundedYear ? Number(data.foundedYear) : null,
      },
      {
        onSuccess: () => reset(data),
      },
    );
  };

  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      bg="bg"
      overflow="hidden"
    >
      <Flex
        align="flex-start"
        justify="space-between"
        gap="4"
        p="20px"
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <Box>
          <Text fontSize="16px" fontWeight="600" color="fg">
            Firm information
          </Text>
          <Text fontSize="13px" color="fg.muted" mt="1">
            Legal entity details and contact info
          </Text>
        </Box>
      </Flex>

      {isLoading ? (
        <Box p="20px">
          <Stack gap="4">
            <Box>
              <ThemeSkeleton h="14px" w="100px" mb="8px" borderRadius="4px" />
              <ThemeSkeleton h="40px" w="full" borderRadius="7px" />
            </Box>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4">
              <Box>
                <ThemeSkeleton h="14px" w="90px" mb="8px" borderRadius="4px" />
                <ThemeSkeleton h="40px" w="full" borderRadius="7px" />
              </Box>
              <Box>
                <ThemeSkeleton h="14px" w="60px" mb="8px" borderRadius="4px" />
                <ThemeSkeleton h="40px" w="full" borderRadius="7px" />
              </Box>
            </Grid>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4">
              <Box>
                <ThemeSkeleton h="14px" w="50px" mb="8px" borderRadius="4px" />
                <ThemeSkeleton h="40px" w="full" borderRadius="7px" />
              </Box>
              <Box>
                <ThemeSkeleton h="14px" w="40px" mb="8px" borderRadius="4px" />
                <ThemeSkeleton h="40px" w="full" borderRadius="7px" />
              </Box>
            </Grid>
            <Box>
              <ThemeSkeleton h="14px" w="60px" mb="8px" borderRadius="4px" />
              <ThemeSkeleton h="40px" w="full" borderRadius="7px" />
            </Box>
            <Box>
              <ThemeSkeleton h="14px" w="110px" mb="8px" borderRadius="4px" />
              <ThemeSkeleton h="40px" w="full" borderRadius="7px" />
            </Box>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap="4">
              <Box>
                <ThemeSkeleton h="14px" w="40px" mb="8px" borderRadius="4px" />
                <ThemeSkeleton h="40px" w="full" borderRadius="7px" />
              </Box>
              <Box>
                <ThemeSkeleton h="14px" w="40px" mb="8px" borderRadius="4px" />
                <ThemeSkeleton h="40px" w="full" borderRadius="7px" />
              </Box>
              <Box>
                <ThemeSkeleton h="14px" w="30px" mb="8px" borderRadius="4px" />
                <ThemeSkeleton h="40px" w="full" borderRadius="7px" />
              </Box>
            </Grid>
          </Stack>
        </Box>
      ) : (
        <Box as="form" p="20px" onSubmit={handleSubmit(onSubmit)}>
          <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
            Firm Legal Name
          </Text>
          <Input
            {...register("firmLegalName")}
            placeholder="e.g. Chen & Associates Law Firm"
            borderColor="border"
            bg="bg.input"
            h="40px"
            fontSize="14px"
            mb="1"
          />
          <FieldError message={errors.firmLegalName?.message} />

          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4" mb="4">
            <Box>
              <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
                Display Name
              </Text>
              <Input
                {...register("displayName")}
                placeholder="e.g. Chen & Associates"
                borderColor="border"
                bg="bg.input"
                h="40px"
                fontSize="14px"
              />
            </Box>
            <Box>
              <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
                Tagline
              </Text>
              <Input
                {...register("tagline")}
                placeholder="e.g. Excellence in Immigration & Family Law"
                borderColor="border"
                bg="bg.input"
                h="40px"
                fontSize="14px"
              />
            </Box>
          </Grid>

          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4" mb="4">
            <Box>
              <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
                Phone
              </Text>
              <Input
                {...register("phone")}
                placeholder="+1 (312) 555-0192"
                borderColor="border"
                bg="bg.input"
                h="40px"
                fontSize="14px"
              />
            </Box>
            <Box>
              <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
                Email
              </Text>
              <Input
                {...register("email")}
                placeholder="hello@chenassociates.com"
                borderColor="border"
                bg="bg.input"
                h="40px"
                fontSize="14px"
                mb="1"
              />
              <FieldError message={errors.email?.message} />
            </Box>
          </Grid>

          <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
            Website
          </Text>
          <Input
            {...register("website")}
            placeholder="www.chenassociates.com"
            borderColor="border"
            bg="bg.input"
            h="40px"
            fontSize="14px"
            mb="4"
          />

          <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
            Street Address
          </Text>
          <Input
            {...register("streetAddress")}
            placeholder="200 W. Madison Street, Suite 2100"
            borderColor="border"
            bg="bg.input"
            h="40px"
            fontSize="14px"
            mb="4"
          />

          <Grid
            templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }}
            gap="4"
            mb="4"
          >
            <Box>
              <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
                State
              </Text>
              <Controller
                control={control}
                name="state"
                render={({ field }) => (
                  <FormSelect
                    options={STATE_OPTIONS}
                    value={field.value}
                    onChange={(val) => {
                      field.onChange(val);
                      setValue("city", "");
                    }}
                    placeholder="Select state"
                    size="sm"
                    invalid={!!errors.state}
                  />
                )}
              />
            </Box>
            <Box>
              <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
                City
              </Text>
              <Controller
                control={control}
                name="city"
                render={({ field }) => (
                  <FormSelect
                    options={cityOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={selectedState ? "Select city" : "Select state first"}
                    size="sm"
                    invalid={!!errors.city}
                    disabled={!selectedState}
                  />
                )}
              />
            </Box>
            <Box>
              <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
                ZIP
              </Text>
              <Input
                {...register("zipCode")}
                placeholder="60606"
                borderColor="border"
                bg="bg.input"
                h="40px"
                fontSize="14px"
              />
            </Box>
          </Grid>

          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4" mb="4">
            <Box>
              <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
                Timezone
              </Text>
              <Controller
                control={control}
                name="timezone"
                render={({ field }) => (
                  <FormSelect
                    options={TIMEZONE_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    size="sm"
                  />
                )}
              />
            </Box>
            <Box>
              <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
                Country
              </Text>
              <Input
                {...register("country")}
                placeholder="United States"
                borderColor="border"
                bg="bg.input"
                h="40px"
                fontSize="14px"
              />
            </Box>
          </Grid>

          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4" mb="4">
            <Box>
              <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
                Bar Number
              </Text>
              <Input
                {...register("barNumber")}
                placeholder="IL-2008-0034721"
                borderColor="border"
                bg="bg.input"
                h="40px"
                fontSize="14px"
              />
            </Box>
            <Box>
              <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
                Jurisdiction
              </Text>
              <Input
                {...register("jurisdiction")}
                placeholder="Illinois"
                borderColor="border"
                bg="bg.input"
                h="40px"
                fontSize="14px"
              />
            </Box>
          </Grid>

          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4">
            <Box>
              <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
                Practice Type
              </Text>
              <Controller
                control={control}
                name="practiceType"
                render={({ field }) => (
                  <FormSelect
                    options={PRACTICE_TYPE_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select type"
                    size="sm"
                  />
                )}
              />
            </Box>
            <Box>
              <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
                Founded (Year)
              </Text>
              <Input
                {...register("foundedYear")}
                placeholder="2008"
                type="number"
                min="1800"
                max="2099"
                borderColor="border"
                bg="bg.input"
                h="40px"
                fontSize="14px"
                mb="1"
              />
              <FieldError message={errors.foundedYear?.message} />
            </Box>
          </Grid>
        </Box>
      )}

      <Flex
        align="center"
        justify="space-between"
        gap="4"
        px="20px"
        py="16px"
        borderTop="1px solid"
        borderColor="border.subtle"
      >
        <Text fontSize="12px" color="fg.muted">
          Last saved: {formatLastSaved(profile?.updatedAt ?? null)}
        </Text>
        <Button
          onClick={handleSubmit(onSubmit)}
          loading={updateProfile.isPending}
          disabled={!isDirty}
          layerStyle="brand-button"
          h="36px"
          px="16px"
          fontSize="13px"
        >
          Save changes
        </Button>
      </Flex>
    </Box>
  );
}
