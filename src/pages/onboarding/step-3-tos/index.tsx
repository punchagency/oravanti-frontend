import { useColorMode } from "@/hooks/use-color-mode";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useSubmitOnboardingData } from "@/hooks/use-onboarding";
import { useOnboardingStore } from "@/store/onboarding-store";
import {
  tosAcceptanceSchema,
  type TosAcceptanceInput,
} from "@/types/pages/onboarding/schema";
import {
  Box,
  Button,
  Center,
  Checkbox,
  Field,
  HStack,
  IconButton,
  Image,
  Steps,
  Text,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";

export default function Step3TosPage() {
  const { colorMode, toggleColorMode } = useColorMode();
  const profile = useOnboardingStore((s) => s.profile);
  const firmDetails = useOnboardingStore((s) => s.firmDetails);
  const setTosAccepted = useOnboardingStore((s) => s.setTosAccepted);
  const submitOnboarding = useSubmitOnboardingData();

  const navigate = useNavigate();

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TosAcceptanceInput>({
    resolver: zodResolver(tosAcceptanceSchema),
    defaultValues: {
      accepted: false as unknown as true,
    },
  });

  useDocumentTitle("Terms of service - Oravanti");

  const onSubmit = () => {
    if (!profile || !firmDetails) return;
    const source = useOnboardingStore.getState().source;
    setTosAccepted(true);
    submitOnboarding.mutate({
      accountType: "firm_admin",
      referralSource: source?.referralSource ?? undefined,
      profile,
      firmDetails,
    });
  };

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
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
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
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </IconButton>
      </Box>

      <Center minH="100vh" padding={{ base: 4, sm: 6 }} py={{ base: 8, md: 4 }}>
        <Box
          layerStyle="surface-card"
          p={{ base: 5, md: 10 }}
          w="full"
          maxW="600px"
        >
          <Image
            src="/oravanti_logo.png"
            alt="Oravanti Logo"
            w={10}
            mx="auto"
            mb={2}
          />

          <Box textAlign="center" mb={4}>
            <Box
              display="inline-block"
              bg="brand.muted"
              px="3"
              py="1"
              borderRadius="sm"
              fontSize="xs"
              fontWeight="bold"
              color="brand.fg"
              letterSpacing="0.05em"
            >
              STEP 4 OF 4 &bull; ONBOARDING
            </Box>
          </Box>

          <Steps.Root step={3} count={4} variant="subtle" mb="8">
            <Steps.List>
              {[0, 1, 2, 3].map((i) => (
                <Steps.Item key={i} index={i} title="">
                  <Steps.Separator
                    bg={3 >= i ? "brand.solid" : "border.muted"}
                  />
                </Steps.Item>
              ))}
            </Steps.List>
          </Steps.Root>

          <Text textStyle="heading" color="fg" mb="1" textAlign="left">
            Terms & conditions
          </Text>
          <Text textStyle="subheadline" color="fg.muted" mb="8" textAlign="left">
            Review the legal agreements to finalize your account.
          </Text>

          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack gap="6" align="stretch">
              <Box
                bg="bg.subtle"
                p={5}
                borderRadius="md"
                borderWidth="1px"
                borderColor="border"
                maxH="300px"
                overflowY="auto"
              >
                <Text textStyle="body-sm" color="fg.muted" whiteSpace="pre-line">
                  {`Terms of Service Agreement

1. Acceptance of Terms
By accessing and using the Oravanti platform, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.

2. Firm Representation
You represent that you are authorized to bind your firm to this agreement.

3. Data Privacy
We handle your data in accordance with our Privacy Policy and applicable data protection laws.

4. Service Usage
You agree to use the platform in compliance with all applicable laws and regulations.

5. Limitation of Liability
Oravanti shall not be liable for any indirect, incidental, or consequential damages.

6. Governing Law
This agreement shall be governed by the laws of the State of Delaware.`}
                </Text>
              </Box>

              <Box
                bg="bg.subtle"
                p={5}
                borderRadius="md"
                borderWidth="1px"
                borderColor="border"
              >
                <Text textStyle="label" color="fg" mb={3}>
                  By clicking "Accept & complete", you agree to:
                </Text>
                <VStack
                  gap={2}
                  align="flex-start"
                  textStyle="body-sm"
                  color="fg.muted"
                >
                  <Text>• The Terms of Service above</Text>
                  <Text>• Our Privacy Policy regarding data handling</Text>
                  <Text>• Compliance with applicable legal regulations</Text>
                </VStack>
              </Box>

              <Box
                bg="bg.subtle"
                p={4}
                borderRadius="md"
                borderWidth="1px"
                borderColor="border"
                borderLeftWidth="3px"
                borderLeftColor="brand.solid"
              >
                <Text textStyle="body-sm" color="fg" fontWeight="500" mb={1}>
                  FedRAMP Notice
                </Text>
                <Text textStyle="body-sm" color="fg.muted">
                  Oravanti is secure in accordance with U.S. FedRAMP moderate
                  security baseline requirements. Account details and attorney
                  registries are shielded from unauthorized access.
                </Text>
              </Box>

              <Field.Root invalid={!!errors.accepted}>
                <Controller
                  control={control}
                  name="accepted"
                  render={({ field }) => (
                    <Checkbox.Root
                      checked={field.value}
                      onCheckedChange={({ checked }) =>
                        field.onChange(checked)
                      }
                      onBlur={field.onBlur}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control borderColor="border.input" />
                      <Checkbox.Label textStyle="body-sm" color="fg">
                        I have read and agree to the Terms of Service
                      </Checkbox.Label>
                    </Checkbox.Root>
                  )}
                />
                <Field.ErrorText>{errors.accepted?.message}</Field.ErrorText>
              </Field.Root>

              <HStack gap="4" mt="2" w="full">
                <Button
                  variant="outline"
                  size="lg"
                  h="12"
                  flex="1"
                  color="fg"
                  borderColor="border"
                  _hover={{ bg: "bg.muted" }}
                  onClick={() => navigate("/onboarding/step-2-firm-details")}
                >
                  <ArrowLeft size={16} />
                  Back
                </Button>
                <Button
                  type="submit"
                  loading={submitOnboarding.isPending}
                  layerStyle="brand-button"
                  size="lg"
                  h="12"
                  flex="1"
                >
                  Accept & complete
                </Button>
              </HStack>
            </VStack>
          </form>
        </Box>
      </Center>
    </Box>
  );
}
