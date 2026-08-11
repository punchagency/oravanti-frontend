import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";
import { Link } from "react-router";
import { useDocumentTitle } from "@/hooks/use-document-title";

export function NotFoundPage() {
  useDocumentTitle("Page not found - Oravanti");

  return (
    <VStack
      align="center"
      justify="center"
      gap="6"
      h="100%"
      minH="320px"
      p="8"
      textAlign="center"
    >
      <Box
        w="12"
        h="12"
        borderRadius="xl"
        bg="bg.muted"
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontSize="sm"
        fontWeight="600"
        color="fg.muted"
      >
        404
      </Box>
      <VStack gap="1">
        <Heading as="h1" fontSize="2xl" fontWeight="600" color="fg">
          Page not found
        </Heading>
        <Text color="fg.muted" maxW="md" lineHeight="1.6">
          The page you're looking for doesn't exist or may have been moved.
        </Text>
      </VStack>
      <Button asChild layerStyle="brand-button" size="sm" borderRadius="8px">
        <Link to="/">Return to dashboard</Link>
      </Button>
    </VStack>
  );
}
