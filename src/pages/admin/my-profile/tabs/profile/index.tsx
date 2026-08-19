import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { useCurrentStaff } from "@/hooks/use-current-staff";
import { useUploadAvatar } from "@/hooks/use-upload-avatar";
import useUnsavedChangesPrompt from "@/hooks/useUnsavedChangesPrompt";
import { useUpdateMyProfile } from "@/hooks/useUpdateMyProfile";
import {
  Box,
  Button,
  Circle,
  Field,
  Fieldset,
  Flex,
  Heading,
  HStack,
  Image,
  Input,
  InputGroup,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone, Save, Upload } from "lucide-react";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  firstName: z.string().min(2, "First name is required").trim(),
  lastName: z.string().min(2, "Last name is required").trim(),
  email: z.string().email("Invalid email address.").trim(),
  phoneNumber: z.string().min(10, "Invalid phone number").trim(),
  barNumber: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const formatRole = (role?: string | null) =>
  role
    ? role
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "—";

function ProfileLoadingSkeleton() {
  return (
    <Box>
      <Flex
        justify="space-between"
        direction={{ base: "column", md: "row" }}
        gap="4"
        mb="10"
      >
        <Box>
          <ThemeSkeleton h="28px" w="200px" mb="8px" borderRadius="4px" />
          <ThemeSkeleton h="14px" w="320px" borderRadius="4px" />
        </Box>
        <ThemeSkeleton h="40px" w="140px" borderRadius="7px" />
      </Flex>
      <Stack gap="4" mb="10">
        <ThemeSkeleton h="14px" w="100px" borderRadius="4px" />
        <HStack gap="6" align="center">
          <ThemeSkeleton h="80px" w="80px" borderRadius="full" />
          <Box>
            <ThemeSkeleton h="34px" w="120px" borderRadius="7px" mb="6px" />
            <ThemeSkeleton h="12px" w="160px" borderRadius="4px" />
          </Box>
        </HStack>
      </Stack>
      <SimpleGrid columns={{ base: 1, md: 2 }} gapX="8" gapY="6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Box key={i}>
            <ThemeSkeleton
              h="13px"
              w={`${70 + (i % 3) * 10}px`}
              mb="8px"
              borderRadius="4px"
            />
            <ThemeSkeleton h="40px" w="full" borderRadius="7px" />
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}

export default function ProfileTab() {
  const { data: staff, isLoading: isStaffLoading } = useCurrentStaff();
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const staffProfile = {
    firstName: staff?.firstName ?? "",
    lastName: staff?.lastName ?? "",
    email: staff?.email ?? staff?.orgEmail ?? "",
    phone: staff?.phone ?? "",
    role: staff?.role ?? "",
    barNumber: staff?.barNumber ?? "",
    avatarUrl: staff?.avatarUrl ?? "",
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: staffProfile.firstName,
      lastName: staffProfile.lastName,
      email: staffProfile.email,
      phoneNumber: staffProfile.phone,
      barNumber: staffProfile.barNumber,
    },
    values: {
      firstName: staffProfile.firstName,
      lastName: staffProfile.lastName,
      email: staffProfile.email,
      phoneNumber: staffProfile.phone,
      barNumber: staffProfile.barNumber,
    },
  });

  const { isPending: isUpdatingProfile, mutate } = useUpdateMyProfile();

  useUnsavedChangesPrompt({ when: isDirty });

  const onSubmit = (data: FormData) => {
    mutate(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phoneNumber,
        email: data.email,
        barNumber: data.barNumber,
      },
      {
        onSuccess: () => {
          reset(data);
        },
      },
    );
  };

  const initials =
    (staffProfile.firstName?.[0] ?? "") + (staffProfile.lastName?.[0] ?? "");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatar.mutate(file);
    }
  };

  if (isStaffLoading && !staff) {
    return <ProfileLoadingSkeleton />;
  }

  return (
    <Box>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Header Section */}
        <Flex
          justify="space-between"
          align="flex-start"
          direction={{ base: "column", md: "row" }}
          gap="4"
          mb="10"
        >
          <VStack align="start" gap="1">
            <Heading size="lg" fontWeight="semibold">
              Profile Information
            </Heading>
            <Text color="fg.muted" fontSize="sm">
              Update your personal details and contact information
            </Text>
          </VStack>
          <Button
            layerStyle="brand-button"
            size="md"
            rounded="md"
            px="6"
            type="submit"
            loading={isUpdatingProfile}
            disabled={!isDirty}
          >
            <Save /> Save Changes
          </Button>
        </Flex>

        {/* Profile Photo Section */}
        <Stack gap="4" mb="10">
          <Text textStyle="label" color="fg">
            Profile Photo
          </Text>
          <HStack gap="6" align="center">
            <Circle
              size="80px"
              bg="brand.solid"
              color="brand.contrast"
              fontSize="2xl"
              fontWeight="bold"
              overflow="hidden"
            >
              {staffProfile.avatarUrl ? (
                <Image
                  src={staffProfile.avatarUrl}
                  alt={`${staffProfile.firstName} ${staffProfile.lastName}`}
                  boxSize="full"
                  objectFit="cover"
                />
              ) : (
                initials || <Upload size={24} />
              )}
            </Circle>
            <VStack align="start" gap="1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/gif,image/webp"
                style={{ display: "none" }}
              />
              <Button
                variant="outline"
                size="sm"
                color="fg"
                onClick={() => fileInputRef.current?.click()}
                loading={uploadAvatar.isPending}
              >
                <Upload /> Upload Photo
              </Button>
              <Text textStyle="body-sm" color="fg.subtle">
                JPG, PNG or GIF (Max 5MB)
              </Text>
            </VStack>
          </HStack>
        </Stack>

        {/* Form Fields Grid */}
        <Fieldset.Root>
          <SimpleGrid columns={{ base: 1, md: 2 }} gapX="8" gapY="6">
            <Fieldset.Content>
              <Field.Root invalid={"firstName" in errors}>
                <Field.Label>
                  First Name
                  <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  placeholder="Olga"
                  borderColor="border"
                  bg="bg.input"
                  h="40px"
                  fontSize="14px"
                  {...register("firstName")}
                />
                <Field.ErrorText>{errors.firstName?.message}</Field.ErrorText>
              </Field.Root>
            </Fieldset.Content>

            <Fieldset.Content>
              <Field.Root invalid={"lastName" in errors}>
                <Field.Label>Last Name</Field.Label>
                <Input
                  placeholder="Kanaris"
                  borderColor="border"
                  bg="bg.input"
                  h="40px"
                  fontSize="14px"
                  {...register("lastName")}
                />
                <Field.ErrorText>{errors.lastName?.message}</Field.ErrorText>
              </Field.Root>
            </Fieldset.Content>

            <Fieldset.Content>
              <Field.Root invalid={"email" in errors}>
                <Field.Label>Email Address</Field.Label>
                <InputGroup
                  startElement={
                    <Box color="fg.subtle">
                      <Mail size={16} />
                    </Box>
                  }
                >
                  <Input
                    placeholder="olga.kanaris@oravanti.com"
                    borderColor="border"
                    bg="bg.input"
                    h="40px"
                    fontSize="14px"
                    {...register("email")}
                  />
                </InputGroup>
                <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
              </Field.Root>
            </Fieldset.Content>

            <Fieldset.Content>
              <Field.Root invalid={"phoneNumber" in errors}>
                <Field.Label>Phone Number</Field.Label>
                <InputGroup
                  startElement={
                    <Box color="fg.subtle">
                      <Phone size={16} />
                    </Box>
                  }
                >
                  <Input
                    placeholder="+1 (555) 123-4567"
                    borderColor="border"
                    bg="bg.input"
                    h="40px"
                    fontSize="14px"
                    {...register("phoneNumber")}
                  />
                </InputGroup>
                <Field.ErrorText>{errors.phoneNumber?.message}</Field.ErrorText>
              </Field.Root>
            </Fieldset.Content>

            <Fieldset.Content>
              <Field.Root>
                <Field.Label>Role</Field.Label>
                <Input
                  value={formatRole(staffProfile.role)}
                  borderColor="border"
                  bg="bg.input"
                  h="40px"
                  fontSize="14px"
                  readOnly
                />
                <Field.HelperText>
                  Managed by your organization admin
                </Field.HelperText>
              </Field.Root>
            </Fieldset.Content>

            <Fieldset.Content>
              <Field.Root invalid={"barNumber" in errors}>
                <Field.Label>Bar Number</Field.Label>
                <Input
                  placeholder="BA123456"
                  borderColor="border"
                  bg="bg.input"
                  h="40px"
                  fontSize="14px"
                  {...register("barNumber")}
                />
                <Field.ErrorText>{errors.barNumber?.message}</Field.ErrorText>
              </Field.Root>
            </Fieldset.Content>
          </SimpleGrid>
        </Fieldset.Root>
      </form>
    </Box>
  );
}
