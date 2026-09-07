import type { QuestionnaireSendReason } from "@/api/questionnaires";
import { Alert, Text } from "@chakra-ui/react";

/**
 * Why this questionnaire arrived, said to the client in their own terms.
 *
 * A link that has been sent before means something different the second time,
 * and the difference is the whole point of the message: a correction is a
 * request to change an answer already given, and attention is a request to look
 * without necessarily changing. Sending all three as the same invitation is how
 * a client learns to ignore the third one.
 *
 * A plain new request says nothing here unless staff wrote a note — the page
 * itself already explains what to do, and a banner that repeats the obvious
 * teaches people to skip banners.
 */
export function SendReasonBanner({
  reason,
  note,
}: {
  reason: QuestionnaireSendReason;
  note: string | null;
}) {
  if (reason === "new" && !note) return null;

  const { status, title } = PRESENTATION[reason];

  return (
    <Alert.Root status={status} size="sm" mb={5}>
      <Alert.Indicator />
      <Alert.Content gap={0.5}>
        <Alert.Title fontSize="13px" fontWeight="500">
          {title}
        </Alert.Title>
        {note && (
          <Text fontSize="12px" color="fg.muted" lineHeight="17px">
            {note}
          </Text>
        )}
      </Alert.Content>
    </Alert.Root>
  );
}

const PRESENTATION: Record<
  QuestionnaireSendReason,
  { status: "info" | "warning"; title: string }
> = {
  new: { status: "info", title: "A message from your attorney's office" },
  correction: {
    status: "warning",
    title: "Some answers need correcting",
  },
  attention: {
    status: "warning",
    title: "Something needs your attention",
  },
};
