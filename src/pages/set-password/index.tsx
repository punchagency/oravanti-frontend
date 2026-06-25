import { setPassword } from "@/api/organization";
import { useAuthStore } from "@/store/auth-store";
import { getErrorMessage } from "@/utils/getErrorMessage";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export default function SetPasswordPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const needsPasswordChange = useAuthStore((s) => s.needsPasswordChange);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!needsPasswordChange) {
      navigate("/admin", { replace: true });
    }
  }, [needsPasswordChange, navigate]);

  const mutation = useMutation({
    mutationFn: () => setPassword({ currentPassword, newPassword }),
    onSuccess: () => {
      useAuthStore.getState().setNeedsPasswordChange(false);
      queryClient.invalidateQueries({ queryKey: ["session"] });
      navigate("/admin", { replace: true });
    },
    onError: (err) => {
      setFormError(getErrorMessage(err, "Failed to set password"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setFormError("All fields are required");
      return;
    }

    if (newPassword.length < 8) {
      setFormError("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    mutation.mutate();
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

        <Text
          textStyle="heading"
          color="fg"
          textAlign="center"
          mb={1}
        >
          Set your password
        </Text>
        <Text
          textStyle="subheadline"
          color="fg.muted"
          textAlign="center"
          mb={6}
        >
          {user?.name
            ? `Welcome, ${user.name}. `
            : ""}
          Choose a permanent password for your account.
        </Text>

        <Box as="form" onSubmit={handleSubmit}>
          <VStack gap={4} align="stretch">
            <Field.Root invalid={!!formError}>
              <Field.Label>Current password</Field.Label>
              <Input
                type="password"
                placeholder="Enter your temporary password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
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
              />
            </Field.Root>

            <Field.Root invalid={!!formError}>
              <Field.Label>New password</Field.Label>
              <Input
                type="password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
              />
            </Field.Root>

            <Field.Root invalid={!!formError}>
              <Field.Label>Confirm new password</Field.Label>
              <Input
                type="password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              />
            </Field.Root>

            {formError && (
              <Text color="red.500" fontSize="13px">
                {formError}
              </Text>
            )}

            <Button
              type="submit"
              loading={mutation.isPending}
              layerStyle="brand-button"
              size="lg"
              w="full"
              h="12"
              mt={2}
            >
              {mutation.isPending ? "Saving..." : "Set password"}
            </Button>
          </VStack>
        </Box>
      </Box>
    </Center>
  );
}
