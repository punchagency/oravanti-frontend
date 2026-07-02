import { Box, Text, VStack } from "@chakra-ui/react";
import { CheckCircle } from "lucide-react";
import { SectionLabel } from "../../shared";

export function PendingActions() {
  return (
    <>
      <SectionLabel>Pending actions</SectionLabel>
      <Text color="fg.muted" fontSize="12px" lineHeight="150%" mb={3}>
        What needs to happen next and who owns it
      </Text>

      <VStack
        align="center"
        py={6}
        gap={2}
        border="1px dashed"
        borderColor="border.muted"
        borderRadius="lg"
      >
        <Box color="green.500">
          <CheckCircle size={24} />
        </Box>
        <Text fontSize="12px" fontWeight="500" color="fg.muted">
          No pending actions
        </Text>
        <Text fontSize="12px" color="fg.subtle">
          All tasks are up to date.
        </Text>
      </VStack>
    </>
  );
}
