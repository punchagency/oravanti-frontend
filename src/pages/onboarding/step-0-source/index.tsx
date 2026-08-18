import { useColorMode } from "@/hooks/use-color-mode";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useOnboardingStore } from "@/store/onboarding-store";
import {
  referralSourceSchema,
  type ReferralSourceInput,
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
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

const platforms = [
  {
    id: "docketwise",
    name: "Docketwise",
    description: "I'm coming from Docketwise",
  },
  {
    id: "lawfully",
    name: "Lawfully",
    description: "I'm coming from Lawfully",
  },
  {
    id: "other",
    name: "Other",
    description: "I'm coming from another platform or none",
  },
];

export default function Step0SourcePage() {
  const { colorMode, toggleColorMode } = useColorMode();
  const savedSource = useOnboardingStore((s) => s.source);
  const setSource = useOnboardingStore((s) => s.setSource);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReferralSourceInput>({
    resolver: zodResolver(referralSourceSchema),
    defaultValues: {
      referralSource: savedSource?.referralSource ?? "",
      otherSource: "",
    },
  });

  const selected = watch("referralSource");

  useDocumentTitle("Where are you coming from? - Oravanti");

  const onSubmit = (data: ReferralSourceInput) => {
    const value =
      data.referralSource === "other" && data.otherSource?.trim()
        ? data.otherSource.trim()
        : data.referralSource;
    setSource({ referralSource: value });
    navigate("/onboarding/step-1-profile");
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
              STEP 1 OF 4 &bull; ONBOARDING
            </Box>
          </Box>

          <Steps.Root step={0} count={4} variant="subtle" mb="8">
            <Steps.List>
              {[0, 1, 2, 3].map((i) => (
                <Steps.Item key={i} index={i} title="">
                  <Steps.Separator
                    bg={0 >= i ? "brand.solid" : "border.muted"}
                  />
                </Steps.Item>
              ))}
            </Steps.List>
          </Steps.Root>

          <Text textStyle="heading" color="fg" mb="1" textAlign="left">
            Where are you coming from?
          </Text>
          <Text textStyle="subheadline" color="fg.muted" mb="8" textAlign="left">
            Help us understand your background so we can tailor your experience.
          </Text>

          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack gap="4" align="stretch">
              <Field.Root invalid={!!errors.referralSource}>
                {platforms.map((platform) => {
                  const isSelected = selected === platform.id;
                  return (
                    // Must be a real Button, not `Box as="button"`: a bare
                    // <button> in a <form> defaults to type="submit", so
                    // picking a platform submitted the form and jumped to the
                    // next step. Button sets type="button" for us.
                    <Button
                      key={platform.id}
                      aria-pressed={isSelected}
                      onClick={() => setValue("referralSource", platform.id, { shouldValidate: true })}
                      variant="outline"
                      w="full"
                      h="auto"
                      display="block"
                      textAlign="left"
                      whiteSpace="normal"
                      p={4}
                      borderRadius="md"
                      border="1.5px solid"
                      borderColor={isSelected ? "brand.solid" : "border.muted"}
                      bg="bg"
                      _hover={{
                        bg: "bg",
                        borderColor: isSelected ? "brand.solid" : "border.emphasized",
                      }}
                      transition="all 0.15s"
                    >
                      <Text
                        fontSize="15px"
                        fontWeight="600"
                        color="fg.default"
                      >
                        {platform.name}
                      </Text>
                      <Text
                        fontSize="13px"
                        color="fg.muted"
                        mt="2px"
                      >
                        {platform.description}
                      </Text>
                    </Button>
                  );
                })}
                <Field.ErrorText>{errors.referralSource?.message}</Field.ErrorText>
              </Field.Root>

              {selected === "other" && (
                <Field.Root invalid={!!errors.otherSource}>
                  <Input
                    bg="bg.input"
                    borderColor="border.input"
                    focusRingColor="brand.focusRing"
                    placeholder="Tell us where you're coming from (optional)"
                    size="lg"
                    {...register("otherSource")}
                  />
                  <Field.ErrorText>{errors.otherSource?.message}</Field.ErrorText>
                </Field.Root>
              )}

              <HStack gap="4" mt="4" w="full" justify="flex-end">
                <Button
                  type="submit"
                  layerStyle="brand-button"
                  size="lg"
                  h="12"
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
