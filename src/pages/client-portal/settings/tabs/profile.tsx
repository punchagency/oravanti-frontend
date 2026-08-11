import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { useCurrentClient } from "@/hooks/use-current-client";
import { useUpdateClientProfile } from "@/hooks/useUpdateClientProfile";
import { useUploadClientAvatar } from "@/hooks/use-upload-client-avatar";
import useUnsavedChangesPrompt from "@/hooks/useUnsavedChangesPrompt";
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
  phone: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || v.length >= 10, "Invalid phone number"),
});

type FormData = z.infer<typeof schema>;

function ProfileLoadingSkeleton() {
  return (
    <Box>
      <Flex justify="space-between" align="center" mb="8">
        <Box>
          <ThemeSkeleton h="22px" w="160px" borderRadius="4px" mb="2" />
          <ThemeSkeleton h="14px" w="220px" borderRadius="4px" />
        </Box>
        <ThemeSkeleton h="36px" w="100px" borderRadius="6px" />
      </Flex>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
        {Array.from({ length: 4 }, (_, i) => (
          <Box key={i}>
            <ThemeSkeleton h="12px" w="80px" borderRadius="4px" mb="2" />
            <ThemeSkeleton h="36px" w="100%" borderRadius="6px" />
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}

export default function ClientProfileTab() {
  const { data: client, isLoading } = useCurrentClient();
  const uploadAvatar = useUploadClientAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: client
      ? {
          firstName: client.firstName ?? "",
          lastName: client.lastName ?? "",
          email: client.email ?? "",
          phone: client.phone ?? "",
        }
      : undefined,
  });

  const { isPending: isUpdatingProfile, mutate } = useUpdateClientProfile();

  useUnsavedChangesPrompt({ when: isDirty });

  if (isLoading) return <ProfileLoadingSkeleton />;
  if (!client) return null;

  const onSubmit = (data: FormData) => {
    mutate(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone?.trim() || null,
      },
      {
        onSuccess: () => {
          reset(data);
        },
      },
    );
  };

  const initials =
    (client.firstName?.[0] ?? "") + (client.lastName?.[0] ?? "");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatar.mutate(file);
    }
  };

  return (
    <Box>
      <form onSubmit={handleSubmit(onSubmit)}>
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
              color="brand.fg"
              fontSize="2xl"
              fontWeight="bold"
              overflow="hidden"
            >
              {client.avatarUrl ? (
                <Image
                  src={client.avatarUrl}
                  alt={`${client.firstName} ${client.lastName}`}
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

        <Fieldset.Root>
          <SimpleGrid columns={{ base: 1, md: 2 }} gapX="8" gapY="6">
            <Fieldset.Content>
              <Field.Root invalid={"firstName" in errors}>
                <Field.Label>
                  First Name
                  <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  placeholder="John"
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
                <Field.Label>
                  Last Name
                  <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  placeholder="Doe"
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
                    placeholder="john.doe@example.com"
                    borderColor="border"
                    bg="bg.input"
                    h="40px"
                    fontSize="14px"
                    type="email"
                    readOnly
                    {...register("email")}
                  />
                </InputGroup>
                <Field.HelperText fontSize="11px" color="fg.subtle">
                  Managed by your firm
                </Field.HelperText>
                <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
              </Field.Root>
            </Fieldset.Content>

            <Fieldset.Content>
              <Field.Root invalid={"phone" in errors}>
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
                    {...register("phone")}
                  />
                </InputGroup>
                <Field.HelperText fontSize="11px" color="fg.subtle">
                  Optional
                </Field.HelperText>
                <Field.ErrorText>{errors.phone?.message}</Field.ErrorText>
              </Field.Root>
            </Fieldset.Content>
          </SimpleGrid>

          <HStack gap="6" mt="8">
            <Field.Root>
              <Field.Label>Entity Type</Field.Label>
              <Input
                value={client.entityType}
                disabled
                bg="bg.subtle"
                textTransform="capitalize"
                w="200px"
              />
              <Field.HelperText fontSize="11px" color="fg.subtle">
                Managed by your firm
              </Field.HelperText>
            </Field.Root>

            <Field.Root>
              <Field.Label>Status</Field.Label>
              <Input
                value={client.status}
                disabled
                bg="bg.subtle"
                textTransform="capitalize"
                w="200px"
              />
              <Field.HelperText fontSize="11px" color="fg.subtle">
                Managed by your firm
              </Field.HelperText>
            </Field.Root>
          </HStack>
        </Fieldset.Root>
      </form>
    </Box>
  );
}
