import { useSetPassword } from "@/hooks/use-set-password";
import { useAuthStore } from "@/store/auth-store";
import {
  Box,
  Button,
  Center,
  Field,
  Image,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";

const setPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(128, "New password cannot exceed 128 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SetPasswordFormData = z.infer<typeof setPasswordSchema>;

export default function SetPasswordPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const needsPasswordChange = useAuthStore((s) => s.needsPasswordChange);
  const setPasswordMutation = useSetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!needsPasswordChange) {
      navigate("/", { replace: true });
    }
  }, [needsPasswordChange, navigate]);

  const onSubmit: SubmitHandler<SetPasswordFormData> = (data) => {
    setPasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  return (
    <Center minH="100vh" bg="bg.subtle" px={4}>
      <Box
        layerStyle="surface-card"
        p={{ base: 8, md: 12 }}
        w="full"
        maxW="480px"
      >
        <Image
          src="/oravanti_logo.png"
          alt="Oravanti Logo"
          w={12}
          mx="auto"
          mb={6}
        />

        <Text textStyle="heading" color="fg" textAlign="center" mb={1}>
          Set your password
        </Text>
        <Text
          textStyle="subheadline"
          color="fg.muted"
          textAlign="center"
          mb={6}
        >
          {user?.name ? `Welcome, ${user.name}. ` : ""}
          Choose a permanent password for your account.
        </Text>

        <Box as="form" onSubmit={handleSubmit(onSubmit)}>
          <VStack gap={4} align="stretch">
            <Field.Root invalid={!!errors.currentPassword}>
              <Field.Label>Current password</Field.Label>
              <Input
                type="password"
                placeholder="Enter your temporary password"
                h="44px"
                px="14px"
                border="1px solid"
                borderColor="border"
                borderRadius="8px"
                bg="bg"
                color="fg"
                fontSize="14px"
                _placeholder={{ color: "fg.muted" }}
                _focus={{
                  borderColor: "brand.solid",
                  boxShadow: "0 0 0 1px var(--brand-cta)",
                }}
                {...register("currentPassword")}
              />
              <Field.ErrorText>
                {errors.currentPassword?.message}
              </Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!errors.newPassword}>
              <Field.Label>New password</Field.Label>
              <Input
                type="password"
                placeholder="At least 8 characters"
                h="44px"
                px="14px"
                border="1px solid"
                borderColor="border"
                borderRadius="8px"
                bg="bg"
                color="fg"
                fontSize="14px"
                _placeholder={{ color: "fg.muted" }}
                _focus={{
                  borderColor: "brand.solid",
                  boxShadow: "0 0 0 1px var(--brand-cta)",
                }}
                {...register("newPassword")}
              />
              <Field.ErrorText>
                {errors.newPassword?.message}
              </Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!errors.confirmPassword}>
              <Field.Label>Confirm new password</Field.Label>
              <Input
                type="password"
                placeholder="Re-enter your new password"
                h="44px"
                px="14px"
                border="1px solid"
                borderColor="border"
                borderRadius="8px"
                bg="bg"
                color="fg"
                fontSize="14px"
                _placeholder={{ color: "fg.muted" }}
                _focus={{
                  borderColor: "brand.solid",
                  boxShadow: "0 0 0 1px var(--brand-cta)",
                }}
                {...register("confirmPassword")}
              />
              <Field.ErrorText>
                {errors.confirmPassword?.message}
              </Field.ErrorText>
            </Field.Root>

            <Button
              type="submit"
              loading={setPasswordMutation.isPending}
              layerStyle="brand-button"
              size="lg"
              w="full"
              h="12"
              mt={2}
            >
              {setPasswordMutation.isPending ? "Saving..." : "Set password"}
            </Button>
          </VStack>
        </Box>
      </Box>
    </Center>
  );
}
