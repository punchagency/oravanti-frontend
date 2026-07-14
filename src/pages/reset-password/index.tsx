import { useColorMode } from "@/hooks/use-color-mode";
import useResetPassword from "@/hooks/useResetPassword";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Box,
  Button,
  Center,
  Field,
  IconButton,
  Image,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink, useLocation, useNavigate, useSearchParams } from "react-router";
import { z } from "zod";

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long.")
      .trim(),
    confirmPassword: z.string().trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const otp = location.state?.otp;
  const { colorMode, toggleColorMode } = useColorMode();

  const { mutate: resetPassword, isPending } = useResetPassword();

  useEffect(() => {
    if (!token && (!email || !otp)) {
      navigate("/forgot-password", { replace: true });
    }
  }, [token, email, otp, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = (data: PasswordFormData) => {
    resetPassword({
      type: "otp",
      email: email,
      otp: otp,
      password: data.password,
    });
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
            Reset your password
          </Text>
          <Text textStyle="subheadline" color="fg.muted" mb="8">
            Enter a new password to update your account access.
          </Text>

          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack gap="5" align="stretch">
              <Field.Root invalid={!!errors.password} textAlign="left">
                <Field.Label textStyle="label" color="fg.muted">
                  New password
                </Field.Label>
                <PasswordInput
                  bg="bg.input"
                  borderColor="border.input"
                  focusRingColor="brand.focusRing"
                  placeholder="Enter new password"
                  size="lg"
                  {...register("password")}
                />
                <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
              </Field.Root>

              <Field.Root invalid={!!errors.confirmPassword} textAlign="left">
                <Field.Label textStyle="label" color="fg.muted">
                  Confirm new password
                </Field.Label>
                <PasswordInput
                  bg="bg.input"
                  borderColor="border.input"
                  focusRingColor="brand.focusRing"
                  placeholder="Re-enter new password"
                  size="lg"
                  {...register("confirmPassword")}
                />
                <Field.ErrorText>
                  {errors.confirmPassword?.message}
                </Field.ErrorText>
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
                Reset password
              </Button>
            </VStack>
          </form>

          <Text textStyle="body-sm" fontWeight="500" mt="4">
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

export default ResetPassword;
