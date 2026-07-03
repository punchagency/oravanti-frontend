import {
  Badge,
  Button,
  HStack,
  Text,
} from "@chakra-ui/react";
import { RefreshCw } from "lucide-react";
import { SectionLabel } from "../../shared";

export function AiReview() {
  return (
    <>
      <SectionLabel>AI case review</SectionLabel>
      <HStack gap={1.5} mb={2} flexWrap="wrap">
        <Badge
          size="xs"
          borderRadius="full"
          px={2}
          py={0.5}
          bg="blue.50"
          color="blue.700"
          fontWeight="500"
          fontSize="10px"
          textTransform="none"
        >
          Review pending
        </Badge>
      </HStack>
      <Text color="fg.muted" fontSize="12px" lineHeight="150%" mb={2}>
        AI review is running for this matter. Results will appear
        here once complete.
      </Text>
      <Button
        size="xs"
        variant="outline"
        borderColor="border"
        w={{ base: "full", md: "auto" }}
        h="28px"
        fontSize="11px"
        fontWeight="400"
        color="fg"
      >
        <RefreshCw size={12} />
        Refresh
      </Button>
    </>
  );
}
