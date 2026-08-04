import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { useRevokeSession } from "@/hooks/useRevokeSession";
import useUnsavedChangesPrompt from "@/hooks/useUnsavedChangesPrompt";
import { useUpdatePassword } from "@/hooks/useUpdatePassword";
import { useUserSessions } from "@/hooks/useUserSessions";
import { useAuthStore } from "@/store/auth-store";
import {
  Badge,
  Box,
  Button,
  Field,
  Fieldset,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  Separator,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { Eye, EyeOff, Lock, Monitor, Smartphone } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ManageTwoFactorAuthentication from "./manage-2fa";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

type FormData = z.infer<typeof schema>;

function SessionsLoadingSkeleton() {
  return (
    <Stack gap="3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Flex
          key={i}
          p="4"
          rounded="md"
          justify="space-between"
          align="center"
          direction={{ base: "column", sm: "row" }}
          gap="4"
          borderWidth="1px"
          borderColor="border"
        >
          <HStack gap="4" width="full">
            <ThemeSkeleton boxSize="20px" borderRadius="6px" />
            <VStack align="start" gap="2">
              <ThemeSkeleton
                h="14px"
                w={{ base: "60%", md: "220px" }}
                borderRadius="4px"
              />
              <ThemeSkeleton
                h="11px"
                w={{ base: "45%", md: "160px" }}
                borderRadius="4px"
              />
            </VStack>
          </HStack>
          <ThemeSkeleton
            h="28px"
            w="72px"
            borderRadius="7px"
            alignSelf={{ base: "flex-end", sm: "center" }}
          />
        </Flex>
      ))}
    </Stack>
  );
}

export default function SecurityTab() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [revokingToken, setRevokingToken] = useState<string | null>(null);

  const { isPending: isUpdatingPassword, mutate } = useUpdatePassword();
  const { isPending: isRevokingSession, mutate: revokeSession } =
    useRevokeSession();
  const userSessionsQuery = useUserSessions();
  const sessionData = userSessionsQuery?.data?.data ?? [];

  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const currentSessionId = session?.id;
  const isEnabled = user?.twoFactorEnabled;

  const sessions = sessionData ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
    mode: "onSubmit",
  });

  useUnsavedChangesPrompt({ when: isDirty });

  const onSubmit = (data: FormData) => {
    mutate(data, {
      onSuccess: () => {
        reset();
      },
    });
  };

  return (
    <Box>
      {/* Header */}
      <VStack align="start" gap="1">
        <Heading size="lg" fontWeight="semibold">
          Security Settings
        </Heading>
        <Text color="fg.muted" fontSize="sm">
          Manage your password and authentication methods
        </Text>
      </VStack>

      <Stack gap="10" mt={8}>
        {/* Change Password Section */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Fieldset.Root>
            <Fieldset.Legend fontSize="md" fontWeight="semibold">
              Change Password
            </Fieldset.Legend>
            <Fieldset.Content>
              <VStack gap="4" width="full" maxW={{ md: "md" }} align="start">
                <Field.Root invalid={"currentPassword" in errors}>
                  <Field.Label>
                    Current password
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <InputGroup
                    startElement={<Lock size={16} color="gray" />}
                    endElement={
                      <IconButton
                        variant="plain"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        aria-label="Toggle current password visibility"
                      >
                        {showCurrentPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </IconButton>
                    }
                  >
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      borderColor="border"
                      bg="bg.input"
                      h="40px"
                      fontSize="14px"
                      {...register("currentPassword")}
                    />
                  </InputGroup>
                  <Field.ErrorText>
                    {errors.currentPassword?.message}
                  </Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={"newPassword" in errors}>
                  <Field.Label>
                    New password
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <InputGroup
                    startElement={<Lock size={16} color="gray" />}
                    endElement={
                      <IconButton
                        variant="plain"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label="Toggle new password visibility"
                      >
                        {showNewPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </IconButton>
                    }
                  >
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      borderColor="border"
                      bg="bg.input"
                      h="40px"
                      fontSize="14px"
                      {...register("newPassword")}
                    />
                  </InputGroup>
                  <Field.ErrorText>
                    {errors.newPassword?.message}
                  </Field.ErrorText>
                </Field.Root>

                <Button
                  layerStyle="brand-button"
                  size="md"
                  mt="2"
                  width={{ base: "full", md: "auto" }}
                  type="submit"
                  loading={isUpdatingPassword}
                  disabled={!isDirty}
                >
                  Update Password
                </Button>
              </VStack>
            </Fieldset.Content>
          </Fieldset.Root>
        </form>

        <Separator />

        {/* 2FA Section */}
        <Flex
          justify="space-between"
          align={{ base: "start", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap="4"
        >
          <VStack align="start" gap="1">
            <HStack>
              <Text fontWeight="semibold">Two-Factor Authentication</Text>
              <Badge
                colorPalette={isEnabled ? "green" : "red"}
                variant="subtle"
                size="sm"
              >
                {isEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </HStack>
            <Text color="fg.muted" fontSize="sm">
              Add an extra layer of security to your account
            </Text>
          </VStack>
          <ManageTwoFactorAuthentication />
        </Flex>

        <Separator />

        {/* Active Sessions Section */}
        <Box>
          <Text fontWeight="semibold" mb="4">
            Active Sessions
          </Text>
          <Stack gap="3">
            {userSessionsQuery.isLoading ? (
              <SessionsLoadingSkeleton />
            ) : sessions.length === 0 ? (
              <Text color="fg.muted">No active sessions found.</Text>
            ) : (
              sessions.map((s) => {
              const id = s.id ?? null;
              const token = s.token ?? null;
              const userAgent = s.userAgent ?? "Unknown device";
              const ip = s.ipAddress ?? null;
              const time = s.createdAt ?? null;
              const isCurrent =
                id && currentSessionId && id === currentSessionId;
              const isRevoking = isRevokingSession && revokingToken === token;
              const isMobile = /mobile|iphone|ipad|android/i.test(userAgent);

              return (
                <Flex
                  key={id ?? userAgent}
                  p="4"
                  rounded="md"
                  justify="space-between"
                  align="center"
                  direction={{ base: "column", sm: "row" }}
                  gap="4"
                  borderWidth="1px"
                  borderColor="border"
                >
                  <HStack gap="4" width="full">
                    {isMobile ? (
                      <Smartphone size={20} />
                    ) : (
                      <Monitor size={20} />
                    )}
                    <VStack align="start" gap="0">
                      <Text fontWeight="medium" fontSize="sm">
                        {userAgent}
                      </Text>
                      <Text fontSize="xs" color="fg.subtle">
                        {ip ? `${ip} • ` : ""}
                        {isCurrent
                          ? "Current session"
                          : dayjs(time).format("YYYY-MM-DD HH:mm:ss")}
                      </Text>
                    </VStack>
                  </HStack>
                  <Button
                    variant="ghost"
                    colorPalette="red"
                    size="xs"
                    alignSelf={{ base: "flex-end", sm: "center" }}
                    disabled={isCurrent || !token || isRevokingSession}
                    loading={Boolean(isRevoking)}
                    onClick={() => {
                      if (!token || isCurrent) return;
                      setRevokingToken(token);
                      revokeSession(
                        { token },
                        {
                          onSettled: () => setRevokingToken(null),
                        },
                      );
                    }}
                  >
                    Revoke
                  </Button>
                </Flex>
              );
            })
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
