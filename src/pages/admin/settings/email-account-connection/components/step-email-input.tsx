import { Button, Field, HStack, Input, Separator, Text, VStack } from "@chakra-ui/react";
import { GoogleIcon, MicrosoftIcon } from "./icons";

type StepEmailInputProps = {
  email: string;
  loading: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onGoogleConnect: () => void;
  onMicrosoftConnect: () => void;
};

export function StepEmailInput({
  email,
  loading,
  onChange,
  onSubmit,
  onGoogleConnect,
  onMicrosoftConnect,
}: StepEmailInputProps) {
  return (
    <VStack gap="5" align="stretch">
      <VStack gap="1" align="stretch">
        <Text textStyle="heading" color="fg">
          Quick connect
        </Text>
        <Text textStyle="subheadline" color="fg.muted">
          Connect your email account with one click.
        </Text>
      </VStack>

      <HStack gap="3" flexWrap="wrap">
        <Button
          variant="outline"
          onClick={onGoogleConnect}
          flex={{ base: 1, sm: "initial" }}
        >
          <GoogleIcon width={15} height={15} />
          Connect Google
        </Button>
        <Button
          variant="outline"
          onClick={onMicrosoftConnect}
          flex={{ base: 1, sm: "initial" }}
        >
          <MicrosoftIcon width={15} height={15} />
          Connect Microsoft
        </Button>
      </HStack>

      <Separator />

      <VStack gap="1" align="stretch">
        <Text textStyle="heading" color="fg">
          Or connect with email
        </Text>
        <Text textStyle="subheadline" color="fg.muted">
          Enter your email address and we'll guide you through the rest.
        </Text>
      </VStack>

      <Field.Root>
        <Field.Label textStyle="label" color="fg.muted">
          Email address
        </Field.Label>

        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          bg="bg.input"
          borderColor="border.input"
          focusRingColor="brand.focusRing"
        />
      </Field.Root>

      <Button
        layerStyle="brand-button"
        disabled={!email.includes("@") || loading}
        onClick={onSubmit}
        size={{ base: "sm", md: "md" }}
      >
        {loading ? "Checking..." : "Continue"}
      </Button>
    </VStack>
  );
}
