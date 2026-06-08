import { Box, Heading, HStack, Stack, Text } from "@chakra-ui/react";

interface ClientReviewStepProps {
  formValues: Record<string, any>;
}

export const ClientReviewStep = ({ formValues }: ClientReviewStepProps) => {
  const reviewFields = [
    { label: "Name", value: `${formValues.firstName} ${formValues.lastName}` },
    { label: "Email address", value: formValues.email },
    { label: "Phone number", value: formValues.phone },
    { label: "Legal area", value: formValues.situation },
    { label: "Preferred language", value: formValues.language },
  ];

  return (
    <Stack gap="4">
      <Box
        border="1px solid"
        borderColor="border"
        borderRadius="md"
        bg="bg.subtle"
        p="1"
      >
        {reviewFields.map((field, idx) => (
          <HStack
            key={idx}
            justify="space-between"
            py="2.5"
            px="3"
            borderBottom={
              idx !== reviewFields.length - 1 ? "1px solid" : "none"
            }
            borderColor="border.muted"
          >
            <Text fontSize="13px" color="fg.muted">
              {field.label}
            </Text>
            <Text fontSize="13px" fontWeight="500" color="fg" textAlign="right">
              {field.value || "—"}
            </Text>
          </HStack>
        ))}
      </Box>

      <Box
        p="3"
        bg="bg.subtle"
        border="1px solid"
        borderColor="border"
        borderRadius="md"
      >
        <Heading as="h4" fontSize="12px" fontWeight="600" color="fg" mb="1">
          What happens next
        </Heading>
        <Text
          textStyle="body-sm"
          fontSize="12px"
          color="fg.muted"
          lineHeight="1.4"
        >
          The firm will review your enquiry and contact you within 1-2 business
          days. No payment required yet.
        </Text>
      </Box>
    </Stack>
  );
};
