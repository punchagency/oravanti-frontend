import { Box, HStack, Text } from "@chakra-ui/react";
import { Info } from "lucide-react";

export function OpposingPartyCard() {
  return (
    <Box
      border="1px solid"
      borderColor="blue.300"
      borderRadius="lg"
      bg="blue.subtle"
      p={4}
    >
      <HStack gap={2}>
        <Box color="blue.fg" flexShrink={0}>
          <Info size={14} />
        </Box>
        <Text fontSize="13px" color="blue.fg" lineHeight="140%">
          No opposing party logged for this matter.
        </Text>
      </HStack>
    </Box>
  );
}
