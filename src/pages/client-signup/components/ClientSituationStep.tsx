import { Box, Field, HStack, Stack, Text } from "@chakra-ui/react";
import { Check } from "lucide-react";
import { type FieldErrors, type UseFormRegister, type UseFormSetValue, type UseFormWatch } from "react-hook-form";

interface ClientSituationStepProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  errors: FieldErrors<any>;
}

export const ClientSituationStep = ({
  register,
  setValue,
  watch,
  errors,
}: ClientSituationStepProps) => {
  const currentSituation = watch("situation");
  const options = [
    "Immigration",
    "Family law",
    "Business / corporate",
    "Estate planning",
    "Employment",
    "Real estate",
    "Criminal defense",
    "Personal injury",
    "Not sure yet",
  ];

  return (
    <Field.Root invalid={!!errors.situation}>
      <Box mb="4">
        <Text fontSize="14px" fontWeight="600" color="fg" mb="1">
          What type of legal help do you need?
        </Text>
        <Text textStyle="body-sm" color="fg.muted">
          Select the area that best describes your situation.
        </Text>
      </Box>

      <input
        type="hidden"
        {...register("situation", {
          required: "Please select a situation to continue",
        })}
      />

      <Stack gap="2" maxH="280px" overflowY="auto" pr="1" w="full">
        {options.map((opt) => {
          const isSelected = currentSituation === opt;
          return (
            <HStack
              key={opt}
              as="button"
              onClick={() =>
                setValue("situation", opt, { shouldValidate: true })
              }
              w="100%"
              p="3.5"
              justify="space-between"
              align="center"
              borderWidth="1px"
              borderRadius="md"
              bg="bg"
              borderColor={isSelected ? "accent.portal" : "border"}
              _hover={{
                borderColor: isSelected ? "accent.portal" : "border.emphasized",
              }}
              transition="all 0.15s ease"
            >
              <Text fontSize="13px" color="fg">
                {opt}
              </Text>
              {isSelected && (
                <Box color="accent.portal">
                  <Check size={16} strokeWidth={2.5} />
                </Box>
              )}
            </HStack>
          );
        })}
      </Stack>
      {errors.situation && (
        <Field.ErrorText fontSize="12px" mt="2">
          {errors.situation.message as string}
        </Field.ErrorText>
      )}
    </Field.Root>
  );
};
