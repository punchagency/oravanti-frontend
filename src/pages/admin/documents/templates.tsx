import { useDocumentTitle } from "@/hooks/use-document-title";
import { Box, Flex, Text } from "@chakra-ui/react";
import { Wand2 } from "lucide-react";
import { activePracticeAreas } from "./data";

export function DocumentTemplatesPage() {
  useDocumentTitle("Templates");

  return (
    <Box pt="24px" pb="56px">
      <Text textStyle="heading">Templates</Text>
      <Text color="fg.muted" mt="2px" fontSize="14px">
        Document templates — coming soon
      </Text>

      <Flex
        direction="column"
        align="center"
        justify="center"
        textAlign="center"
        gap="10px"
        minH="420px"
      >
        <Box color="fg.subtle">
          <Wand2 size={26} />
        </Box>
        <Text fontSize="16px" fontWeight="600" color="fg">
          Module coming soon
        </Text>
        <Text fontSize="13px" color="fg.muted">
          This module will adapt to your active practice areas: [
          {activePracticeAreas.join(", ")}]
        </Text>
      </Flex>
    </Box>
  );
}
