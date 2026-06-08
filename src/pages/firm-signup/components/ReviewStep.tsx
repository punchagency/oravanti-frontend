import {
  Box,
  Checkbox,
  Field,
  Flex,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Controller, type Control, type FieldErrors } from "react-hook-form";

interface ReviewStepProps {
  formValues: Record<string, any>;
  watchedPracticeAreas: string[];
  errors: FieldErrors<any>;
  control: Control<any>;
}

export const ReviewStep = ({
  formValues,
  watchedPracticeAreas,
  errors,
  control,
}: ReviewStepProps) => {
  return (
    <VStack gap="5" align="stretch">
      <Box
        bg="bg.muted"
        borderRadius="md"
        p="1"
        overflow="hidden"
        borderWidth="1px"
        borderColor="border"
      >
        {[
          { label: "Firm name", value: formValues.firmName || "—" },
          {
            label: "State of practice",
            value: formValues.stateOfPractice || "—",
          },
          {
            label: "Bar number",
            value: formValues.barNumber || "—",
          },
          {
            label: "Platform tier",
            value: `${formValues.platformTier ? formValues.platformTier.charAt(0).toUpperCase() + formValues.platformTier.slice(1) : "—"}`,
          },
          {
            label: "Practice areas",
            value:
              watchedPracticeAreas.length > 0
                ? watchedPracticeAreas
                    .map(
                      (a: string) => a.charAt(0).toUpperCase() + a.slice(1),
                    )
                    .join(", ")
                : "None Selected",
          },
          {
            label: "Representative",
            value: `${formValues.firstName || "—"} ${formValues.lastName || ""}`,
          },
          {
            label: "Work email",
            value: formValues.workEmail || "—",
          },
        ].map((row, rIdx) => (
          <Flex
            key={rIdx}
            justify="space-between"
            px="4"
            py="3"
            borderBottomWidth={rIdx === 6 ? "0" : "1px"}
            borderColor="border.muted"
          >
            <Text textStyle="body-sm" color="fg.muted">
              {row.label}
            </Text>
            <Text textStyle="body-sm" fontWeight="bold" color="fg">
              {row.value}
            </Text>
          </Flex>
        ))}
      </Box>

      <Field.Root invalid={!!errors.termsConsent}>
        <Box
          bg="bg.subtle"
          p="4"
          borderRadius="md"
          borderWidth="1px"
          borderColor="border"
        >
          <Text
            textStyle="body-sm"
            color="fg.muted"
            lineHeight="relaxed"
            mb="3"
          >
            FedRAMP notice: Oravanti is secure in accordance with
            U.S. FedRAMP moderate security baseline requirements.
            Account details and attorney registries are shielded
            from unauthorized access.
          </Text>
          <Controller
            control={control}
            name="termsConsent"
            rules={{
              required: "You must accept the terms to proceed",
            }}
            render={({ field }) => (
              <Checkbox.Root
                checked={field.value}
                onCheckedChange={(e) => field.onChange(!!e.checked)}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control
                  borderColor="border.emphasized"
                  _checked={{
                    bg: "brand.solid",
                    borderColor: "brand.solid",
                  }}
                />
                <Checkbox.Label
                  textStyle="body-sm"
                  color="fg"
                  fontWeight="medium"
                  ml="2"
                  cursor="pointer"
                >
                  I agree to the Oravanti SaaS deployment agreement
                  and confirm terms consent.
                </Checkbox.Label>
              </Checkbox.Root>
            )}
          />
        </Box>
        {errors.termsConsent && (
          <Field.ErrorText mt={2}>
            {errors.termsConsent.message as string}
          </Field.ErrorText>
        )}
      </Field.Root>
    </VStack>
  );
};
