import { US_STATES } from "@/data/us-states-cities";
import {
  Box,
  createListCollection,
  Field,
  Input,
  Portal,
  Select,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Controller, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue, type UseFormWatch } from "react-hook-form";

interface FirmDetailsStepProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  inputStyleProps: Record<string, any>;
}

const statesCollection = createListCollection({
  items: US_STATES.map((s) => ({ label: s.name, value: s.name })),
});

export const FirmDetailsStep = ({
  register,
  errors,
  control,
  setValue,
  watch,
  inputStyleProps,
}: FirmDetailsStepProps) => {
  const watchedTier = watch("platformTier");

  return (
    <VStack gap="5" align="stretch">
      <Field.Root invalid={!!errors.firmName}>
        <Field.Label textStyle="label" color="fg.muted" mb="1">
          Firm name
        </Field.Label>
        <Input
          placeholder="e.g. Chen & Associates LLP"
          {...register("firmName", {
            required: "Firm name is required",
          })}
          {...inputStyleProps}
        />
        {errors.firmName && (
          <Field.ErrorText>
            {errors.firmName.message as string}
          </Field.ErrorText>
        )}
      </Field.Root>

      <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
        <Field.Root invalid={!!errors.stateOfPractice}>
          <Field.Label textStyle="label" color="fg.muted" mb="1">
            State of practice
          </Field.Label>
          <Controller
            control={control}
            name="stateOfPractice"
            rules={{ required: "State selection is required" }}
            render={({ field }) => (
              <Select.Root
                name={field.name}
                value={field.value ? [field.value] : []}
                onValueChange={({ value }) =>
                  field.onChange(value[0] || "")
                }
                onInteractOutside={() => field.onBlur()}
                collection={statesCollection}
                size="sm"
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger
                    bg="bg.input"
                    borderWidth="1px"
                    borderColor="border.input"
                    borderRadius="sm"
                    _hover={{ borderColor: "border.emphasized" }}
                    _focus={{
                      borderColor: "brand.focusRing",
                      boxShadow:
                        "0 0 0 1px var(--colors-brand-400)",
                      outline: "none",
                    }}
                  >
                    <Select.ValueText
                      placeholder="Select state"
                      color={field.value ? "fg" : "fg.muted"}
                    />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>

                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {statesCollection.items.map((state) => (
                        <Select.Item item={state} key={state.value}>
                          {state.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            )}
          />
          {errors.stateOfPractice && (
            <Field.ErrorText>
              {errors.stateOfPractice.message as string}
            </Field.ErrorText>
          )}
        </Field.Root>

        <Field.Root invalid={!!errors.barNumber}>
          <Field.Label textStyle="label" color="fg.muted" mb="1">
            Bar number
          </Field.Label>
          <Input
            placeholder="e.g. 12345678"
            {...register("barNumber", {
              required: "Bar number is required",
            })}
            {...inputStyleProps}
          />
          {errors.barNumber && (
            <Field.ErrorText>
              {errors.barNumber.message as string}
            </Field.ErrorText>
          )}
        </Field.Root>
      </SimpleGrid>

      <Field.Root>
        <Field.Label textStyle="label" color="fg.muted" mb="2">
          Platform tier
        </Field.Label>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="4" w="full">
          <Box
            w="full"
            borderWidth="1px"
            borderColor={
              watchedTier === "basic" ? "accent.admin" : "border"
            }
            bg="bg.subtle"
            p="4"
            borderRadius="md"
            cursor="pointer"
            onClick={() => setValue("platformTier", "basic")}
          >
            <Text fontWeight="bold" color="fg" mb="1">
              Basic
            </Text>
            <Text textStyle="body-sm" color="fg.muted">
              Core platform only — contact for pricing
            </Text>
          </Box>

          <Box
            w="full"
            borderWidth="1px"
            borderColor={
              watchedTier === "complete" ? "accent.admin" : "border"
            }
            bg="bg.subtle"
            p="4"
            borderRadius="md"
            cursor="pointer"
            onClick={() => setValue("platformTier", "complete")}
          >
            <Text fontWeight="bold" color="fg" mb="1">
              Complete
            </Text>
            <Text textStyle="body-sm" color="fg.muted">
              Full feature access — contact for pricing
            </Text>
          </Box>
        </SimpleGrid>
      </Field.Root>
    </VStack>
  );
};
