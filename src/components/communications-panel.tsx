import type {
  NotificationChannel,
  NotificationRow,
  NotificationStatus,
} from "@/api/notifications";
import {
  useNotificationCapabilities,
  useNotifications,
} from "@/hooks/use-notifications";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { Box, Flex, HStack, Stack, Text } from "@chakra-ui/react";
import { Bell, Mail, MessageSquare } from "lucide-react";

/**
 * Everything the system tried to send about one lead, client, invoice or case.
 *
 * The point of this panel is the rows that did NOT send. A firm asking "why
 * didn't they get the questionnaire?" previously had nowhere to look — the
 * sends were fire-and-forget and the failures were log lines that had long
 * since rotated. "Skipped — no SMS consent" is the answer, and it only exists
 * because the backend records a row for a channel it deliberately declined.
 */

const CHANNEL_ICON: Record<NotificationChannel, typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  in_app: Bell,
};

const CHANNEL_LABEL: Record<NotificationChannel, string> = {
  email: "Email",
  sms: "SMS",
  in_app: "In-app",
};

/**
 * Human wording for the machine-readable skip reasons.
 *
 * Each says what happened AND what to do about it where there is something to
 * do — "no phone number on file" is actionable, "opted out" deliberately is
 * not, because reversing it is the recipient's decision alone.
 */
const SKIP_REASON_LABEL: Record<string, string> = {
  provider_unconfigured: "Text messaging is not set up",
  no_consent: "No SMS consent on file",
  opted_out: "Recipient opted out of SMS",
  email_suppressed_bounce: "Email suppressed — previously bounced",
  email_suppressed_complaint: "Email suppressed — marked as spam",
  email_suppressed_provider: "Email suppressed by the provider",
  firm_sms_disabled: "Text messaging is off for your firm",
  preference_off: "Turned off in notification settings",
  no_address: "No address on file",
  unparseable_phone: "Phone number could not be read",
  no_template: "No template for this channel",
  cancelled: "Cancelled",
};

const STATUS_STYLE: Record<
  NotificationStatus,
  { label: string; fg: string; bg: string }
> = {
  pending: { label: "Pending", fg: "fg.muted", bg: "bg.muted" },
  queued: { label: "Queued", fg: "fg.muted", bg: "bg.muted" },
  sending: { label: "Sending", fg: "fg.muted", bg: "bg.muted" },
  sent: { label: "Sent", fg: "fg", bg: "bg.subtle" },
  delivered: { label: "Delivered", fg: "accent.attorney", bg: "bg.subtle" },
  failed: { label: "Failed", fg: "accent.contractor", bg: "bg.subtle" },
  skipped: { label: "Not sent", fg: "accent.staff", bg: "bg.subtle" },
  cancelled: { label: "Cancelled", fg: "fg.subtle", bg: "bg.muted" },
};

/** "questionnaire_sent" → "Questionnaire sent". */
const humanizeEvent = (event: string) => {
  const words = event.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const formatWhen = (value: string | null) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

function StatusChip({ status }: { status: NotificationStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <Box
      px="8px"
      py="2px"
      borderRadius="999px"
      bg={style.bg}
      border="1px solid"
      borderColor="border.subtle"
      fontSize="11px"
      fontWeight="500"
      color={style.fg}
      whiteSpace="nowrap"
    >
      {style.label}
    </Box>
  );
}

function NotificationItem({
  row,
  emailTrackingAvailable,
}: {
  row: NotificationRow;
  emailTrackingAvailable: boolean;
}) {
  const Icon = CHANNEL_ICON[row.channel];

  const detail =
    row.status === "skipped"
      ? (SKIP_REASON_LABEL[row.skipReason ?? ""] ??
        row.skipReason ??
        "Not sent")
      : row.status === "failed"
        ? (row.failureReason ?? "Delivery failed")
        : null;

  // An email that stops at "sent" is FINAL when the deployment has no delivery
  // webhook — saying so beats leaving it looking stuck forever.
  const noTracking =
    row.channel === "email" && row.status === "sent" && !emailTrackingAvailable;

  const when =
    formatWhen(row.deliveredAt) ??
    formatWhen(row.sentAt) ??
    formatWhen(row.sendAt) ??
    formatWhen(row.createdAt);

  return (
    <Flex
      align="flex-start"
      justify="space-between"
      gap="12px"
      py="12px"
      borderBottom="1px solid"
      borderColor="border.subtle"
      _last={{ borderBottom: "none" }}
    >
      <HStack gap="10px" align="flex-start" flex="1" minW="0">
        <Box color="fg.muted" mt="2px">
          <Icon size={14} />
        </Box>
        <Box minW="0">
          <Text fontSize="13px" color="fg" fontWeight="500">
            {humanizeEvent(row.event)}
          </Text>
          <Text fontSize="12px" color="fg.muted" mt="1px" truncate>
            {CHANNEL_LABEL[row.channel]}
            {row.recipientAddress ? ` · ${row.recipientAddress}` : ""}
          </Text>
          {detail && (
            <Text fontSize="12px" color="accent.staff" mt="2px">
              {detail}
            </Text>
          )}
          {noTracking && (
            <Text fontSize="11px" color="fg.subtle" mt="2px">
              Delivery confirmation is not available in this environment
            </Text>
          )}
          {row.attemptCount > 1 && row.status !== "skipped" && (
            <Text fontSize="11px" color="fg.subtle" mt="2px">
              {row.attemptCount} attempts
            </Text>
          )}
        </Box>
      </HStack>

      <Stack gap="4px" align="flex-end" flexShrink="0">
        <StatusChip status={row.status} />
        {when && (
          <Text fontSize="11px" color="fg.subtle" whiteSpace="nowrap">
            {when}
          </Text>
        )}
      </Stack>
    </Flex>
  );
}

export function CommunicationsPanel({
  leadId,
  clientId,
  invoiceId,
  caseId,
  limit = 20,
}: {
  leadId?: string;
  clientId?: string;
  invoiceId?: string;
  caseId?: string;
  limit?: number;
}) {
  const { data, isLoading } = useNotifications({
    leadId,
    clientId,
    invoiceId,
    caseId,
    limit,
  });
  const { data: capabilities } = useNotificationCapabilities();
  const emailTrackingAvailable = capabilities?.deliveryTracking.email ?? false;

  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      bg="bg"
      overflow="hidden"
    >
      <Box p="16px" borderBottom="1px solid" borderColor="border.subtle">
        <Text fontSize="14px" fontWeight="600" color="fg">
          Communications
        </Text>
        <Text fontSize="12px" color="fg.muted" mt="1">
          Every message sent — and every one deliberately not sent
        </Text>
      </Box>

      <Box px="16px" py="4px">
        {isLoading ? (
          <Stack gap="0" py="8px">
            {Array.from({ length: 3 }).map((_, i) => (
              <Flex key={i} justify="space-between" py="12px" gap="12px">
                <ThemeSkeleton h="14px" w="180px" borderRadius="4px" />
                <ThemeSkeleton h="18px" w="70px" borderRadius="999px" />
              </Flex>
            ))}
          </Stack>
        ) : !data?.data.length ? (
          <Text fontSize="13px" color="fg.muted" py="20px" textAlign="center">
            Nothing has been sent yet.
          </Text>
        ) : (
          <>
            <Stack gap="0">
              {data.data.map((row) => (
                <NotificationItem
                  key={row.id}
                  row={row}
                  emailTrackingAvailable={emailTrackingAvailable}
                />
              ))}
            </Stack>
            {data.pagination.total > data.data.length && (
              <Text
                fontSize="11px"
                color="fg.subtle"
                py="10px"
                textAlign="center"
              >
                Showing {data.data.length} of {data.pagination.total}
              </Text>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
