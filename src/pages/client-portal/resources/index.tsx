import { Box, Text } from "@chakra-ui/react";

export default function ResourcesPage() {
  return (
    <Box maxW="900px">
      <Text fontSize="22px" fontWeight="600" color="fg" mb="2">
        Resources
      </Text>
      <Text fontSize="13px" color="fg.muted" mb="6">
        Helpful resources and guides for your case.
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
          No resources available yet.
        </Text>
      </Box>
    </Box>
  );
}
