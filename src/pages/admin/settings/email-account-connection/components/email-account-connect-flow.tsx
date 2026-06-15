import type { EmailProvider } from "@/api/email-accounts";
import {
  useClassifyEmailAccount,
  useConnectEmailAccountAuto,
  useConnectEmailAccountManual,
  useConnectGoogleOAuth,
  useConnectMicrosoftOAuth,
} from "@/hooks/use-email-accounts";
import { Box, Dialog, IconButton } from "@chakra-ui/react";
import { X } from "lucide-react";
import { useState } from "react";
import { StepEmailInput } from "./step-email-input";
import { StepIndicator } from "./step-indicator";
import { StepManualConfig } from "./step-manual-config";
import { StepProviderResult } from "./step-provider-result";

type EmailAccountConnectFlowProps = {
  open: boolean;
  onClose: () => void;
};

export function EmailAccountConnectFlow({
  open,
  onClose,
}: EmailAccountConnectFlowProps) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [provider, setProvider] = useState<EmailProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [manualPassword, setManualPassword] = useState("");
  const [manualProtocol, setManualProtocol] = useState<"imap" | "pop3">("imap");
  const [manualImapHost, setManualImapHost] = useState("");
  const [manualImapPort, setManualImapPort] = useState("993");
  const [manualPop3Host, setManualPop3Host] = useState("");
  const [manualPop3Port, setManualPop3Port] = useState("110");
  const [manualSmtpHost, setManualSmtpHost] = useState("");
  const [manualSmtpPort, setManualSmtpPort] = useState("465");
  const [manualSecure, setManualSecure] = useState(true);
  const PORTS = {
    imap: { secure: 993, insecure: 143 },
    pop3: { secure: 995, insecure: 110 },
    smtp: { secure: 465, insecure: 587 },
  } as const;

  const classifyMutation = useClassifyEmailAccount();
  const autoConnectMutation = useConnectEmailAccountAuto();
  const manualConnectMutation = useConnectEmailAccountManual();
  const googleOAuth = useConnectGoogleOAuth();
  const microsoftOAuth = useConnectMicrosoftOAuth();

  function handleOAuthConnect() {
    setRedirecting(true);
    const oauth = provider === "microsoft" ? microsoftOAuth : googleOAuth;
    // Small delay so the loading indicator renders before navigation
    setTimeout(() => oauth.connect(), 100);
  }

  function reset() {
    setStep(1);
    setEmail("");
    setPassword("");
    setProvider(null);
    setError(null);
    setManualEmail("");
    setManualPassword("");
    setManualProtocol("imap");
    setManualImapHost("");
    setManualImapPort("993");
    setManualPop3Host("");
    setManualPop3Port("110");
    setManualSmtpHost("");
    setManualSmtpPort("465");
    setManualSecure(true);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleBack() {
    setStep((s) => s - 1);
  }

  async function handleClassify() {
    const result = await classifyMutation.mutateAsync(email);
    setProvider(result.data.provider);
    setStep(2);
  }

  function goToManual() {
    const domain = email.split("@")[1] ?? "";
    setManualEmail(email);
    setManualPassword("");
    setManualProtocol("imap");
    setManualImapHost(`imap.${domain}`);
    setManualImapPort(String(PORTS.imap.secure));
    setManualPop3Host(`pop.${domain}`);
    setManualPop3Port(String(PORTS.pop3.secure));
    setManualSmtpHost(`smtp.${domain}`);
    setManualSmtpPort(String(PORTS.smtp.secure));
    setStep(3);
  }

  function handleSecureChange(secure: boolean) {
    setManualSecure(secure);
    setManualImapPort(String(secure ? PORTS.imap.secure : PORTS.imap.insecure));
    setManualPop3Port(String(secure ? PORTS.pop3.secure : PORTS.pop3.insecure));
    setManualSmtpPort(String(secure ? PORTS.smtp.secure : PORTS.smtp.insecure));
  }

  function handleProtocolChange(protocol: "imap" | "pop3") {
    setManualProtocol(protocol);
    if (protocol === "imap") {
      setManualImapPort(
        String(manualSecure ? PORTS.imap.secure : PORTS.imap.insecure),
      );
    } else {
      setManualPop3Port(
        String(manualSecure ? PORTS.pop3.secure : PORTS.pop3.insecure),
      );
    }
  }

  function handleSkipOAuth() {
    goToManual();
  }

  async function handleAutoConnect() {
    if (!password) {
      setError("Password is required");
      return;
    }
    setError(null);
    try {
      const result = await autoConnectMutation.mutateAsync({ email, password });
      if ("success" in result && result.success) {
        handleClose();
      } else {
        goToManual();
      }
    } catch {
      setError("Connection failed");
    }
  }

  async function handleManualConnect() {
    setError(null);
    try {
      await manualConnectMutation.mutateAsync({
        email: manualEmail,
        password: manualPassword,
        protocol: manualProtocol,
        ...(manualProtocol === "imap"
          ? { imapHost: manualImapHost, imapPort: Number(manualImapPort) }
          : { pop3Host: manualPop3Host, pop3Port: Number(manualPop3Port) }),
        smtpHost: manualSmtpHost,
        smtpPort: Number(manualSmtpPort),
        secure: manualSecure,
      });
      handleClose();
    } catch {
      setError("Connection failed");
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) handleClose();
      }}
      size="lg"
      placement="center"
    >
      <Dialog.Backdrop backdropFilter="blur(1.5px)" />
      <Dialog.Positioner>
        <Dialog.Content rounded="lg" p="0" mx={{ base: 3, lg: 0 }}>
          <Dialog.CloseTrigger asChild>
            <IconButton
              variant="ghost"
              size="sm"
              color="fg.subtle"
              position="absolute"
              top="3"
              right="3"
              aria-label="Close"
            >
              <X size={16} />
            </IconButton>
          </Dialog.CloseTrigger>
          <Dialog.Header>
            <Dialog.Title />
          </Dialog.Header>
          <Dialog.Body p="6">
            <Box w="full">
              <StepIndicator
                step={step}
                total={3}
                showBack={step > 1}
                onBack={handleBack}
              />

              {error && (
                <Box
                  p="2.5"
                  border="1px solid"
                  borderColor="red.300"
                  borderRadius="md"
                  bg="red.50"
                  color="red.700"
                  fontSize="sm"
                  mb="5"
                >
                  {error}
                </Box>
              )}

              {step === 1 && (
                <StepEmailInput
                  email={email}
                  loading={classifyMutation.isPending}
                  onChange={setEmail}
                  onSubmit={handleClassify}
                />
              )}

              {step === 2 && provider && (
                <StepProviderResult
                  provider={provider}
                  password={password}
                  loading={autoConnectMutation.isPending}
                  oauthLoading={redirecting}
                  onPasswordChange={setPassword}
                  onSubmit={handleAutoConnect}
                  onOAuthConnect={handleOAuthConnect}
                  onSkipOAuth={handleSkipOAuth}
                />
              )}

              {step === 3 && (
                <StepManualConfig
                  email={manualEmail}
                  password={manualPassword}
                  protocol={manualProtocol}
                  imapHost={manualImapHost}
                  imapPort={manualImapPort}
                  pop3Host={manualPop3Host}
                  pop3Port={manualPop3Port}
                  smtpHost={manualSmtpHost}
                  smtpPort={manualSmtpPort}
                  secure={manualSecure}
                  loading={manualConnectMutation.isPending}
                  onEmailChange={setManualEmail}
                  onPasswordChange={setManualPassword}
                  onProtocolChange={handleProtocolChange}
                  onImapHostChange={setManualImapHost}
                  onImapPortChange={setManualImapPort}
                  onPop3HostChange={setManualPop3Host}
                  onPop3PortChange={setManualPop3Port}
                  onSmtpHostChange={setManualSmtpHost}
                  onSmtpPortChange={setManualSmtpPort}
                  onSecureChange={handleSecureChange}
                  onSubmit={handleManualConnect}
                />
              )}
            </Box>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
