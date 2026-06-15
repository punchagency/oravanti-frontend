import { Button, Field, Input, Text, VStack } from "@chakra-ui/react";

type StepEmailInputProps = {
  email: string;
  loading: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function StepEmailInput({
  email,
  loading,
  onChange,
  onSubmit,
}: StepEmailInputProps) {
  return (
    <VStack gap="5" align="stretch">
      <VStack gap="1" align="stretch">
        <Text textStyle="heading" color="fg">
          Enter your email address
        </Text>
        <Text textStyle="subheadline" color="fg.muted">
          We'll detect your email provider and guide you through the connection
          process.
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
