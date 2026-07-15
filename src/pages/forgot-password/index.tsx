import { useColorMode } from "@/hooks/use-color-mode";
import useSendOtp from "@/hooks/useSendOtp";
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
import { useForm } from "react-hook-form";
import { Link as RouterLink, useNavigate } from "react-router";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address.").trim(),
});

type EmailFormData = z.infer<typeof emailSchema>;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { mutate: sendOtp, isPending } = useSendOtp();
  const { colorMode, toggleColorMode } = useColorMode();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: EmailFormData) => {
    sendOtp(
      { email: data.email, type: "forget-password" },
      {
        onSuccess: () => {
          navigate("/forgot-password/verify-otp", {
            state: { email: data.email },
          });
        },
      },
    );
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
          <RouterLink to="/login">
            <IconButton
              size="sm"
              variant="ghost"
              position="absolute"
              top="4"
              left="4"
              aria-label="Back to login"
              color="fg.muted"
              _hover={{ bg: "bg.muted", color: "fg" }}
            >
              <ArrowLeft />
            </IconButton>
          </RouterLink>

          <Image
            src="/oravanti_logo.png"
            alt="Oravanti Logo"
            w={10}
            mx="auto"
            mb={4}
          />

          <Text textStyle="heading" color="fg" mb="1">
            Forgot password
          </Text>
          <Text textStyle="subheadline" color="fg.muted" mb="8">
            Enter your email to receive a verification code.
          </Text>

          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack gap="5" align="stretch">
              <Field.Root invalid={!!errors.email} textAlign="left">
                <Field.Label textStyle="label" color="fg.muted">
                  Email address
                </Field.Label>
                <Input
                  type="email"
                  bg="bg.input"
                  borderColor="border.input"
                  focusRingColor="brand.focusRing"
                  placeholder="e.g. attorney@firm.com"
                  size="lg"
                  {...register("email")}
                />
                <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
              </Field.Root>

              <Button
                type="submit"
                loading={isPending}
                layerStyle="brand-button"
                size="lg"
                w="full"
                mt="2"
                h="12"
              >
                Send Verification Code
              </Button>
            </VStack>
          </form>

          <Text
            textStyle="body-sm"
            fontWeight="500"
            mt="4"
          >
            Remember your password?{" "}
            <Link textDecoration="underline" color="brand.500" asChild>
              <RouterLink to="/login">Log in</RouterLink>
            </Link>
          </Text>
        </Box>
      </Center>
    </Box>
  );
};

export default ForgotPassword;
