import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";
import { Link } from "react-router";
import { useDocumentTitle } from "@/hooks/use-document-title";

export function NotFoundPage() {
  useDocumentTitle("Page not found - Oravanti");

  return (
    <VStack align="start" gap="4">
      <Box>
        <Heading as="h1" fontSize="22px" fontWeight="500">
          Page not found
        </Heading>
        <Text mt="2" color="var(--text-secondary)">
          This route is not part of the current scaffold.
        </Text>
      </Box>
      <Button asChild className="brand-button" size="sm" borderRadius="8px">
        <Link to="/dashboard">Return to dashboard</Link>
      </Button>
    </VStack>
  );
}
