import { Box, Center, Heading, Text, VStack } from "@chakra-ui/react";
import { ShieldOff } from "lucide-react";

export default function PortalAccessDisabledPage() {
  return (
    <Center minH="60vh" px="4">
      <VStack
        maxW="420px"
        w="full"
        gap="6"
        textAlign="center"
        border="1px solid"
        borderColor="border"
        borderRadius="xl"
        p="8"
        bg="bg"
        boxShadow="lg"
      >
        <Box
          bg="bg.error"
          color="fg.error"
          p="4"
          borderRadius="full"
        >
          <ShieldOff size={32} />
        </Box>

        <Heading size="lg" color="fg">
          Portal Access Disabled
        </Heading>

        <Text color="fg.muted" textStyle="body" lineHeight="relaxed">
          Your portal access has been disabled by your firm administrator.
          Please reach out to your firm to regain access.
        </Text>
      </VStack>
    </Center>
  );
}
