import { useColorMode } from "@/hooks/use-color-mode";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useOnboardingStore } from "@/store/onboarding-store";
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
  items: [
    { label: "Alabama", value: "Alabama" },
    { label: "Alaska", value: "Alaska" },
    { label: "Arizona", value: "Arizona" },
    { label: "Arkansas", value: "Arkansas" },
    { label: "California", value: "California" },
    { label: "Colorado", value: "Colorado" },
    { label: "Connecticut", value: "Connecticut" },
    { label: "Delaware", value: "Delaware" },
    { label: "Florida", value: "Florida" },
    { label: "Georgia", value: "Georgia" },
    { label: "Hawaii", value: "Hawaii" },
    { label: "Idaho", value: "Idaho" },
    { label: "Illinois", value: "Illinois" },
    { label: "Indiana", value: "Indiana" },
    { label: "Iowa", value: "Iowa" },
    { label: "Kansas", value: "Kansas" },
    { label: "Kentucky", value: "Kentucky" },
    { label: "Louisiana", value: "Louisiana" },
    { label: "Maine", value: "Maine" },
    { label: "Maryland", value: "Maryland" },
    { label: "Massachusetts", value: "Massachusetts" },
    { label: "Michigan", value: "Michigan" },
    { label: "Minnesota", value: "Minnesota" },
    { label: "Mississippi", value: "Mississippi" },
    { label: "Missouri", value: "Missouri" },
    { label: "Montana", value: "Montana" },
    { label: "Nebraska", value: "Nebraska" },
    { label: "Nevada", value: "Nevada" },
    { label: "New Hampshire", value: "New Hampshire" },
    { label: "New Jersey", value: "New Jersey" },
    { label: "New Mexico", value: "New Mexico" },
    { label: "New York", value: "New York" },
    { label: "North Carolina", value: "North Carolina" },
    { label: "North Dakota", value: "North Dakota" },
    { label: "Ohio", value: "Ohio" },
    { label: "Oklahoma", value: "Oklahoma" },
    { label: "Oregon", value: "Oregon" },
    { label: "Pennsylvania", value: "Pennsylvania" },
    { label: "Rhode Island", value: "Rhode Island" },
    { label: "South Carolina", value: "South Carolina" },
    { label: "South Dakota", value: "South Dakota" },
    { label: "Tennessee", value: "Tennessee" },
    { label: "Texas", value: "Texas" },
    { label: "Utah", value: "Utah" },
    { label: "Vermont", value: "Vermont" },
    { label: "Virginia", value: "Virginia" },
    { label: "Washington", value: "Washington" },
    { label: "West Virginia", value: "West Virginia" },
    { label: "Wisconsin", value: "Wisconsin" },
    { label: "Wyoming", value: "Wyoming" },
  ],
});

const cityCollection = createListCollection({
  items: [
    { label: "New York", value: "New York" },
    { label: "Los Angeles", value: "Los Angeles" },
    { label: "Chicago", value: "Chicago" },
    { label: "Houston", value: "Houston" },
    { label: "Phoenix", value: "Phoenix" },
    { label: "Philadelphia", value: "Philadelphia" },
    { label: "San Antonio", value: "San Antonio" },
    { label: "San Diego", value: "San Diego" },
    { label: "Dallas", value: "Dallas" },
    { label: "Austin", value: "Austin" },
    { label: "San Jose", value: "San Jose" },
    { label: "Jacksonville", value: "Jacksonville" },
    { label: "Fort Worth", value: "Fort Worth" },
    { label: "Columbus", value: "Columbus" },
    { label: "Charlotte", value: "Charlotte" },
    { label: "Indianapolis", value: "Indianapolis" },
    { label: "San Francisco", value: "San Francisco" },
    { label: "Seattle", value: "Seattle" },
    { label: "Denver", value: "Denver" },
    { label: "Nashville", value: "Nashville" },
    { label: "Oklahoma City", value: "Oklahoma City" },
    { label: "El Paso", value: "El Paso" },
    { label: "Washington", value: "Washington" },
    { label: "Boston", value: "Boston" },
    { label: "Las Vegas", value: "Las Vegas" },
    { label: "Portland", value: "Portland" },
    { label: "Memphis", value: "Memphis" },
    { label: "Louisville", value: "Louisville" },
    { label: "Baltimore", value: "Baltimore" },
    { label: "Milwaukee", value: "Milwaukee" },
    { label: "Albuquerque", value: "Albuquerque" },
    { label: "Tucson", value: "Tucson" },
    { label: "Fresno", value: "Fresno" },
    { label: "Sacramento", value: "Sacramento" },
    { label: "Mesa", value: "Mesa" },
    { label: "Kansas City", value: "Kansas City" },
    { label: "Atlanta", value: "Atlanta" },
    { label: "Omaha", value: "Omaha" },
    { label: "Colorado Springs", value: "Colorado Springs" },
    { label: "Raleigh", value: "Raleigh" },
    { label: "Long Beach", value: "Long Beach" },
    { label: "Virginia Beach", value: "Virginia Beach" },
    { label: "Miami", value: "Miami" },
    { label: "Oakland", value: "Oakland" },
    { label: "Minneapolis", value: "Minneapolis" },
    { label: "Tampa", value: "Tampa" },
    { label: "Tulsa", value: "Tulsa" },
    { label: "Arlington", value: "Arlington" },
    { label: "New Orleans", value: "New Orleans" },
    { label: "Cleveland", value: "Cleveland" },
    { label: "Bakersfield", value: "Bakersfield" },
    { label: "Honolulu", value: "Honolulu" },
    { label: "Anaheim", value: "Anaheim" },
    { label: "Riverside", value: "Riverside" },
    { label: "Santa Ana", value: "Santa Ana" },
    { label: "Corpus Christi", value: "Corpus Christi" },
    { label: "Lexington", value: "Lexington" },
    { label: "Stockton", value: "Stockton" },
    { label: "St. Louis", value: "St. Louis" },
    { label: "Pittsburgh", value: "Pittsburgh" },
    { label: "Cincinnati", value: "Cincinnati" },
    { label: "Anchorage", value: "Anchorage" },
    { label: "Henderson", value: "Henderson" },
    { label: "Greensboro", value: "Greensboro" },
    { label: "Plano", value: "Plano" },
    { label: "Newark", value: "Newark" },
    { label: "Lincoln", value: "Lincoln" },
    { label: "Orlando", value: "Orlando" },
    { label: "Irvine", value: "Irvine" },
    { label: "Toledo", value: "Toledo" },
    { label: "Durham", value: "Durham" },
    { label: "St. Paul", value: "St. Paul" },
    { label: "Laredo", value: "Laredo" },
    { label: "Buffalo", value: "Buffalo" },
    { label: "Madison", value: "Madison" },
    { label: "Lubbock", value: "Lubbock" },
    { label: "Scottsdale", value: "Scottsdale" },
    { label: "Glendale", value: "Glendale" },
    { label: "Winston-Salem", value: "Winston-Salem" },
    { label: "Boise", value: "Boise" },
    { label: "Norfolk", value: "Norfolk" },
    { label: "Baton Rouge", value: "Baton Rouge" },
    { label: "Richmond", value: "Richmond" },
    { label: "Spokane", value: "Spokane" },
    { label: "Des Moines", value: "Des Moines" },
    { label: "Rochester", value: "Rochester" },
    { label: "Salt Lake City", value: "Salt Lake City" },
    { label: "Birmingham", value: "Birmingham" },
    { label: "Grand Rapids", value: "Grand Rapids" },
    { label: "Hartford", value: "Hartford" },
    { label: "Providence", value: "Providence" },
    { label: "Worcester", value: "Worcester" },
    { label: "Bridgeport", value: "Bridgeport" },
    { label: "Albany", value: "Albany" },
  ],
});

export default function Step2FirmDetailsPage() {
  const { colorMode, toggleColorMode } = useColorMode();
  const savedFirmDetails = useOnboardingStore((s) => s.firmDetails);
  const setFirmDetails = useOnboardingStore((s) => s.setFirmDetails);

  const {
    register,
    handleSubmit,
    control,
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

  const filteredCityCollection = useMemo(
    () =>
      createListCollection({
        items: cityCollection.items.filter((item) =>
          contains(item.label, cityInput),
        ),
      }),
    [cityInput],
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
              color="brand.fg"
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
                            placeholder="Select a city"
                          />
                          <Combobox.IndicatorGroup>
                            <Combobox.Trigger />
                          </Combobox.IndicatorGroup>
                        </Combobox.Control>
                        <Portal>
                          <Combobox.Positioner>
                            <Combobox.Content>
                              {cityCollection.items.map((item) => (
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
                        onValueChange={({ value }) =>
                          field.onChange(value[0] ?? "")
                        }
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
                            <Combobox.Trigger />
                          </Combobox.IndicatorGroup>
                        </Combobox.Control>
                        <Portal>
                          <Combobox.Positioner>
                            <Combobox.Content>
                              {stateCollection.items.map((item) => (
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
