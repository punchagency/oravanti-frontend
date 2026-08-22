import { useColorMode } from "@/hooks/use-color-mode";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useOnboardingStore } from "@/store/onboarding-store";
import { US_STATES, getCitiesForState } from "@/data/us-states-cities";
import {
  firmInformationSchema,
  type FirmInformationInput,
} from "@/types/pages/onboarding/schema";
import {
  Box,
  Button,
  Center,
  Combobox,
  createListCollection,
  Field,
  HStack,
  IconButton,
  Image,
  Input,
  Portal,
  Steps,
  Text,
  useFilter,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";

const stateCollection = createListCollection({
  items: US_STATES.map((s) => ({ label: s.name, value: s.name })),
});

export default function Step2FirmDetailsPage() {
  const { colorMode, toggleColorMode } = useColorMode();
  const savedFirmDetails = useOnboardingStore((s) => s.firmDetails);
  const setFirmDetails = useOnboardingStore((s) => s.setFirmDetails);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FirmInformationInput>({
    resolver: zodResolver(firmInformationSchema),
    defaultValues: {
      firmName: savedFirmDetails?.firmName ?? "",
      firmEmail: savedFirmDetails?.firmEmail ?? "",
      firmPhoneNumber: savedFirmDetails?.firmPhoneNumber ?? "",
      address: savedFirmDetails?.address ?? "",
      city: savedFirmDetails?.city ?? "",
      state: savedFirmDetails?.state ?? "",
      zipcode: savedFirmDetails?.zipcode ?? "",
      website: savedFirmDetails?.website ?? "",
      taxId: savedFirmDetails?.taxId ?? "",
    },
  });

  const navigate = useNavigate();

  useDocumentTitle("Firm details - Oravanti");

  const { contains } = useFilter({ sensitivity: "base" });

  const [cityInput, setCityInput] = useState("");
  const [stateInput, setStateInput] = useState("");

  const selectedState = watch("state");

  const stateCode = useMemo(() => {
    const match = US_STATES.find((s) => s.name === selectedState);
    return match?.code ?? "";
  }, [selectedState]);

  const citiesForState = useMemo(
    () => getCitiesForState(stateCode),
    [stateCode],
  );

  const cityCollection = useMemo(
    () =>
      createListCollection({
        items: citiesForState.map((c) => ({ label: c, value: c })),
      }),
    [citiesForState],
  );

  const filteredCityCollection = useMemo(
    () =>
      createListCollection({
        items: cityCollection.items.filter((item) =>
          contains(item.label, cityInput),
        ),
      }),
    [cityInput, cityCollection.items],
  );

  const filteredStateCollection = useMemo(
    () =>
      createListCollection({
        items: stateCollection.items.filter((item) =>
          contains(item.label, stateInput),
        ),
      }),
    [stateInput],
  );

  const onSubmit: SubmitHandler<FirmInformationInput> = (data) => {
    setFirmDetails({
      firmName: data.firmName,
      firmEmail: data.firmEmail,
      firmPhoneNumber: data.firmPhoneNumber,
      address: data.address,
      city: data.city,
      state: data.state,
      zipcode: data.zipcode,
      website: data.website,
      taxId: data.taxId,
    });
    navigate("/onboarding/step-3-tos");
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
              STEP 3 OF 4 &bull; ONBOARDING
            </Box>
          </Box>

          <Steps.Root step={2} count={4} variant="subtle" mb="8">
            <Steps.List>
              {[0, 1, 2, 3].map((i) => (
                <Steps.Item key={i} index={i} title="">
                  <Steps.Separator
                    bg={2 >= i ? "brand.solid" : "border.muted"}
                  />
                </Steps.Item>
              ))}
            </Steps.List>
          </Steps.Root>

          <Text textStyle="heading" color="fg" mb="1" textAlign="left">
            Firm details
          </Text>
          <Text textStyle="subheadline" color="fg.muted" mb="8" textAlign="left">
            Enter your firm's official information.
          </Text>

          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack gap="5" align="stretch">
              <Field.Root invalid={!!errors.firmName} textAlign="left">
                <Field.Label textStyle="label" color="fg.muted">
                  Firm name
                </Field.Label>
                <Input
                  id="firmName"
                  bg="bg.input"
                  borderColor="border.input"
                  focusRingColor="brand.focusRing"
                  placeholder="e.g. Smith & Associates"
                  size="lg"
                  {...register("firmName")}
                />
                <Field.ErrorText>{errors.firmName?.message}</Field.ErrorText>
              </Field.Root>

              <Field.Root invalid={!!errors.firmEmail} textAlign="left">
                <Field.Label textStyle="label" color="fg.muted">
                  Firm email
                </Field.Label>
                <Input
                  id="firmEmail"
                  bg="bg.input"
                  borderColor="border.input"
                  focusRingColor="brand.focusRing"
                  placeholder="admin@myfirm.com"
                  size="lg"
                  {...register("firmEmail")}
                />
                <Field.ErrorText>{errors.firmEmail?.message}</Field.ErrorText>
              </Field.Root>

              <Field.Root invalid={!!errors.firmPhoneNumber} textAlign="left">
                <Field.Label textStyle="label" color="fg.muted">
                  Firm phone number
                </Field.Label>
                <Input
                  id="firmPhoneNumber"
                  type="tel"
                  bg="bg.input"
                  borderColor="border.input"
                  focusRingColor="brand.focusRing"
                  placeholder="+1 (555) 123-4567"
                  size="lg"
                  {...register("firmPhoneNumber")}
                />
                <Field.ErrorText>
                  {errors.firmPhoneNumber?.message}
                </Field.ErrorText>
              </Field.Root>

              <Field.Root invalid={!!errors.taxId} textAlign="left">
                <Field.Label textStyle="label" color="fg.muted">
                  Tax ID / EIN
                </Field.Label>
                <Input
                  id="taxId"
                  bg="bg.input"
                  borderColor="border.input"
                  focusRingColor="brand.focusRing"
                  placeholder="XX-XXXXXXX"
                  size="lg"
                  {...register("taxId")}
                />
                <Field.ErrorText>{errors.taxId?.message}</Field.ErrorText>
              </Field.Root>

              <Field.Root invalid={!!errors.address} textAlign="left">
                <Field.Label textStyle="label" color="fg.muted">
                  Street address
                </Field.Label>
                <Input
                  id="address"
                  bg="bg.input"
                  borderColor="border.input"
                  focusRingColor="brand.focusRing"
                  placeholder="123 Main Street, Suite 400"
                  size="lg"
                  {...register("address")}
                />
                <Field.ErrorText>{errors.address?.message}</Field.ErrorText>
              </Field.Root>

              <Box
                display="grid"
                gridTemplateColumns={{ base: "1fr", sm: "1fr 1fr 1fr" }}
                gap="4"
              >
                <Field.Root invalid={!!errors.state} textAlign="left">
                  <Field.Label textStyle="label" color="fg.muted">
                    State
                  </Field.Label>
                  <Controller
                    control={control}
                    name="state"
                    render={({ field }) => (
                      <Combobox.Root
                        name={field.name}
                        value={field.value ? [field.value] : []}
                        onValueChange={({ value }) => {
                          field.onChange(value[0] ?? "");
                          setValue("city", "");
                        }}
                        onInteractOutside={() => field.onBlur()}
                        collection={filteredStateCollection}
                        size="lg"
                        openOnClick
                        inputBehavior="autohighlight"
                        onInputValueChange={(details) =>
                          setStateInput(details.inputValue)
                        }
                      >
                        <Combobox.Control>
                          <Combobox.Input
                            bg="bg.input"
                            borderColor="border.input"
                            focusRingColor="brand.focusRing"
                            placeholder="Select a state"
                          />
                          <Combobox.IndicatorGroup>
                            <Combobox.ClearTrigger />
                            <Combobox.Trigger />
                          </Combobox.IndicatorGroup>
                        </Combobox.Control>
                        <Portal>
                          <Combobox.Positioner>
                            <Combobox.Content>
                              {filteredStateCollection.items.map((item) => (
                                <Combobox.Item
                                  item={item}
                                  key={item.value}
                                >
                                  <Combobox.ItemText>
                                    {item.label}
                                  </Combobox.ItemText>
                                  <Combobox.ItemIndicator />
                                </Combobox.Item>
                              ))}
                            </Combobox.Content>
                          </Combobox.Positioner>
                        </Portal>
                      </Combobox.Root>
                    )}
                  />
                  <Field.ErrorText>{errors.state?.message}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.city} textAlign="left">
                  <Field.Label textStyle="label" color="fg.muted">
                    City
                  </Field.Label>
                  <Controller
                    control={control}
                    name="city"
                    render={({ field }) => (
                      <Combobox.Root
                        name={field.name}
                        value={field.value ? [field.value] : []}
                        onValueChange={({ value }) =>
                          field.onChange(value[0] ?? "")
                        }
                        onInteractOutside={() => field.onBlur()}
                        collection={filteredCityCollection}
                        disabled={!selectedState}
                        size="lg"
                        openOnClick
                        inputBehavior="autohighlight"
                        onInputValueChange={(details) =>
                          setCityInput(details.inputValue)
                        }
                      >
                        <Combobox.Control>
                          <Combobox.Input
                            bg="bg.input"
                            borderColor="border.input"
                            focusRingColor="brand.focusRing"
                            placeholder={selectedState ? "Select a city" : "Select a state first"}
                          />
                          <Combobox.IndicatorGroup>
                            <Combobox.ClearTrigger />
                            <Combobox.Trigger />
                          </Combobox.IndicatorGroup>
                        </Combobox.Control>
                        <Portal>
                          <Combobox.Positioner>
                            <Combobox.Content>
                              {filteredCityCollection.items.map((item) => (
                                <Combobox.Item
                                  item={item}
                                  key={item.value}
                                >
                                  <Combobox.ItemText>
                                    {item.label}
                                  </Combobox.ItemText>
                                  <Combobox.ItemIndicator />
                                </Combobox.Item>
                              ))}
                            </Combobox.Content>
                          </Combobox.Positioner>
                        </Portal>
                      </Combobox.Root>
                    )}
                  />
                  <Field.ErrorText>{errors.city?.message}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.zipcode} textAlign="left">
                  <Field.Label textStyle="label" color="fg.muted">
                    ZIP code
                  </Field.Label>
                  <Input
                    id="zipcode"
                    bg="bg.input"
                    borderColor="border.input"
                    focusRingColor="brand.focusRing"
                    placeholder="90001"
                    size="lg"
                    {...register("zipcode")}
                  />
                  <Field.ErrorText>{errors.zipcode?.message}</Field.ErrorText>
                </Field.Root>
              </Box>

              <Field.Root invalid={!!errors.website} textAlign="left">
                <Field.Label textStyle="label" color="fg.muted">
                  Website
                </Field.Label>
                <Input
                  id="website"
                  type="url"
                  bg="bg.input"
                  borderColor="border.input"
                  focusRingColor="brand.focusRing"
                  placeholder="https://myfirm.com"
                  size="lg"
                  {...register("website")}
                />
                <Field.ErrorText>{errors.website?.message}</Field.ErrorText>
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
                  onClick={() => navigate("/onboarding/step-1-profile")}
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
