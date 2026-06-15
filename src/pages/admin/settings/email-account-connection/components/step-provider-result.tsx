import type { EmailProvider } from "@/api/email-accounts";
import {
  Button,
  Center,
  Field,
  Input,
  Separator,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Globe, KeyRound, PlugZap, Settings2 } from "lucide-react";
import { providerLabel } from "../types";

type StepProviderResultProps = {
  provider: EmailProvider;
  password: string;
  loading: boolean;
  oauthLoading: boolean;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onOAuthConnect?: () => void;
  onSkipOAuth?: () => void;
};

export function StepProviderResult({
  provider,
  password,
  loading,
  oauthLoading,
  onPasswordChange,
  onSubmit,
  onOAuthConnect,
  onSkipOAuth,
}: StepProviderResultProps) {
  if (provider === "google" || provider === "microsoft") {
    return (
      <VStack gap="4" align="stretch">
        <Center w="12" h="12" borderRadius="lg" bg="bg.muted" color="fg.muted">
          <Globe size={28} strokeWidth={1.5} />
        </Center>
        <VStack gap="1" align="stretch">
          <Text textStyle="heading" color="fg">
            {providerLabel(provider)} detected
          </Text>
          <Text textStyle="subheadline" color="fg.muted">
            This provider supports OAuth authentication. You can also connect
            using an app password with auto-detection.
          </Text>
        </VStack>

        <Button
          variant="outline"
          loading={oauthLoading}
          loadingText="Opening Google..."
          onClick={onOAuthConnect}
        >
          <Globe size={15} />
          Connect with {provider === "google" ? "Google" : "Microsoft"}
        </Button>

        <Separator />

        <VStack gap="1" align="stretch">
          <Text textStyle="heading" color="fg">
            Connect with app password
          </Text>
          <Text textStyle="subheadline" color="fg.muted">
            Enter an app-specific password and we'll auto-detect your server
            settings.
          </Text>
        </VStack>

        <Field.Root>
          <Field.Label textStyle="label" color="fg.muted">
            App Password
          </Field.Label>

          <Input
            type="password"
            placeholder="Your app password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            bg="bg.input"
            borderColor="border.input"
            focusRingColor="brand.focusRing"
          />
        </Field.Root>

        <Button
          layerStyle="brand-button"
          disabled={!password || loading}
          loading={loading}
          loadingText="Detecting..."
          onClick={onSubmit}
        >
          <PlugZap size={15} />
          Auto-detect & connect
        </Button>

        <Separator />

        <Button variant="outline" colorPalette="gray" onClick={onSkipOAuth}>
          <Settings2 size={15} />
          Configure manually instead
        </Button>
      </VStack>
    );
  }

  return (
    <VStack gap="4" align="stretch">
      <Center w="12" h="12" borderRadius="lg" bg="bg.muted" color="fg.muted">
        <KeyRound size={28} strokeWidth={1.5} />
      </Center>
      <VStack gap="1" align="stretch">
        <Text textStyle="heading" color="fg">
          Custom email provider
        </Text>
        <Text textStyle="subheadline" color="fg.muted">
          Enter your email password. We'll try to automatically detect your
          server settings.
        </Text>
      </VStack>

      <Field.Root>
        <Field.Label textStyle="label" color="fg.muted">
          Password
        </Field.Label>

        <Input
          type="password"
          placeholder="Your email password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          bg="bg.input"
          borderColor="border.input"
          focusRingColor="brand.focusRing"
        />
      </Field.Root>

      <Button
        layerStyle="brand-button"
        disabled={!password || loading}
        loading={loading}
        loadingText="Detecting..."
        onClick={onSubmit}
      >
        <PlugZap size={15} />
        Auto-detect & connect
      </Button>
    </VStack>
  );
}
