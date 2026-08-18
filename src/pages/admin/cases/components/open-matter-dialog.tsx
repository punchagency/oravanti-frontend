import { PRACTICE_AREAS } from "@/utils/practice-areas";
import {
  Box,
  Button,
  chakra,
  createListCollection,
  Dialog,
  Field,
  Input,
  Portal,
  Select,
  VStack,
} from "@chakra-ui/react";
import { X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";

const staffOptions = createListCollection({
  items: [
    { value: "", label: "Select attorney" },
    { value: "sandra-adeyemi", label: "Sandra Adeyemi" },
    { value: "yemi-okafor", label: "Yemi Okafor" },
    { value: "jennifer-lee", label: "Jennifer Lee" },
    { value: "robert-thompson", label: "Robert Thompson" },
    { value: "sarah-mitchell", label: "Sarah Mitchell" },
    { value: "michael-chen", label: "Michael Chen" },
    { value: "patricia-williams", label: "Patricia Williams" },
  ],
});

const paralegalOptions = createListCollection({
  items: [
    { value: "", label: "None — Leave unassigned" },
    { value: "paralegal-1", label: "Paralegal 1" },
    { value: "paralegal-2", label: "Paralegal 2" },
  ],
});

const filingTypeOptions = createListCollection({
  items: [
    { value: "", label: "Select filing type" },
    { value: "consultation", label: "Initial Consultation" },
    { value: "document-preparation", label: "Document Preparation" },
    { value: "filing", label: "Filing" },
    { value: "representation", label: "Legal Representation" },
    { value: "review", label: "Document Review" },
  ],
});

interface FormValues {
  practiceArea: string;
  filingType: string;
  clientName: string;
  leadAttorney: string;
  paralegal: string;
}

export function OpenMatterButton() {
  return (
    <OpenMatterDialog>
      <Button
        variant="solid"
        size={{ base: "xs", md: "sm" }}
        bg="brand.solid"
        color="brand.contrast"
        _hover={{ bg: "brand.600" }}
      >
        Open new matter
      </Button>
    </OpenMatterDialog>
  );
}

export function OpenMatterDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      practiceArea: "",
      filingType: "",
      clientName: "",
      leadAttorney: "",
      paralegal: "",
    },
    mode: "onBlur",
  });

  const practiceAreaOptions = createListCollection({
    items: [
      { value: "", label: "Select practice area" },
      ...PRACTICE_AREAS.map((pa) => ({ value: pa.value, label: pa.label })),
    ],
  });

  const onSubmit = (formData: FormValues) => {
    console.log("Create matter:", formData);
    reset();
    setOpen(false);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        setOpen(details.open);
        if (!details.open) reset();
      }}
      placement="center"
    >
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1.5px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            w="full"
            maxW="480px"
            border="1px solid"
            borderColor="border"
            borderRadius="14px"
            bg="bg"
            p="0"
            boxShadow="0 24px 70px rgba(0, 0, 0, 0.26)"
          >
            <Dialog.CloseTrigger asChild>
              <chakra.button
                type="button"
                aria-label="Close open matter dialog"
                position="absolute"
                top="22px"
                right="22px"
                display="grid"
                placeItems="center"
                w="32px"
                h="32px"
                border="1px solid"
                borderColor="border"
                borderRadius="8px"
                bg="bg"
                color="fg.muted"
              >
                <X size={16} />
              </chakra.button>
            </Dialog.CloseTrigger>

            <Box as="form" p="32px 24px 24px" onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Title
                color="fg"
                fontSize="17px"
                fontWeight="600"
                lineHeight="1.2"
              >
                Open new matter
              </Dialog.Title>

              <VStack align="stretch" gap="12px" mt="18px">
                <Field.Root invalid={!!errors.practiceArea}>
                  <Field.Label>
                    Select practice area
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Controller
                    name="practiceArea"
                    control={control}
                    rules={{ required: "Practice area is required" }}
                    render={({ field }) => (
                      <Select.Root
                        collection={practiceAreaOptions}
                        size="sm"
                        value={[field.value]}
                        onValueChange={(e) =>
                          field.onChange(e.value[0] ?? "")
                        }
                      >
                        <Select.Control>
                          <Select.Trigger
                            h="36px"
                            border="1px solid"
                            borderColor="border"
                            borderRadius="7px"
                            bg="bg"
                            _focus={{
                              borderColor: "brand.solid",
                              boxShadow: "0 0 0 1px var(--brand-cta)",
                            }}
                          >
                            <Select.ValueText />
                          </Select.Trigger>
                          <Select.IndicatorGroup>
                            <Select.Indicator />
                          </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal>
                          <Select.Positioner>
                            <Select.Content>
                              {practiceAreaOptions.items.map((opt) => (
                                <Select.Item
                                  item={opt}
                                  key={opt.value}
                                  _hover={{ bg: "bg.muted" }}
                                  _focus={{ bg: "bg.subtle" }}
                                  bg="transparent"
                                  _selected={{ bg: "transparent" }}
                                >
                                  <Select.ItemText>
                                    {opt.label}
                                  </Select.ItemText>
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                      </Select.Root>
                    )}
                  />
                  {errors.practiceArea && (
                    <Field.ErrorText>
                      {errors.practiceArea.message}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root invalid={!!errors.filingType}>
                  <Field.Label>
                    Select filing / matter type
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Controller
                    name="filingType"
                    control={control}
                    rules={{
                      validate: (val) =>
                        (val && val !== "") || "Filing type is required",
                    }}
                    render={({ field }) => (
                      <Select.Root
                        collection={filingTypeOptions}
                        size="sm"
                        value={[field.value]}
                        onValueChange={(e) =>
                          field.onChange(e.value[0] ?? "")
                        }
                      >
                        <Select.Control>
                          <Select.Trigger
                            h="36px"
                            border="1px solid"
                            borderColor="border"
                            borderRadius="7px"
                            bg="bg"
                            _focus={{
                              borderColor: "brand.solid",
                              boxShadow: "0 0 0 1px var(--brand-cta)",
                            }}
                          >
                            <Select.ValueText />
                          </Select.Trigger>
                          <Select.IndicatorGroup>
                            <Select.Indicator />
                          </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal>
                          <Select.Positioner>
                            <Select.Content>
                              {filingTypeOptions.items.map((opt) => (
                                <Select.Item
                                  item={opt}
                                  key={opt.value}
                                  _hover={{ bg: "bg.muted" }}
                                  _focus={{ bg: "bg.subtle" }}
                                  bg="transparent"
                                  _selected={{ bg: "transparent" }}
                                >
                                  <Select.ItemText>
                                    {opt.label}
                                  </Select.ItemText>
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                      </Select.Root>
                    )}
                  />
                  {errors.filingType && (
                    <Field.ErrorText>
                      {errors.filingType.message}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root invalid={!!errors.clientName}>
                  <Field.Label>
                    Client name
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Input
                    placeholder="e.g. John Doe"
                    {...register("clientName", {
                      required: "Client name is required",
                    })}
                    {...inputStyles}
                  />
                  {errors.clientName && (
                    <Field.ErrorText>
                      {errors.clientName.message}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root invalid={!!errors.leadAttorney}>
                  <Field.Label>
                    Assign lead attorney
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Controller
                    name="leadAttorney"
                    control={control}
                    rules={{ required: "Lead attorney is required" }}
                    render={({ field }) => (
                      <Select.Root
                        collection={staffOptions}
                        size="sm"
                        value={[field.value]}
                        onValueChange={(e) =>
                          field.onChange(e.value[0] ?? "")
                        }
                      >
                        <Select.Control>
                          <Select.Trigger
                            h="36px"
                            border="1px solid"
                            borderColor="border"
                            borderRadius="7px"
                            bg="bg"
                            _focus={{
                              borderColor: "brand.solid",
                              boxShadow: "0 0 0 1px var(--brand-cta)",
                            }}
                          >
                            <Select.ValueText />
                          </Select.Trigger>
                          <Select.IndicatorGroup>
                            <Select.Indicator />
                          </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal>
                          <Select.Positioner>
                            <Select.Content>
                              {staffOptions.items.map((opt) => (
                                <Select.Item
                                  item={opt}
                                  key={opt.value}
                                  _hover={{ bg: "bg.muted" }}
                                  _focus={{ bg: "bg.subtle" }}
                                  bg="transparent"
                                  _selected={{ bg: "transparent" }}
                                >
                                  <Select.ItemText>
                                    {opt.label}
                                  </Select.ItemText>
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                      </Select.Root>
                    )}
                  />
                  {errors.leadAttorney && (
                    <Field.ErrorText>
                      {errors.leadAttorney.message}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root>
                  <Field.Label>
                    Assign paralegal / case manager (optional)
                  </Field.Label>
                  <Controller
                    name="paralegal"
                    control={control}
                    render={({ field }) => (
                      <Select.Root
                        collection={paralegalOptions}
                        size="sm"
                        value={[field.value]}
                        onValueChange={(e) =>
                          field.onChange(e.value[0] ?? "")
                        }
                      >
                        <Select.Control>
                          <Select.Trigger
                            h="36px"
                            border="1px solid"
                            borderColor="border"
                            borderRadius="7px"
                            bg="bg"
                            _focus={{
                              borderColor: "brand.solid",
                              boxShadow: "0 0 0 1px var(--brand-cta)",
                            }}
                          >
                            <Select.ValueText />
                          </Select.Trigger>
                          <Select.IndicatorGroup>
                            <Select.Indicator />
                          </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal>
                          <Select.Positioner>
                            <Select.Content>
                              {paralegalOptions.items.map((opt) => (
                                <Select.Item
                                  item={opt}
                                  key={opt.value}
                                  _hover={{ bg: "bg.muted" }}
                                  _focus={{ bg: "bg.subtle" }}
                                  bg="transparent"
                                  _selected={{ bg: "transparent" }}
                                >
                                  <Select.ItemText>
                                    {opt.label}
                                  </Select.ItemText>
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                      </Select.Root>
                    )}
                  />
                </Field.Root>
              </VStack>

              <Button
                type="submit"
                w="full"
                mt="24px"
                h="40px"
                bg="brand.solid"
                color="brand.contrast"
                _hover={{ bg: "brand.600" }}
                fontWeight="600"
              >
                Create matter
              </Button>
            </Box>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

const inputStyles = {
  h: "36px",
  px: "12px",
  border: "1px solid",
  borderColor: "border",
  borderRadius: "7px",
  bg: "bg",
  color: "fg",
  fontSize: "13px",
  _placeholder: { color: "fg.muted" },
  _focus: {
    borderColor: "brand.solid",
    boxShadow: "0 0 0 1px var(--brand-cta)",
  },
};
