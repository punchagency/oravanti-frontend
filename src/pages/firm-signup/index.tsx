import { signUpAsFirmAdmin } from "@/api/auth";
import { PasswordInput } from "@/components/ui/password-input";
import type { APIError } from "@/hooks/types";
import { useColorMode } from "@/hooks/use-color-mode";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useFeedbackDialog } from "@/hooks/useFeedbackDialog";
import { getErrorMessage } from "@/utils/getErrorMessage";
import {
  Box,
  Button,
  Center,
  Field,
  IconButton,
  Image,
  Input,
  Link,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Link as RouterLink } from "react-router";
import { z } from "zod";

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z
    .string()
    .min(1, "Work email is required")
    .email("Must be a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters"),
});

type SignupFormData = z.infer<typeof signupSchema>;

export const FirmSignupFlow = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { showError, showSuccess } = useFeedbackDialog();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
  });

  useDocumentTitle("Sign up - Oravanti");

  const signupMutation = useMutation({
    mutationFn: signUpAsFirmAdmin,
    onSuccess: () => {
      showSuccess({
        title: "Account created",
        description: "Check your email for the verification link.",
      });
      window.location.href = "/login";
    },
    onError: (error: APIError) => {
      showError({
        title: "Sign up failed",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });

  const onSubmit: SubmitHandler<SignupFormData> = (data) => {
    signupMutation.mutate(data);
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

      <Center minH="100vh" padding={{ base: 4, sm: 6 }} py={{ base: 8, md: 4 }}>
        <Box
          layerStyle="surface-card"
          p={{ base: 6, md: 10 }}
          w="full"
          maxW="480px"
          textAlign="center"
        >
          <Image
            src="/oravanti_logo.png"
            alt="Oravanti Logo"
            w={10}
            mx="auto"
            mb={4}
          />

          <Text textStyle="heading" color="fg" mb="1">
            Create your firm account
          </Text>
          <Text textStyle="subheadline" color="fg.muted" mb="8">
            Enter your details to get started.
          </Text>

          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack gap="5" align="stretch">
              <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
                <Field.Root invalid={!!errors.firstName} textAlign="left">
                  <Field.Label textStyle="label" color="fg.muted">
                    First name
                  </Field.Label>
                  <Input
                    id="firstName"
                    bg="bg.input"
                    borderColor="border.input"
                    focusRingColor="brand.focusRing"
                    placeholder="e.g. Jane"
                    size="lg"
                    {...register("firstName")}
                  />
                  <Field.ErrorText>{errors.firstName?.message}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.lastName} textAlign="left">
                  <Field.Label textStyle="label" color="fg.muted">
                    Last name
                  </Field.Label>
                  <Input
                    id="lastName"
                    bg="bg.input"
                    borderColor="border.input"
                    focusRingColor="brand.focusRing"
                    placeholder="e.g. Smith"
                    size="lg"
                    {...register("lastName")}
                  />
                  <Field.ErrorText>{errors.lastName?.message}</Field.ErrorText>
                </Field.Root>
              </SimpleGrid>

              <Field.Root invalid={!!errors.email} textAlign="left">
                <Field.Label textStyle="label" color="fg.muted">
                  Work email
                </Field.Label>
                <Input
                  id="email"
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

              <Field.Root invalid={!!errors.password} textAlign="left">
                <Field.Label textStyle="label" color="fg.muted">
                  Password
                </Field.Label>
                <PasswordInput
                  id="password"
                  bg="bg.input"
                  borderColor="border.input"
                  focusRingColor="brand.focusRing"
                  placeholder="At least 8 characters"
                  size="lg"
                  {...register("password")}
                />
                <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
              </Field.Root>

              <Button
                type="submit"
                loading={signupMutation.isPending}
                layerStyle="brand-button"
                size="lg"
                w="full"
                h="12"
                mt="2"
              >
                Create account
              </Button>
            </VStack>
          </form>

          <Text textStyle="body-sm" fontWeight="500" as="button" mt="4">
            Already have an account?{" "}
            <Link textDecoration="underline" color="brand.500" asChild>
              <RouterLink to="/login">Log in</RouterLink>
            </Link>
          </Text>
        </Box>
      </Center>
    </Box>
  );
};
