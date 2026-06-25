import {
  Box,
  Button,
  Heading,
  Image,
  Span,
  Stack,
  Text,
} from "@chakra-ui/react";
import { CheckCircle } from "lucide-react";
import { Link, Navigate, useLocation } from "react-router";
import useResendPasswordResetEmail from "@/hooks/useResendPasswordResetEmail";
import logo from "../../assets/images/oravanti_logo.png";

const ForgotPasswordSuccess = () => {
  const location = useLocation();
  const email = location.state?.email;
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
    <Box py={20} minH="dvh" px={4}>
      <Stack align="center">
        <Image src={logo} alt="Oravanti Logo" w={20} />
        <Box textAlign="center">
          <Heading fontWeight="semibold">Oravanti</Heading>
          <Text fontSize="sm" color="fg.subtle">
            Immigration Attorney Platform
          </Text>
        </Box>

        <Box
          mt={6}
          maxW="md"
          w="full"
          borderColor="border"
          borderWidth="1px"
          rounded="md"
          px={6}
          py={10}
          bg="bg.subtle"
        >
          <Stack gap={4} align="center" textAlign="center">
            <Box fontSize="48px">
              <CheckCircle />
            </Box>
            <Heading size="md">Check your email</Heading>
            <Text color="fg.muted" fontSize="sm">
              We sent a password reset link to{" "}
              <Span fontWeight="semibold">{email}</Span>. Click the link to
              choose a new password. Can’t find it? Check your Spam, Junk, or
              Promotions folders.
            </Text>

            <Link to="/login">
              <Button w="full" variant={"outline"}>
                Back to login
              </Button>
            </Link>
          </Stack>

          <Stack gap={2} mt={4} align="center" textAlign="center">
            <Text color="fg.muted" fontSize="xs">
              Didn't receive the email?
            </Text>

            <Button
              variant={"subtle"}
              size={"xs"}
              onClick={() => resend()}
              disabled={isResending || resendTimer > 0}
              loading={isResending}
            >
              {resendTimer > 0 ? formatTimer() : "Resend reset email"}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

export default ForgotPasswordSuccess;
