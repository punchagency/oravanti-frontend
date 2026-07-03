import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";
import { Link } from "react-router";
import { useDocumentTitle } from "@/hooks/use-document-title";

export function NotFoundPage() {
  useDocumentTitle("Coming soon - Oravanti");

  return (
    <VStack
      align="center"
      justify="center"
      gap="6"
      h="100%"
      p="8"
      textAlign="center"
    >
      <Box
        w="12"
        h="12"
        borderRadius="xl"
        bg="brand.subtle"
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontSize="xl"
        color="brand.fg"
      >
        &#9670;
      </Box>
      <VStack gap="1">
        <Heading as="h1" fontSize="2xl" fontWeight="600" color="fg">
          Coming soon
        </Heading>
        <Text color="fg.muted" maxW="md" lineHeight="1.6">
          This feature is currently in development and will be available soon.
        </Text>
      </VStack>
      <Button asChild layerStyle="brand-button" size="sm" borderRadius="8px">
        <Link to="/">Return to dashboard</Link>
      </Button>
    </VStack>
  );
}
