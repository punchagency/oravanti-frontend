import { useColorMode } from "@/hooks/use-color-mode";
import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  IconButton,
  Link,
  Steps,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink } from "react-router";
import { AccountStep } from "./components/AccountStep";
import { FirmDetailsStep } from "./components/FirmDetailsStep";
import { PaymentStep } from "./components/PaymentStep";
import { PracticeAreasStep } from "./components/PracticeAreasStep";
import { ReviewStep } from "./components/ReviewStep";
import { SuccessStep } from "./components/SuccessStep";

const STEP_FIELDS: Record<number, string[]> = {
  0: ["firmName", "stateOfPractice", "barNumber", "platformTier"],
  1: ["practiceAreas"],
  2: ["firstName", "lastName", "workEmail", "phoneNumber", "password"],
  3: ["termsConsent"],
  4: ["cardholderName", "cardNumber", "expiryDate", "cvv", "billingAddress"],
};

export const FirmSignupFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { colorMode, toggleColorMode } = useColorMode();
  const [_, setRole] = useQueryState("role");

  const {
    register,
    handleSubmit,
    control,
    trigger,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firmName: "",
      stateOfPractice: "",
      barNumber: "",
      platformTier: "complete",
      practiceAreas: [] as string[],
      firstName: "",
      lastName: "",
      workEmail: "",
      phoneNumber: "",
      password: "",
      termsConsent: false,
      cardholderName: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      billingAddress: "",
    },
  });

  const watchedPracticeAreas = watch("practiceAreas");
  const formValues = watch();

  const handleNext = async () => {
    const fieldsToValidate = STEP_FIELDS[currentStep] as any[];
    const isStepValid = await trigger(fieldsToValidate);

    if (isStepValid && currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      return;
    }

    setRole(null);
  };

  const onFinalSubmit = (data: any) => {
    console.log("Form successfully validated & submitted:", data);
    handleNext();
  };

  const inputStyleProps = {
    bg: "bg.input",
    borderWidth: "1px",
    borderColor: "border.input",
    color: "fg",
    borderRadius: "sm",
    _hover: { borderColor: "border.emphasized" },
    _focus: {
      borderColor: "brand.focusRing",
      boxShadow: "0 0 0 1px {colors.brand.400}",
      outline: "none",
    },
  };

  return (
    <Center
      minH="100vh"
      w="100vw"
      bg="bg.subtle"
      py={{ base: 6, md: 12 }}
      px={4}
    >
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

      <Box
        w="full"
        maxW="720px"
        layerStyle="surface-card"
        p={{ base: 5, md: 8 }}
        position="relative"
        bg="bg"
        as="form"
        onSubmit={
          currentStep === 4
            ? handleSubmit(onFinalSubmit)
            : (e) => e.preventDefault()
        }
      >
        {currentStep < 5 && (
          <Steps.Root step={currentStep} count={5} variant="subtle">
            <Flex align="center" justify="space-between" mb="4" pr="10">
              <HStack gap="3">
                <IconButton
                  aria-label="Go back"
                  onClick={handlePrev}
                  variant="ghost"
                  size="sm"
                  color="fg"
                  borderColor="border"
                  borderWidth="1px"
                  bg="bg.input"
                  _hover={{ bg: "bg.subtle" }}
                  type="button"
                >
                  <svg
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    height="1em"
                    width="1em"
                  >
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </IconButton>
                <VStack align="flex-start" gap="0">
                  <Text textStyle="heading" fontSize="lg" color="fg">
                    {currentStep === 0 && "Firm details"}
                    {currentStep === 1 && "Practice areas"}
                    {currentStep === 2 && "Your account"}
                    {currentStep === 3 && "Review"}
                    {currentStep === 4 && "Payment"}
                  </Text>
                  <Text textStyle="body-sm" color="fg.muted">
                    Step {currentStep + 1} of 5
                  </Text>
                </VStack>
              </HStack>
              <Box
                bg="brand.muted"
                px="2.5"
                py="0.5"
                borderRadius="sm"
                fontSize="xs"
                fontWeight="bold"
                color="brand.fg"
              >
                Firm
              </Box>
            </Flex>

            <Steps.List mb="8">
              {[0, 1, 2, 3, 4].map((index) => (
                <Steps.Item key={index} index={index} title="">
                  <Steps.Separator
                    bg={currentStep >= index ? "brand.solid" : "border.muted"}
                  />
                </Steps.Item>
              ))}
            </Steps.List>

            <Box minH="260px" mb="8">
              {currentStep === 0 && (
                <FirmDetailsStep
                  register={register}
                  errors={errors}
                  control={control as any}
                  setValue={setValue}
                  watch={watch}
                  inputStyleProps={inputStyleProps}
                />
              )}

              {currentStep === 1 && (
                <PracticeAreasStep
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  getValues={getValues}
                  watch={watch}
                />
              )}

              {currentStep === 2 && (
                <AccountStep
                  register={register}
                  errors={errors}
                  inputStyleProps={inputStyleProps}
                />
              )}

              {currentStep === 3 && (
                <ReviewStep
                  formValues={formValues}
                  watchedPracticeAreas={watchedPracticeAreas}
                  errors={errors}
                  control={control as any}
                />
              )}

              {currentStep === 4 && (
                <PaymentStep
                  register={register}
                  errors={errors}
                  inputStyleProps={inputStyleProps}
                />
              )}
            </Box>

            <Flex justify="space-between" align="center" mt="4">
              <Box>
                {currentStep > 0 && (
                  <Text
                    textStyle="body-sm"
                    color="fg.muted"
                    cursor="pointer"
                    _hover={{ textDecoration: "underline" }}
                    onClick={handlePrev}
                  >
                    ← Review
                  </Text>
                )}
              </Box>
              <Button
                onClick={currentStep === 4 ? undefined : handleNext}
                type={currentStep === 4 ? "submit" : "button"}
                layerStyle="brand-button"
                px="6"
              >
                {currentStep === 4 ? "Start subscription" : "Continue"}
              </Button>
            </Flex>
          </Steps.Root>
        )}

        {currentStep === 5 && <SuccessStep />}

        <Text textStyle="body-sm" fontWeight="500" as="button" mt="3">
          Already have an account?{" "}
          <Link textDecoration="underline" color="brand.500" asChild>
            <RouterLink to="/login">Log in</RouterLink>
          </Link>
        </Text>
      </Box>
    </Center>
  );
};
