import { useColorMode } from "@/hooks/use-color-mode";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useAuthRefresh } from "@/hooks/useAuthRefresh";
import { useAuthStore } from "@/store/auth-store";
import { Box, Center, IconButton, Image, Text, VStack } from "@chakra-ui/react";

export default function VerifyEmailNoticePage() {
  const { colorMode, toggleColorMode } = useColorMode();
  const { refetch } = useAuthStore();
  const { isLoading } = useAuthRefresh();

  useDocumentTitle("Verify your email - Oravanti");

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     refetch();
  //   }, 5000);
  //   return () => clearInterval(interval);
  // }, [refetch]);

  return (
    <Box minH="100vh" bg="bg.subtle" position="relative">
      <Box position="absolute" top="4" right="4" zIndex="sticky">
        <IconButton
          onClick={toggleColorMode}
          variant="ghost"
          aria-label="Toggle color mode"
          borderRadius="full"
          color="fg.muted"
          _hover={{ bg: "bg.muted", color: "fg" }}
        >
          {colorMode === "light" ? (
            <svg
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              height="1.2em"
              width="1.2em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              height="1.2em"
              width="1.2em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </IconButton>
      </Box>

      <Center minH="100vh" padding={{ base: 4, sm: 6 }}>
        <Box
          layerStyle="surface-card"
          p={{ base: 8, md: 12 }}
          w="full"
          maxW="500px"
          textAlign="center"
        >
          <Image
            src="/oravanti_logo.png"
            alt="Oravanti Logo"
            w={12}
            mx="auto"
            mb={6}
          />

          <Text textStyle="heading" color="fg" mb="2">
            Verify your email
          </Text>
          <Text
            textStyle="subheadline"
            color="fg.muted"
            mb="6"
            maxW="sm"
            mx="auto"
          >
            We sent a verification link to your email address. Click the link to
            activate your account and access the onboarding flow.
          </Text>

          <VStack gap="3">
            {/* <Button
              onClick={() => refetch()}
              loading={isLoading}
              layerStyle="brand-button"
              size="lg"
              w="full"
              h="12"
            >
              I've verified my email
            </Button> */}
            <Text textStyle="body-sm" color="fg.muted">
              Didn't receive the email? Check your spam folder.
            </Text>
          </VStack>
        </Box>
      </Center>
    </Box>
  );
}
