import { getSession } from "@/api/auth";
import { getNeedsSetup } from "@/api/organization";
import { useColorMode } from "@/hooks/use-color-mode";
import { useBackupCodeVerification } from "@/hooks/useBackupCodeVerification";
import { useTOTPVerification } from "@/hooks/useTOTPVerification";
import { useAuthStore } from "@/store/auth-store";
import type { AuthSession, MemberRole, SessionUser } from "@/types/auth";
import {
  Box,
  Button,
  Center,
  Field,
  IconButton,
  Image,
  Input,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

const totpSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, "Enter the 6-digit code from your authenticator app"),
});

const backupSchema = z.object({
  code: z.string().trim().min(1, "Enter a backup code"),
});

type TotpFormData = z.infer<typeof totpSchema>;
type BackupFormData = z.infer<typeof backupSchema>;

const TwoFactorVerification = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { colorMode, toggleColorMode } = useColorMode();

  const handleVerified = async () => {
    try {
      const sessionData: {
        user: SessionUser;
        session: AuthSession;
        memberRole?: MemberRole | null;
        firmTimezone?: string | null;
        portalStatus?: string | null;
      } = await queryClient.fetchQuery({
        queryKey: ["session"],
        queryFn: async () => {
          const response = await getSession();
          return response.data;
        },
      });

      const needsSetup = await getNeedsSetup();

      useAuthStore.getState().setAuth({
        user: sessionData?.user ?? null,
        session: sessionData?.session ?? null,
        memberRole: sessionData?.memberRole ?? null,
        firmTimezone: sessionData?.firmTimezone ?? null,
        portalStatus: sessionData?.portalStatus ?? null,
        isAuthenticated: !!sessionData?.session,
        isLoading: false,
        refetch: () => queryClient.refetchQueries({ queryKey: ["session"] }),
        needsAcceptInvitation: needsSetup.needsAcceptInvitation,
        needsPasswordChange: needsSetup.needsPasswordChange,
        twoFactorPending: false,
      });

      if (needsSetup.needsAcceptInvitation) {
        navigate("/accept-invitation", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch {
      toast.error("Unable to complete sign in. Please try again.");
    }
  };

  const { mutate: verifyTotp, isPending: isVerifyingTotp } =
    useTOTPVerification({
      onSuccess: handleVerified,
    });
  const { mutate: verifyBackupCode, isPending: isVerifyingBackupCode } =
    useBackupCodeVerification({
      onSuccess: handleVerified,
    });

  const totpForm = useForm<TotpFormData>({
    resolver: zodResolver(totpSchema),
    defaultValues: { code: "" },
    mode: "onSubmit",
  });

  const backupForm = useForm<BackupFormData>({
    resolver: zodResolver(backupSchema),
    defaultValues: { code: "" },
    mode: "onSubmit",
  });

  return (
    <Box minH="100vh" bg="bg.subtle" position="relative">
      <Box position="absolute" top="4" right="4" zIndex="sticky">
        <IconButton
          onClick={toggleColorMode}
          variant="ghost"
          aria-label="Toggle color mode"
          borderRadius="full"
          color="fg.muted"
          _hover={{ bg: "bg.muted", color: "fg" }}
        >
          {colorMode === "light" ? (
            <svg
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              height="1.2em"
              width="1.2em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          ) : (
            <svg
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              height="1.2em"
              width="1.2em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          )}
        </IconButton>
      </Box>

      <Center minH="100vh" padding={{ base: 4, sm: 6 }} py={{ base: 8, md: 4 }}>
        <Box
          layerStyle="surface-card"
          p={{ base: 4, sm: 6, md: 10 }}
          w="full"
          maxW="540px"
          textAlign="center"
        >
          <Image
            src="/oravanti_logo.png"
            alt="Oravanti Logo"
            w={10}
            mx="auto"
            mb={4}
          />

          <Text textStyle="heading" color="fg" mb="1">
            Two-factor authentication
          </Text>
          <Text textStyle="subheadline" color="fg.muted" mb="8">
            Enter a code to finish signing in
          </Text>

          <Tabs.Root
            defaultValue="authenticator"
            variant="enclosed"
            size="sm"
            w="full"
          >
            <Tabs.List justifyContent="center" mb={6} flexWrap="wrap">
              <Tabs.Trigger value="authenticator">
                Authenticator code
              </Tabs.Trigger>
              <Tabs.Trigger value="backup">Backup code</Tabs.Trigger>
              <Tabs.Indicator />
            </Tabs.List>

            <Tabs.Content value="authenticator">
              <form
                onSubmit={totpForm.handleSubmit((data) => verifyTotp(data))}
              >
                <VStack gap="5" align="stretch">
                  <Field.Root
                    invalid={!!totpForm.formState.errors.code}
                    textAlign="left"
                  >
                    <Field.Label textStyle="label" color="fg.muted">
                      Authenticator code
                    </Field.Label>
                    <Input
                      placeholder="123456"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={8}
                      bg="bg.input"
                      borderColor="border.input"
                      focusRingColor="brand.focusRing"
                      size="lg"
                      {...totpForm.register("code")}
                    />
                    <Field.ErrorText>
                      {totpForm.formState.errors.code?.message}
                    </Field.ErrorText>
                  </Field.Root>

                  <Button
                    type="submit"
                    loading={isVerifyingTotp}
                    layerStyle="brand-button"
                    size="lg"
                    w="full"
                    h="12"
                  >
                    Verify code
                  </Button>
                </VStack>
              </form>
            </Tabs.Content>

            <Tabs.Content value="backup">
              <form
                onSubmit={backupForm.handleSubmit((data) =>
                  verifyBackupCode(data),
                )}
              >
                <VStack gap="5" align="stretch">
                  <Field.Root
                    invalid={!!backupForm.formState.errors.code}
                    textAlign="left"
                  >
                    <Field.Label textStyle="label" color="fg.muted">
                      Backup code
                    </Field.Label>
                    <Input
                      placeholder="XXXX-XXXX"
                      autoComplete="one-time-code"
                      bg="bg.input"
                      borderColor="border.input"
                      focusRingColor="brand.focusRing"
                      size="lg"
                      {...backupForm.register("code")}
                    />
                    <Field.ErrorText>
                      {backupForm.formState.errors.code?.message}
                    </Field.ErrorText>
                  </Field.Root>

                  <Text textStyle="body-sm" color="fg.muted">
                    Use one of your single-use backup codes.
                  </Text>

                  <Button
                    type="submit"
                    loading={isVerifyingBackupCode}
                    layerStyle="brand-button"
                    size="lg"
                    w="full"
                    h="12"
                  >
                    Verify backup code
                  </Button>
                </VStack>
              </form>
            </Tabs.Content>
          </Tabs.Root>
        </Box>
      </Center>
    </Box>
  );
};

export default TwoFactorVerification;
