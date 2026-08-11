import { Box, Text } from "@chakra-ui/react";

export default function TimelinePage() {
  return (
    <Box maxW="900px">
      <Text fontSize="22px" fontWeight="600" color="fg" mb="2">
        Timeline
      </Text>
      <Text fontSize="13px" color="fg.muted" mb="6">
        A chronological view of your case progress.
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
          Timeline events will appear here as your case progresses.
        </Text>
      </Box>
    </Box>
  );
}
