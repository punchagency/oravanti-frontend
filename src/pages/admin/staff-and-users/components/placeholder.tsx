import { Box, Text } from "@chakra-ui/react";

export function Placeholder({ label }: { label: string }) {
  return (
    <Box
      textAlign="center"
      py={12}
      border="1px dashed"
      borderColor="border"
      borderRadius="lg"
      bg="bg"
    >
      <Text color="fg.muted" textStyle="label" mb={2}>
        No active entries for "{label}"
      </Text>
      <Text textStyle="body-sm" color="fg.subtle">
        Additional features will appear here as they are configured.
      </Text>
    </Box>
  );
}
