import {
  Box,
  Button,
  Center,
  Text,
  VStack,
} from "@chakra-ui/react";

export const SuccessStep = () => {
  return (
    <Center py="8">
      <VStack gap="6" textAlign="center" maxW="400px">
        <Box
          w="12"
          h="12"
          borderRadius="full"
          bg="accent.admin"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="white"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            width="20px"
            height="20px"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </Box>
        <Box>
          <Text textStyle="heading" color="fg" mb="2">
            You're all set
          </Text>
          <Text textStyle="body-sm" color="fg.muted" lineHeight="relaxed">
            Your Oravanti workspace is active. You're signed in as
            managing partner. Your selected add-ons are ready to
            configure.
          </Text>
        </Box>
        <Button w="full" layerStyle="brand-button" h="11" type="button">
          Go to firm dashboard
        </Button>
      </VStack>
    </Center>
  );
};
