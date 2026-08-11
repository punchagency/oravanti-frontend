import { Box, Text } from "@chakra-ui/react";

export default function PaymentHistoryPage() {
  return (
    <Box maxW="900px">
      <Text fontSize="22px" fontWeight="600" color="fg" mb="2">
        Payment history
      </Text>
      <Text fontSize="13px" color="fg.muted" mb="6">
        View your past payments and invoices.
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
          No payment records.
        </Text>
      </Box>
    </Box>
  );
}
