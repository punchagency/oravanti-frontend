import type { OnboardingSession, PaymentAccount } from "@/api/payment-settings";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import {
  usePaymentAccount,
  useRefreshPaymentAccount,
  useStartOnboardingSession,
} from "@/hooks/use-payment-settings";
import { formatDateTime } from "@/utils/date";
import { Badge, Box, Button, Flex, HStack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { ConfidoOnboarding } from "./confido-onboarding";

/**
 * Payment processing — the firm's merchant account with Confido Legal.
 *
 * Distinct from the Subscription tab beside it, which is the firm's own plan
 * with us. This one is money flowing the other way: what the firm's clients pay
 * them.
 *
 * Slice 1 connects the account and tracks underwriting. It does not take
 * payments, and the copy here says so rather than implying otherwise.
 */

const Card = ({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) => (
  <Box border="1px solid" borderColor="border" borderRadius="10px" bg="bg">
    <Box p="20px" borderBottom="1px solid" borderColor="border.subtle">
      <Text textStyle="label">{title}</Text>
    </Box>
    <Box p="20px">{children}</Box>
    {footer && (
      <Box p="16px 20px" borderTop="1px solid" borderColor="border.subtle">
        {footer}
      </Box>
    )}
  </Box>
);

const Muted = ({ children }: { children: React.ReactNode }) => (
  <Text fontSize="13px" color="fg.muted" lineHeight="1.6">
    {children}
  </Text>
);

export default function PaymentsTab() {
  const { data: account, isLoading } = usePaymentAccount();
  const startSession = useStartOnboardingSession();
  const refresh = useRefreshPaymentAccount();
  const [session, setSession] = useState<OnboardingSession | null>(null);

  const begin = () =>
    startSession.mutate(undefined, { onSuccess: setSession });

  if (isLoading || !account) {
    return (
      <Card title="Payment account">
        <ThemeSkeleton h="14px" w="220px" borderRadius="4px" mb="12px" />
        <ThemeSkeleton h="12px" w="320px" borderRadius="4px" />
      </Card>
    );
  }

  // The deployment itself has no Confido credentials. Nothing the firm can do,
  // so do not offer them a button.
  if (!account.configured) {
    return (
      <Card title="Payment account">
        <Muted>
          Online payments are not enabled on this deployment yet. Once they are,
          you will be able to set up your firm's payment account here.
        </Muted>
      </Card>
    );
  }

  return (
    <Flex direction="column" gap="20px">
      <StatusCard
        account={account}
        onRefresh={() => refresh.mutate()}
        refreshing={refresh.isPending}
      />

      {(account.state === "not_started" ||
        account.state === "token_unreadable") && (
        <Card title={account.state === "not_started" ? "Get set up" : "Reconnect"}>
          <Muted>
            {account.state === "not_started"
              ? "Set up a payment account so clients can pay invoices and retainers online. You will complete a short application, and approval usually takes two to three business days."
              : "Your stored payment credential could not be read. Reconnecting will restore access — no client data is affected."}
          </Muted>
          <Button
            mt="16px"
            layerStyle="brand-button"
            loading={startSession.isPending}
            onClick={begin}
          >
            {account.state === "not_started"
              ? "Set up payments"
              : "Reconnect payments"}
          </Button>
        </Card>
      )}

      {(account.state === "application_needed" ||
        account.state === "application_in_progress" ||
        account.state === "provisioning") && (
        <Card title="Your application">
          {session ? (
            <ConfidoOnboarding
              session={session}
              onSubmitted={() => {
                setSession(null);
                refresh.mutate();
              }}
            />
          ) : (
            <>
              <Muted>
                {account.state === "application_in_progress"
                  ? "You have a part-completed application. Continue where you left off — your progress is saved."
                  : "Complete a short application so we can set up your payment account."}
              </Muted>
              <Button
                mt="16px"
                layerStyle="brand-button"
                loading={startSession.isPending}
                onClick={begin}
              >
                {account.state === "application_in_progress"
                  ? "Continue application"
                  : "Start application"}
              </Button>
            </>
          )}
        </Card>
      )}
    </Flex>
  );
}

// ─── Status ──────────────────────────────────────────────────────────────────

const STATE_LABEL: Record<PaymentAccount["state"], string> = {
  not_configured: "Unavailable",
  not_started: "Not set up",
  provisioning: "Setting up",
  application_needed: "Application needed",
  application_in_progress: "Application in progress",
  under_review: "Under review",
  active: "Connected",
  declined: "Declined",
  suspended: "Suspended",
  inactive: "Inactive",
  token_unreadable: "Needs reconnecting",
  unknown: "Unknown",
};

const STATE_TONE: Record<PaymentAccount["state"], string> = {
  not_configured: "gray",
  not_started: "gray",
  provisioning: "blue",
  application_needed: "orange",
  application_in_progress: "orange",
  under_review: "blue",
  active: "green",
  declined: "red",
  suspended: "red",
  inactive: "gray",
  token_unreadable: "red",
  unknown: "orange",
};

function StatusCard({
  account,
  onRefresh,
  refreshing,
}: {
  account: PaymentAccount;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const { state } = account;

  // Refreshing is only meaningful once there is a remote account to ask about.
  const canRefresh =
    state !== "not_started" && state !== "not_configured";

  return (
    <Card
      title="Payment account"
      footer={
        <Flex justify="space-between" align="center" gap="12px">
          <Text fontSize="12px" color="fg.subtle">
            {account.statusCheckedAt
              ? `Last checked ${formatDateTime(account.statusCheckedAt)}`
              : "Not yet checked"}
          </Text>
          {canRefresh && (
            <Button
              size="sm"
              variant="outline"
              loading={refreshing}
              onClick={onRefresh}
            >
              Refresh
            </Button>
          )}
        </Flex>
      }
    >
      <HStack gap="10px" mb="12px">
        <Badge colorPalette={STATE_TONE[state]}>{STATE_LABEL[state]}</Badge>
        {account.confidoFirmIdMasked && (
          <Text fontSize="12px" color="fg.subtle">
            Account {account.confidoFirmIdMasked}
          </Text>
        )}
      </HStack>

      <StateExplainer account={account} />

      {state === "active" && (
        <Box
          mt="16px"
          p="12px 14px"
          borderRadius="8px"
          bg="bg.subtle"
          border="1px solid"
          borderColor="border.subtle"
        >
          <Text fontSize="12px" color="fg.muted">
            Trust account{" "}
            {account.bankAccounts.trust ? "connected" : "not yet available"} ·
            Operating account{" "}
            {account.bankAccounts.operating ? "connected" : "not yet available"}
          </Text>
        </Box>
      )}
    </Card>
  );
}

function StateExplainer({ account }: { account: PaymentAccount }) {
  switch (account.state) {
    case "not_started":
      return (
        <Muted>
          Your firm has not set up online payments yet.
        </Muted>
      );

    case "provisioning":
      return (
        <Muted>
          We are creating your payment account. This takes a few seconds — if it
          does not move on, refresh.
        </Muted>
      );

    case "application_needed":
    case "application_in_progress":
      return (
        <Muted>
          Your account exists but the application is not finished. Complete it
          below to start underwriting.
        </Muted>
      );

    case "under_review":
      return (
        <Muted>
          Your application is with Confido's underwriting team. Approval usually
          takes two to three business days, and this page will update on its own
          when it lands.
        </Muted>
      );

    case "active":
      return (
        <Muted>
          Your payment account is approved and ready. Taking payments through
          Oravanti is not switched on yet — we will let you know when it is.
        </Muted>
      );

    // Terminal. Deliberately no retry button: underwriting has already asked for
    // follow-up and not received it, so a retry cannot work and offering one
    // would be worse than an honest dead end.
    case "declined":
      return (
        <Muted>
          Confido was not able to approve this application. Reapplying from here
          is not possible — contact support@confidolegal.com to discuss it.
        </Muted>
      );

    case "suspended":
      return (
        <Muted>
          Your payment account has been paused by the processor. Contact
          support@confidolegal.com to resolve it. Nothing in Oravanti is
          affected.
        </Muted>
      );

    case "inactive":
      return (
        <Muted>
          This payment account is no longer active. Contact
          support@confidolegal.com if that is unexpected.
        </Muted>
      );

    case "token_unreadable":
      return (
        <Muted>
          We could not read the stored credential for this account. Reconnect
          below — your firm's data is unaffected.
        </Muted>
      );

    // A status Confido has added that we do not recognise yet. Show it verbatim
    // rather than guessing, since the guess that costs most is "active".
    case "unknown":
      return (
        <Muted>
          Your account is in a state we do not recognise
          {account.status ? ` (“${account.status}”)` : ""}. Refresh, and contact
          support if it persists.
        </Muted>
      );

    default:
      return null;
  }
}
