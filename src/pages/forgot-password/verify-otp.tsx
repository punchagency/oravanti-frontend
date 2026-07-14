import { useColorMode } from "@/hooks/use-color-mode";
import {
  Box,
  Button,
  Center,
  Field,
  IconButton,
  Image,
  Input,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink, useLocation, useNavigate } from "react-router";
import { z } from "zod";

const otpSchema = z.object({
  otp: z
    .string()
    .min(6, "Code must be 6 digits.")
    .max(6, "Code must be 6 digits.")
    .trim(),
});

type OtpFormData = z.infer<typeof otpSchema>;

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const { colorMode, toggleColorMode } = useColorMode();

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password", { replace: true });
    }
  }, [email, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const onSubmit = (data: OtpFormData) => {
    navigate("/reset-password", { state: { email, otp: data.otp } });
  };

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
          position="relative"
        >
          <IconButton
            size="sm"
            variant="ghost"
            position="absolute"
            top="4"
            left="4"
            aria-label="Back to forgot password"
            color="fg.muted"
            _hover={{ bg: "bg.muted", color: "fg" }}
            onClick={() => navigate("/forgot-password")}
          >
            <ArrowLeft />
          </IconButton>

          <Image
            src="/oravanti_logo.png"
            alt="Oravanti Logo"
            w={10}
            mx="auto"
            mb={4}
          />

          <Text textStyle="heading" color="fg" mb="1">
            Verify your email
          </Text>
          <Text textStyle="subheadline" color="fg.muted" mb="8">
            Enter the 6-digit code sent to <b>{email}</b>.
          </Text>

          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack gap="5" align="stretch">
              <Field.Root invalid={!!errors.otp} textAlign="left">
                <Field.Label textStyle="label" color="fg.muted">
                  Verification code
                </Field.Label>
                <Input
                  type="text"
                  maxLength={6}
                  bg="bg.input"
                  borderColor="border.input"
                  focusRingColor="brand.focusRing"
                  placeholder="123456"
                  size="lg"
                  textAlign="center"
                  letterSpacing="wider"
                  {...register("otp")}
                />
                <Field.ErrorText>{errors.otp?.message}</Field.ErrorText>
              </Field.Root>

              <Button
                type="submit"
                layerStyle="brand-button"
                size="lg"
                w="full"
                mt="2"
                h="12"
              >
                Verify Code
              </Button>
            </VStack>
          </form>

          <Text textStyle="body-sm" fontWeight="500" mt="4">
            Didn't receive it?{" "}
            <Link
              textDecoration="underline"
              color="brand.500"
              asChild
              onClick={() => navigate("/forgot-password")}
            >
              <RouterLink to="/forgot-password">Resend code</RouterLink>
            </Link>
          </Text>
        </Box>
      </Center>
    </Box>
  );
};

export default VerifyOtp;
