/**
 * AI case review dashboard pages.
 *
 * Placeholders for 2.2 (nav + routing); bodies are built in 2.3. Each is a
 * default-free named export so `App.tsx` can import them directly, matching the
 * other admin pages.
 */
import { Box, Heading, Text } from "@chakra-ui/react";

function Placeholder({ title }: { title: string }) {
  return (
    <Box p={6}>
      <Heading textStyle="heading">{title}</Heading>
      <Text color="fg.muted" mt={2}>
        Coming up in 2.3.
      </Text>
    </Box>
  );
}

export function AiReviewDashboardPage() {
  return <Placeholder title="AI case review" />;
}

export function AiReviewByCasePage() {
  return <Placeholder title="Issues by case" />;
}

export function AiReviewByDocumentPage() {
  return <Placeholder title="Document flags" />;
}

export function AiReviewResolutionLogPage() {
  return <Placeholder title="Resolution log" />;
}

export function AiReviewSettingsPage() {
  return <Placeholder title="AI review settings" />;
}
