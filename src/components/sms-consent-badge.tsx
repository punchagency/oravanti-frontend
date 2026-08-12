import { Box, HStack, Text } from "@chakra-ui/react";
import { MessageSquare, MessageSquareOff } from "lucide-react";

/**
 * Whether this person can be texted, and since when.
 *
 * Three states, not two. "No consent" (never asked, or asked and declined) is
 * meaningfully different from "opted out" — the first can be resolved by asking
 * them, the second cannot be resolved by the firm at all. Collapsing them into
 * one "SMS off" badge would invite staff to keep trying with the second group.
 */
export function SmsConsentBadge({
  smsConsent,
  smsConsentAt,
  smsOptOutAt,
  hasPhone = true,
}: {
  smsConsent: boolean;
  smsConsentAt?: string | null;
  smsOptOutAt?: string | null;
  /** No number on file makes consent moot. */
  hasPhone?: boolean;
}) {
  const date = (value?: string | null) =>
    value
      ? new Date(value).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null;

  const optedOut = Boolean(smsOptOutAt);
  const consented = smsConsent && !optedOut;

  const { label, detail, tone, Icon } = optedOut
    ? {
        label: "Opted out of SMS",
        detail: date(smsOptOutAt),
        tone: "accent.contractor",
        Icon: MessageSquareOff,
      }
    : consented
      ? {
          label: "SMS consented",
          detail: date(smsConsentAt),
          tone: "accent.attorney",
          Icon: MessageSquare,
        }
      : {
          label: hasPhone ? "No SMS consent" : "No phone number",
          detail: null,
          tone: "fg.muted",
          Icon: MessageSquareOff,
        };

  return (
    <HStack
      gap="6px"
      px="8px"
      py="3px"
      borderRadius="999px"
      border="1px solid"
      borderColor="border.subtle"
      bg="bg.subtle"
      display="inline-flex"
      title={
        optedOut
          ? "This contact replied STOP. Only they can re-enable texts, by replying START."
          : undefined
      }
    >
      <Box color={tone} display="flex">
        <Icon size={12} />
      </Box>
      <Text fontSize="11px" color={tone} fontWeight="500" whiteSpace="nowrap">
        {label}
        {detail ? ` · ${detail}` : ""}
      </Text>
    </HStack>
  );
}
