import { useColorMode } from "@/hooks/use-color-mode";
import useResendPasswordResetEmail from "@/hooks/useResendPasswordResetEmail";
import {
  Box,
  Button,
  Center,
  IconButton,
  Image,
  Link,
  Span,
  Text,
  VStack,
} from "@chakra-ui/react";
import { CheckCircle } from "lucide-react";
import { Navigate, Link as RouterLink, useLocation } from "react-router";

const ForgotPasswordSuccess = () => {
  const location = useLocation();
  const email = location.state?.email;
  const { colorMode, toggleColorMode } = useColorMode();
  const { resend, isResending, resendTimer, formatTimer } =
    useResendPasswordResetEmail({
      email,
      redirectTo: `${import.meta.env.VITE_BASEURL}/reset-password`,
      storageKey: "forgot_password_resend_expires_at",
    });

  if (!email) {
    return <Navigate to="/forgot-password" replace />;
  }

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
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
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
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          )}
        </IconButton>
      </Box>

      <Center minH="100vh" padding={{ base: 4, sm: 6 }} py={{ base: 8, md: 4 }}>
        <Box
          layerStyle="surface-card"
          p={{ base: 4, sm: 6, md: 10 }}
          w="full"
          maxW="540px"
          textAlign="center"
        >
          <Image
            src="/oravanti_logo.png"
            alt="Oravanti Logo"
            w={10}
            mx="auto"
            mb={4}
          />

          <Box fontSize="2.5rem" color="brand.solid" mb="1">
            <CheckCircle />
          </Box>

          <Text textStyle="heading" color="fg" mb="1">
            Check your email
          </Text>
          <Text textStyle="subheadline" color="fg.muted" mb="8">
            We sent a password reset link to{" "}
            <Span fontWeight="semibold">{email}</Span>. Click the link to choose
            a new password. Can't find it? Check your Spam, Junk, or Promotions
            folders.
          </Text>

          <VStack gap="5" align="stretch">
            <Button layerStyle="brand-button" size="lg" w="full" h="12" asChild>
              <RouterLink to="/login">Back to login</RouterLink>
            </Button>
          </VStack>

          <Text textStyle="body-sm" fontWeight="500" mt="4">
            Didn't receive the email?{" "}
            <Link
              textDecoration="underline"
              color="brand.500"
              asChild
              onClick={() => resend()}
              aria-disabled={isResending || resendTimer > 0}
            >
              <Text
                as="button"
                cursor={
                  isResending || resendTimer > 0 ? "not-allowed" : "pointer"
                }
                opacity={isResending || resendTimer > 0 ? 0.5 : 1}
              >
                {resendTimer > 0
                  ? `Resend in ${formatTimer()}`
                  : "Resend reset email"}
              </Text>
            </Link>
          </Text>
        </Box>
      </Center>
    </Box>
  );
};

export default ForgotPasswordSuccess;
