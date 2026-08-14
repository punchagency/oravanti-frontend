import { useDisableTwoFactorAuth } from "@/hooks/useDisableTwoFactorAuth";
import { useEnableTwoFactorAuth } from "@/hooks/useEnableTwoFactorAuth";
import { useAuthStore } from "@/store/auth-store";
import {
  Box,
  Button,
  Field,
  Fieldset,
  IconButton,
  Input,
  InputGroup,
  Text,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { QRCodeVerify } from "./qr-code-verify";

import {
  twoFactorAuthSchema,
  type TwoFactorAuthForm,
} from "./two-factor-auth-schema";

export function TwoFactorAuth({ onDone }: { onDone: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isEnabled = user?.twoFactorEnabled;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<TwoFactorAuthForm>({
    resolver: zodResolver(twoFactorAuthSchema),
    defaultValues: { password: "" },
  });

  const {
    mutate: enableTwoFactorAuth,
    isPending: isEnablingTwoFactor,
    data: twoFactorData,
    reset: resetTwoFactorData,
  } = useEnableTwoFactorAuth();

  const { mutate: disableTwoFactorAuth, isPending: isDisablingTwoFactor } =
    useDisableTwoFactorAuth();

  const isUpdating = isEnablingTwoFactor || isDisablingTwoFactor;

  function handleDisable(data: TwoFactorAuthForm) {
    disableTwoFactorAuth(data, {
      onSuccess: () => {
        reset();
        onDone();
      },
    });
  }

  function handleEnable(data: TwoFactorAuthForm) {
    enableTwoFactorAuth(data, {
      onSuccess: () => {
        reset();
      },
    });
  }

  if (twoFactorData?.data != null) {
    return (
      <QRCodeVerify
        totpURI={twoFactorData.data.totpURI}
        backupCodes={twoFactorData.data.backupCodes}
        onDone={() => {
          resetTwoFactorData();
          onDone();
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(isEnabled ? handleDisable : handleEnable)}>
      <Box mb={4} color="fg.muted" fontSize="sm">
        {isEnabled ? (
          "Disabling this will remove the extra security layer from your account. You will only be able to access your account with your password."
        ) : (
          <Text>
            Enabling this will provide an extra security layer to your account.
            When logging in, we will ask for a special authentication code from
            your device.
          </Text>
        )}
      </Box>
      <Fieldset.Root>
        <Fieldset.Content>
          <VStack gap="4" width="full" maxW={{ md: "md" }} align="start">
            <Field.Root invalid={"password" in errors}>
              <Field.Label>
                Password
                <Field.RequiredIndicator />
              </Field.Label>
              <InputGroup
                startElement={<Lock size={16} color="gray" />}
                endElement={
                  <IconButton
                    variant="plain"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </IconButton>
                }
              >
                <Input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                />
              </InputGroup>
              <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
            </Field.Root>

            <Button
              layerStyle="brand-button"
              size="md"
              mt="2"
              width={{ base: "full", md: "auto" }}
              type="submit"
              loading={isUpdating}
              disabled={!isDirty}
            >
              {isEnabled ? "Disable" : "Enable"} Two-Factor Authentication
            </Button>
          </VStack>
        </Fieldset.Content>
      </Fieldset.Root>
    </form>
  );
}

export default TwoFactorAuth;
