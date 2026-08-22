import { useColorMode } from "@/hooks/use-color-mode";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useAuthStore } from "@/store/auth-store";
import { useOnboardingStore } from "@/store/onboarding-store";
import {
  personalDetailsSchema,
  type PersonalDetailsInput,
} from "@/types/pages/onboarding/schema";
import {
  Box,
  Button,
  Center,
  Field,
  HStack,
  IconButton,
  Image,
  Input,
  Steps,
  Text,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";

export default function Step1ProfilePage() {
  const { colorMode, toggleColorMode } = useColorMode();
  const userEmail = useAuthStore((s) => s.user?.email ?? "");
  const fullName = useAuthStore((s) => s.user?.name ?? "");
  const [firstName, lastName] = fullName.split(" ");
  const savedProfile = useOnboardingStore((s) => s.profile);
  const setProfile = useOnboardingStore((s) => s.setProfile);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalDetailsInput>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      firstName: savedProfile?.firstName ?? firstName ?? "",
      lastName: savedProfile?.lastName ?? lastName ?? "",
      phone: savedProfile?.phone ?? "",
      jobTitle: savedProfile?.jobTitle ?? "",
    },
    mode: "onChange",
  });

  useDocumentTitle("Profile setup - Oravanti");

  const onSubmit: SubmitHandler<PersonalDetailsInput> = (data) => {
    setProfile({
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      jobTitle: data.jobTitle || undefined,
    });
    navigate("/onboarding/step-2-firm-details");
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
              color="brand.contrast"
              letterSpacing="0.05em"
            >
              STEP 2 OF 4 &bull; ONBOARDING
            </Box>
          </Box>

          <Steps.Root step={1} count={4} variant="subtle" mb="8">
            <Steps.List>
              {[0, 1, 2, 3].map((i) => (
                <Steps.Item key={i} index={i} title="">
                  <Steps.Separator
                    bg={1 >= i ? "brand.solid" : "border.muted"}
                  />
                </Steps.Item>
              ))}
            </Steps.List>
          </Steps.Root>

          <Text textStyle="heading" color="fg" mb="1" textAlign="left">
            Set up your profile
          </Text>
          <Text
            textStyle="subheadline"
            color="fg.muted"
            mb="8"
            textAlign="left"
          >
            Tell us about yourself.
          </Text>

          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack gap="5" align="stretch">
              <Field.Root textAlign="left">
                <Field.Label textStyle="label" color="fg.muted">
                  Email
                </Field.Label>
                <Input
                  id="email"
                  bg="bg.input"
                  borderColor="border.input"
                  value={userEmail}
                  size="lg"
                  readOnly
                  cursor="not-allowed"
                  opacity={0.7}
                />
              </Field.Root>

              <Field.Root invalid={!!errors.firstName} textAlign="left">
                <Field.Label textStyle="label" color="fg.muted">
                  First name
                </Field.Label>
                <Input
                  id="firstName"
                  bg="bg.input"
                  borderColor="border.input"
                  focusRingColor="brand.focusRing"
                  placeholder="John"
                  size="lg"
                  {...register("firstName")}
                />
                <Field.ErrorText>{errors.firstName?.message}</Field.ErrorText>
              </Field.Root>

              <Field.Root invalid={!!errors.lastName} textAlign="left">
                <Field.Label textStyle="label" color="fg.muted">
                  Last name
                </Field.Label>
                <Input
                  id="lastName"
                  bg="bg.input"
                  borderColor="border.input"
                  focusRingColor="brand.focusRing"
                  placeholder="Doe"
                  size="lg"
                  {...register("lastName")}
                />
                <Field.ErrorText>{errors.lastName?.message}</Field.ErrorText>
              </Field.Root>

              <Field.Root invalid={!!errors.phone} textAlign="left">
                <Field.Label textStyle="label" color="fg.muted">
                  Phone number
                </Field.Label>
                <Input
                  id="phone"
                  type="tel"
                  bg="bg.input"
                  borderColor="border.input"
                  focusRingColor="brand.focusRing"
                  placeholder="+1 (555) 123-4567"
                  size="lg"
                  {...register("phone")}
                />
                <Field.ErrorText>{errors.phone?.message}</Field.ErrorText>
              </Field.Root>

              <Field.Root invalid={!!errors.jobTitle} textAlign="left">
                <Field.Label textStyle="label" color="fg.muted">
                  Job title (optional)
                </Field.Label>
                <Input
                  id="jobTitle"
                  bg="bg.input"
                  borderColor="border.input"
                  focusRingColor="brand.focusRing"
                  placeholder="e.g. Managing Partner"
                  size="lg"
                  {...register("jobTitle")}
                />
                <Field.ErrorText>{errors.jobTitle?.message}</Field.ErrorText>
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
                  onClick={() => navigate("/onboarding/step-0-source")}
                >
                  <ArrowLeft size={16} />
                  Back
                </Button>
                <Button
                  type="submit"
                  layerStyle="brand-button"
                  size="lg"
                  h="12"
                  flex="1"
                >
                  Continue
                </Button>
              </HStack>
            </VStack>
          </form>
        </Box>
      </Center>
    </Box>
  );
}
