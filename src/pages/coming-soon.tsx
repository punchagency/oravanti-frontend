import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";
import { Link } from "react-router";
import { useDocumentTitle } from "@/hooks/use-document-title";

type ComingSoonPageProps = {
  title?: string;
  description?: string;
  showBack?: boolean;
  backTo?: string;
};

export function ComingSoonPage({
  title = "Coming soon",
  description = "This feature is currently in development and will be available soon.",
  showBack = true,
  backTo = "/",
}: ComingSoonPageProps) {
  useDocumentTitle("Coming soon - Oravanti");

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
        bg="brand.subtle"
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontSize="xl"
        color="brand.contrast"
      >
        &#9670;
      </Box>
      <VStack gap="1">
        <Heading as="h1" fontSize="2xl" fontWeight="600" color="fg">
          {title}
        </Heading>
        <Text color="fg.muted" maxW="md" lineHeight="1.6">
          {description}
        </Text>
      </VStack>
      {showBack ? (
        <Button asChild layerStyle="brand-button" size="sm" borderRadius="8px">
          <Link to={backTo}>Return to dashboard</Link>
        </Button>
      ) : null}
    </VStack>
  );
}
