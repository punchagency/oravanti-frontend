import { useDocumentTitle } from "@/hooks/use-document-title";
import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { ConsultationFeeDefaults } from "./components/consultation-fee-defaults";

export function FirmSettingsPage() {
  useDocumentTitle("Firm Settings - Oravanti");

  return (
    <Box px={{ base: "4", md: "6" }} maxW="4xl">
      <Box
        pt="8"
        mb="6"
        borderBottom="1px solid"
        borderColor="border.subtle"
        pb="4"
      >
        <Heading
          as="h1"
          size={{ base: "xl", md: "2xl" }}
          fontWeight="500"
          color="fg"
        >
          Firm settings
        </Heading>
        <Text textStyle="subheadline" color="fg.muted" mt="1">
          Manage firm-wide defaults that apply across the intake pipeline
        </Text>
      </Box>

      <Stack gap="6">
        <ConsultationFeeDefaults />
      </Stack>
    </Box>
  );
}
