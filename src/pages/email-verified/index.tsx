import { getSession } from "@/api/auth";
import { useColorMode } from "@/hooks/use-color-mode";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  Box,
  Button,
  Center,
  IconButton,
  Image,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export default function EmailVerifiedPage() {
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useDocumentTitle("Email verified - Oravanti");

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await getSession();
        const sessionData = res.data as { user?: { id: string } };
        if (sessionData?.user) {
          navigate("/admin", { replace: true });
          return;
        }
      } catch {
        // No session, redirect to login
      }
      navigate("/login", { replace: true });
    };

    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    const redirect = setTimeout(checkSession, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [navigate]);

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
          maxW="480px"
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
            Email verified!
          </Text>
          <Text
            textStyle="subheadline"
            color="fg.muted"
            mb="2"
            maxW="sm"
            mx="auto"
          >
            Your email address has been confirmed. You'll be redirected
            automatically in {countdown} seconds.
          </Text>

          <VStack gap="3" mt="6">
            <Button
              onClick={() => navigate("/admin", { replace: true })}
              layerStyle="brand-button"
              size="lg"
              w="full"
              h="12"
            >
              Continue to dashboard
            </Button>
          </VStack>
        </Box>
      </Center>
    </Box>
  );
}
