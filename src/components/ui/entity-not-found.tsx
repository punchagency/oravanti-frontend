import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";
import { Link } from "react-router";
import { SearchX } from "lucide-react";

interface EntityNotFoundProps {
  entityName: string;
  backTo?: string;
  backLabel?: string;
}

export function EntityNotFound({
  entityName,
  backTo = "/",
  backLabel = "Return to dashboard",
}: EntityNotFoundProps) {
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
        bg="bg.subtle"
        display="flex"
        alignItems="center"
        justifyContent="center"
        color="fg.muted"
      >
        <SearchX size={24} />
      </Box>
      <VStack gap="1">
        <Heading as="h1" fontSize="xl" fontWeight="600" color="fg">
          {entityName} not found
        </Heading>
        <Text color="fg.muted" maxW="md" lineHeight="1.6">
          The {entityName.toLowerCase()} you're looking for doesn't exist or has been removed.
        </Text>
      </VStack>
      <Button asChild size="sm" variant="outline" borderRadius="8px">
        <Link to={backTo}>{backLabel}</Link>
      </Button>
    </VStack>
  );
}
