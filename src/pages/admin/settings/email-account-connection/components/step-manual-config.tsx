import {
  Box,
  Button,
  Checkbox,
  Field,
  HStack,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Inbox, Plug } from "lucide-react";

type StepManualConfigProps = {
  email: string;
  password: string;
  protocol: "imap" | "pop3";
  imapHost: string;
  imapPort: string;
  pop3Host: string;
  pop3Port: string;
  smtpHost: string;
  smtpPort: string;
  secure: boolean;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onProtocolChange: (value: "imap" | "pop3") => void;
  onImapHostChange: (value: string) => void;
  onImapPortChange: (value: string) => void;
  onPop3HostChange: (value: string) => void;
  onPop3PortChange: (value: string) => void;
  onSmtpHostChange: (value: string) => void;
  onSmtpPortChange: (value: string) => void;
  onSecureChange: (value: boolean) => void;
  onSubmit: () => void;
};

export function StepManualConfig({
  email,
  password,
  protocol,
  imapHost,
  imapPort,
  pop3Host,
  pop3Port,
  smtpHost,
  smtpPort,
  secure,
  loading,
  onEmailChange,
  onPasswordChange,
  onProtocolChange,
  onImapHostChange,
  onImapPortChange,
  onPop3HostChange,
  onPop3PortChange,
  onSmtpHostChange,
  onSmtpPortChange,
  onSecureChange,
  onSubmit,
}: StepManualConfigProps) {
  return (
    <VStack gap="5" align="stretch">
      <VStack gap="1" align="stretch">
        <Text textStyle="heading" color="fg">
          Manual server configuration
        </Text>
        <Text textStyle="subheadline" color="fg.muted">
          Enter your email credentials and server settings to connect manually.
        </Text>
      </VStack>

      <Box
        display="grid"
        gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }}
        gap="3.5"
      >
        <Field.Root>
          <Field.Label textStyle="label" color="fg.muted">
            Email / Username
          </Field.Label>

          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            bg="bg.input"
            borderColor="border.input"
            focusRingColor="brand.focusRing"
          />
        </Field.Root>
        <Field.Root>
          <Field.Label textStyle="label" color="fg.muted">
            Password
          </Field.Label>

          <Input
            type="password"
            placeholder="Your email password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            h="10"
            bg="bg.input"
            borderColor="border.input"
            focusRingColor="brand.focusRing"
          />
        </Field.Root>
      </Box>

      <Box>
        <Text textStyle="label" color="fg.muted" mb="2">
          Incoming mail protocol
        </Text>
        <HStack gap="2">
          <Button
            size="sm"
            variant={protocol === "imap" ? "solid" : "outline"}
            colorPalette={protocol === "imap" ? "brand" : "gray"}
            onClick={() => onProtocolChange("imap")}
            flex="1"
          >
            <Inbox size={14} />
            IMAP
          </Button>
          <Button
            size="sm"
            variant={protocol === "pop3" ? "solid" : "outline"}
            colorPalette={protocol === "pop3" ? "brand" : "gray"}
            onClick={() => onProtocolChange("pop3")}
            flex="1"
          >
            <Inbox size={14} />
            POP3
          </Button>
        </HStack>
      </Box>

      <Box
        display="grid"
        gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }}
        gap="3.5"
      >
        {protocol === "imap" ? (
          <>
            <Field.Root>
              <Field.Label textStyle="label" color="fg.muted">
                IMAP Host
              </Field.Label>
              <Input
                placeholder="imap.example.com"
                value={imapHost}
                onChange={(e) => onImapHostChange(e.target.value)}
                bg="bg.input"
                borderColor="border.input"
                focusRingColor="brand.focusRing"
              />
            </Field.Root>
            <Field.Root>
              <Field.Label textStyle="label" color="fg.muted">
                IMAP Port
              </Field.Label>
              <Input
                type="number"
                placeholder="993"
                value={imapPort}
                onChange={(e) => onImapPortChange(e.target.value)}
                bg="bg.input"
                borderColor="border.input"
                focusRingColor="brand.focusRing"
              />
            </Field.Root>
          </>
        ) : (
          <>
            <Field.Root>
              <Field.Label textStyle="label" color="fg.muted">
                POP3 Host
              </Field.Label>
              <Input
                placeholder="pop3.example.com"
                value={pop3Host}
                onChange={(e) => onPop3HostChange(e.target.value)}
                bg="bg.input"
                borderColor="border.input"
                focusRingColor="brand.focusRing"
              />
            </Field.Root>
            <Field.Root>
              <Field.Label textStyle="label" color="fg.muted">
                POP3 Port
              </Field.Label>
              <Input
                type="number"
                placeholder="110"
                value={pop3Port}
                onChange={(e) => onPop3PortChange(e.target.value)}
                bg="bg.input"
                borderColor="border.input"
                focusRingColor="brand.focusRing"
              />
            </Field.Root>
          </>
        )}
        <Field.Root>
          <Field.Label textStyle="label" color="fg.muted">
            SMTP Host
          </Field.Label>
          <Input
            placeholder="smtp.example.com"
            value={smtpHost}
            onChange={(e) => onSmtpHostChange(e.target.value)}
            bg="bg.input"
            borderColor="border.input"
            focusRingColor="brand.focusRing"
          />
        </Field.Root>
        <Field.Root>
          <Field.Label textStyle="label" color="fg.muted">
            SMTP Port
          </Field.Label>
          <Input
            type="number"
            placeholder="465"
            value={smtpPort}
            onChange={(e) => onSmtpPortChange(e.target.value)}
            bg="bg.input"
            borderColor="border.input"
            focusRingColor="brand.focusRing"
          />
        </Field.Root>
      </Box>

      <Checkbox.Root
        checked={secure}
        onCheckedChange={(e) => onSecureChange(!!e.checked)}
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label textStyle="body-sm" color="fg">
          Use secure connection (SSL/TLS)
        </Checkbox.Label>
      </Checkbox.Root>

      <Button
        layerStyle="brand-button"
        disabled={
          !email ||
          !password ||
          !smtpHost ||
          !smtpPort ||
          (protocol === "imap" && (!imapHost || !imapPort)) ||
          (protocol === "pop3" && (!pop3Host || !pop3Port)) ||
          loading
        }
        loading={loading}
        loadingText="Connecting..."
        onClick={onSubmit}
      >
        <Plug size={15} />
        Connect
      </Button>
    </VStack>
  );
}
