import {
  Box,
  Field,
  Flex,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { type FieldErrors, type UseFormGetValues, type UseFormRegister, type UseFormSetValue, type UseFormWatch } from "react-hook-form";

interface PracticeAreasStepProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  watch: UseFormWatch<any>;
}

interface PracticeAreaOption {
  id: string;
  label: string;
  icon: string;
}

const practiceAreaOptions: PracticeAreaOption[] = [
  { id: "immigration", label: "Immigration", icon: "✈️" },
  { id: "family", label: "Family law", icon: "🏠" },
  { id: "business", label: "Business", icon: "💼" },
  { id: "estate", label: "Estate planning", icon: "📄" },
  { id: "employment", label: "Employment", icon: "👥" },
  { id: "real_estate", label: "Real estate", icon: "🏢" },
  { id: "criminal", label: "Criminal defense", icon: "⚖️" },
  { id: "personal_injury", label: "Personal injury", icon: "🚑" },
];

export const PracticeAreasStep = ({
  register,
  errors,
  setValue,
  getValues,
  watch,
}: PracticeAreasStepProps) => {
  const watchedPracticeAreas = watch("practiceAreas");

  const handleTogglePracticeArea = (id: string) => {
    const currentSelected = getValues("practiceAreas");
    const updated = currentSelected.includes(id)
      ? currentSelected.filter((item: string) => item !== id)
      : [...currentSelected, id];
    setValue("practiceAreas", updated, { shouldValidate: true });
  };

  return (
    <VStack gap="5" align="stretch">
      <Field.Root invalid={!!errors.practiceAreas}>
        <Box>
          <Text textStyle="label" fontWeight="bold" color="fg">
            Select practice areas
          </Text>
          <Text textStyle="body-sm" color="fg.muted">
            Choose the add-ons your firm needs (select at least
            one).
          </Text>
        </Box>

        <input
          type="hidden"
          {...register("practiceAreas", {
            validate: (v) =>
              v.length > 0 ||
              "Please select at least one practice area.",
          })}
        />

        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="3" w="full">
          {practiceAreaOptions.map((option) => {
            const isSelected = watchedPracticeAreas.includes(
              option.id,
            );
            return (
              <Flex
                key={option.id}
                align="center"
                justify="space-between"
                bg="bg.input"
                p="3.5"
                borderRadius="md"
                borderWidth="1px"
                borderColor={isSelected ? "brand.solid" : "border"}
                cursor="pointer"
                onClick={() => handleTogglePracticeArea(option.id)}
                _hover={{
                  bg: "bg.subtle",
                  borderColor: isSelected
                    ? "brand.solid"
                    : "border.emphasized",
                }}
              >
                <HStack gap="3">
                  <Text fontSize="md">{option.icon}</Text>
                  <Text
                    textStyle="body-sm"
                    color={isSelected ? "fg" : "fg.muted"}
                  >
                    {option.label}
                  </Text>
                </HStack>
                <Box
                  w="4"
                  h="4"
                  borderRadius="sm"
                  borderWidth="1px"
                  borderColor={
                    isSelected ? "brand.solid" : "border.emphasized"
                  }
                  bg={isSelected ? "brand.solid" : "transparent"}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {isSelected && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="black"
                      strokeWidth="4"
                      width="10px"
                      height="10px"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </Box>
              </Flex>
            );
          })}
        </SimpleGrid>
        {errors.practiceAreas && (
          <Field.ErrorText>
            {errors.practiceAreas.message as string}
          </Field.ErrorText>
        )}
      </Field.Root>
    </VStack>
  );
};
