import { Box, Text } from "@chakra-ui/react";

export default function FeeAgreementPage() {
  return (
    <Box maxW="900px">
      <Text fontSize="22px" fontWeight="600" color="fg" mb="2">
        Fee agreement
      </Text>
      <Text fontSize="13px" color="fg.muted" mb="6">
        Review and sign your fee agreement.
      </Text>
      <Box
        border="1px solid"
        borderColor="border"
        borderRadius="10px"
        p="40px"
        bg="bg"
        textAlign="center"
      >
        <Text fontSize="14px" color="fg.subtle">
          No fee agreement available.
        </Text>
      </Box>
    </Box>
  );
}
